// Unified data layer: Supabase first, local (sql.js/localStorage) as fallback.
// Offline writes are queued and replayed to Supabase when the app comes back
// online; reads fall back to the last successful snapshot, then the local db.
import { isSupabaseConfigured } from './supabase';
import * as local from './database';
import * as remote from './supabaseDatabase';
import * as sync from './sync';

console.log('db.ts isSupabaseConfigured:', isSupabaseConfigured);

export async function initDatabase(): Promise<void> {
  // Always init the local engine so offline writes have somewhere to go.
  await local.initDatabase();
  await remote.initDatabase();
  if (isSupabaseConfigured && navigator.onLine) {
    sync.flushQueue()
      .then(n => { if (n) console.log(`Synced ${n} pending change(s) to Supabase`); })
      .catch(err => console.warn('offline sync failed', err));
  }
  migrateIngredientStockCategories().catch(err => console.warn('ingredient category migration failed', err));
}

// Ingredient categories that map to Counter Stock on the Inventory page.
// Keep in sync with COUNTER_INGREDIENT_CATEGORIES in components/Inventory.tsx.
const COUNTER_CATEGORIES = ['beverage', 'tea', 'coffee', 'syrup', 'packaging', 'supply', 'supplies', 'general', 'counter'];

// One-time data fix: these ingredients are kept at the service counter, so
// force their category to 'counter' whenever it currently maps to kitchen.
const COUNTER_INGREDIENT_NAMES = ['fresh milk', 'matcha'];

async function migrateIngredientStockCategories(): Promise<void> {
  const fix = async (getFn: () => Promise<any[]>, saveFn: (i: any) => Promise<any>): Promise<boolean> => {
    const ings = await getFn();
    let changed = false;
    for (const ing of ings) {
      const name = String(ing.name || '').toLowerCase();
      const cat = String(ing.category || '').toLowerCase();
      if (COUNTER_INGREDIENT_NAMES.some(n => name.includes(n)) && !COUNTER_CATEGORIES.includes(cat)) {
        await saveFn({ ...ing, category: 'counter' });
        changed = true;
      }
    }
    return changed;
  };
  try { await fix(local.getIngredients, local.saveIngredient); } catch { /* skip */ }
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      if (await fix(remote.getIngredients, remote.saveIngredient)) {
        sync.cacheRows('ingredients', await remote.getIngredients());
      }
    } catch { /* offline or missing table */ }
  }
}

// Local-only maintenance helpers (Supabase data is never reset from the client).
export const resetDatabase = local.resetDatabase;
export const forceDatabaseReset = local.forceDatabaseReset;
export const closeDatabase = local.closeDatabase;

export const pendingSyncCount = sync.pendingCount;

// Event fired after a manual sync so open pages can reload their data
// without a full browser refresh.
const SYNCED_EVENT = 'sipss:synced';

export function onSynced(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(SYNCED_EVENT, handler);
  return () => window.removeEventListener(SYNCED_EVENT, handler);
}

// Pull-to-sync: flush queued offline writes, re-fetch every table from
// Supabase, reconcile caches/local data (including remote deletes), then
// notify listeners so the current screen re-reads fresh data.
export async function syncNow(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured — nothing to sync.' };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { ok: false, message: 'You are offline. Changes will sync when you reconnect.' };
  }
  try {
    await sync.flushQueue();
  } catch (err) {
    console.warn('syncNow: flushQueue failed', err);
  }

  const tables: [string, () => Promise<any[]>][] = [
    ['products', remote.getProducts],
    ['sales', remote.getSales],
    ['inventory', remote.getInventory],
    ['ingredients', remote.getIngredients],
    ['recipes', remote.getRecipes],
    ['suppliers', remote.getSuppliers],
    ['stock_transactions', remote.getStockTransactions],
    ['attendance', remote.getAttendance],
    ['staff', remote.getStaff],
    ['payroll', remote.getPayroll],
    ['expenses', remote.getExpenses],
    ['schedules', remote.getSchedules],
  ];

  // Fetch all tables in parallel — sequential round-trips made the sync feel
  // very slow (12 tables × network latency each).
  const results = await Promise.allSettled(
    tables.map(async ([key, fn]) => reconcileLocal(key, await fn()))
  );
  let failed = 0;
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      failed++;
      console.warn(`syncNow: refresh for "${tables[i][0]}" failed`, r.reason);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SYNCED_EVENT));
  }
  return failed === 0
    ? { ok: true, message: 'All data synced successfully.' }
    : { ok: false, message: `Synced with ${failed} table${failed > 1 ? 's' : ''} failing — check the console.` };
}

if (typeof window !== 'undefined' && isSupabaseConfigured) {
  window.addEventListener('online', () => {
    sync.flushQueue()
      .then(n => { if (n) console.log(`Synced ${n} pending change(s) to Supabase`); })
      .catch(() => {});
  });
}

// --- generic helpers ---------------------------------------------------------

// After a successful remote fetch, replace the snapshot cache and drop local
// rows that were deleted in Supabase. Only ids present in the PREVIOUS
// snapshot (i.e. rows that actually came from Supabase) but absent now are
// pruned — local-only rows are never touched. `key` doubles as the local
// table name; synthetic keys (e.g. 'sales_deleted') are ignored.
async function reconcileLocal<T extends { id?: number }>(key: string, rows: T[]): Promise<void> {
  const prev = sync.readCachedRows<T>(key) || [];
  const prevIds = new Set<number>(prev.map(r => r.id).filter((id): id is number => id != null));
  sync.cacheRows(key, rows);
  const remoteIds = new Set<number>((rows || []).map(r => r.id).filter((id): id is number => id != null));
  const deletedIds = new Set<number>(Array.from(prevIds).filter(id => !remoteIds.has(id)));
  if (deletedIds.size === 0) return;
  try {
    await local.deleteLocalRowsByIds(key, deletedIds, sync.protectedLocalIds());
  } catch { /* pruning is best-effort */ }
}

// Remote calls can hang forever before ever reaching fetch (e.g. supabase-js
// waiting on an expired-session token refresh). Bound every awaited remote
// call so the caller can fall back to local data instead of freezing the UI.
const REMOTE_TIMEOUT_MS = 20000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(Object.assign(new Error(`${label} timed out`), { name: 'TimeoutError' }));
    }, REMOTE_TIMEOUT_MS);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

async function list<T extends { id?: number } = any>(key: string, localFn: () => Promise<T[]>, remoteFn: () => Promise<T[]>): Promise<T[]> {
  if (!isSupabaseConfigured) return localFn();
  const cached = sync.readCachedRows<T>(key);
  let localRows: T[] = [];
  try {
    localRows = await localFn();
  } catch (localErr) {
    console.warn(`Local fallback read for "${key}" failed:`, localErr);
  }
  const local = cached && cached.length > 0 ? cached : localRows;
  if (local.length > 0) {
    // We have local/cached data: show it immediately and refresh in the background
    // so the UI loads fast. The remote result will update the cache for next time.
    remoteFn().then((rows) => {
      reconcileLocal(key, rows || []);
    }).catch((err) => {
      console.warn(`Remote list refresh for "${key}" failed:`, err);
    });
    return local;
  }
  // No local/cached data yet: wait for remote.
  try {
    const rows = await withTimeout(remoteFn(), `Remote list for "${key}"`);
    await reconcileLocal(key, rows || []);
    return rows;
  } catch (err) {
    console.warn(`Remote list for "${key}" failed:`, err);
    return localRows;
  }
}

async function one<T = any>(localFn: () => Promise<T>, remoteFn: () => Promise<T>): Promise<T> {
  if (!isSupabaseConfigured) return localFn();
  try {
    const res = await withTimeout(remoteFn(), 'Remote one');
    // Remote may return null when the row only exists locally (e.g. created
    // offline or not yet synced) — check the local store before giving up.
    if (res === null || res === undefined) {
      const localRes = await localFn();
      return localRes ?? res;
    }
    return res;
  } catch (err) {
    console.warn('Remote one failed, falling back to local data:', err);
    return localFn();
  }
}

async function save(key: string, name: string, payload: any, localFn: (p: any) => Promise<any>, remoteFn: (p: any) => Promise<any>): Promise<any> {
  if (!isSupabaseConfigured) return localFn(payload);
  try {
    const res = await withTimeout(remoteFn(payload), `Remote save for "${key}"`);
    sync.upsertCached(key, res);
    // Also mirror the remote result to the local fallback database.
    try {
      await localFn(res);
    } catch (localErr) {
      console.warn(`Local fallback save for "${key}" failed:`, localErr);
    }
    return res;
  } catch (err) {
    console.warn(`Remote save for "${key}" failed, saving locally:`, err);
    const res = await localFn(payload);
    sync.upsertCached(key, res);
    if (sync.isNetworkError(err)) {
      sync.enqueue({ fn: name, args: [payload], kind: 'save', create: payload?.id == null, localId: res?.id });
    }
    return res;
  }
}

async function byId(key: string | null, name: string, id: number, localFn: (id: number) => Promise<any>, remoteFn: (id: number) => Promise<any>, softPatch?: any): Promise<any> {
  if (!isSupabaseConfigured) return localFn(id);
  try {
    const res = await withTimeout(remoteFn(id), `Remote byId for "${key}"`);
    if (key) { softPatch ? sync.patchCached(key, id, softPatch) : sync.removeCached(key, id); }
    return res;
  } catch (err) {
    console.warn(`Remote byId for "${key}" failed, using local data:`, err);
    const res = await localFn(id);
    if (key) { softPatch ? sync.patchCached(key, id, softPatch) : sync.removeCached(key, id); }
    if (sync.isNetworkError(err)) {
      sync.enqueue({ fn: name, args: [id], kind: 'idOp' });
    }
    return res;
  }
}

// Multi-step operations that cannot be replayed safely offline.
async function compound(localFn: () => Promise<any>, remoteFn: () => Promise<any>, label: string): Promise<any> {
  if (!isSupabaseConfigured) return localFn();
  try {
    return await withTimeout(remoteFn(), label);
  } catch (err) {
    console.warn(`${label} remote call failed, using local:`, err);
    return localFn();
  }
}

// --- attendance --------------------------------------------------------------

export const getAttendance = () => list('attendance', local.getAttendance, remote.getAttendance);
export const getAttendanceById = (id: number) => one(() => local.getAttendanceById(id), () => remote.getAttendanceById(id));
export const saveAttendance = (a: any) => save('attendance', 'saveAttendance', a, local.saveAttendance, remote.saveAttendance);
export const deleteAttendance = (id: number) => byId('attendance', 'deleteAttendance', id, local.deleteAttendance, remote.deleteAttendance);

// --- staff -------------------------------------------------------------------

export const getStaff = () => list('staff', local.getStaff, remote.getStaff);
export const getStaffById = (id: number) => one(() => local.getStaffById(id), () => remote.getStaffById(id));
export const getStaffByQRCode = (qrCode: string) => one(() => local.getStaffByQRCode(qrCode), () => remote.getStaffByQRCode(qrCode));
export const saveStaff = (s: any) => save('staff', 'saveStaff', s, local.saveStaff, remote.saveStaff);
export const deleteStaff = (id: number) => byId('staff', 'deleteStaff', id, local.deleteStaff, remote.deleteStaff);

// --- products ----------------------------------------------------------------

export const getProducts = () => list('products', local.getProducts, remote.getProducts);
export const getProductById = (id: number) => one(() => local.getProductById(id), () => remote.getProductById(id));
export const saveProduct = (p: any) => save('products', 'saveProduct', p, local.saveProduct, remote.saveProduct);
export const deleteProduct = (id: number) => byId('products', 'deleteProduct', id, local.deleteProduct, remote.deleteProduct, { is_active: false });

// --- sales -------------------------------------------------------------------

export const getSales = () => list('sales', local.getSales, remote.getSales);
export const getDeletedSales = () => list('sales_deleted', local.getDeletedSales, remote.getDeletedSales);
export const getSaleById = (id: number) => one(() => local.getSaleById(id), () => remote.getSaleById(id));
export const saveSale = (s: any) => save('sales', 'saveSale', s, local.saveSale, remote.saveSale);
export const deleteSale = (id: number) => byId('sales', 'deleteSale', id, local.deleteSale, remote.deleteSale);
export const restoreSale = (id: number) => byId('sales', 'restoreSale', id, local.restoreSale, remote.restoreSale);

// --- payroll -----------------------------------------------------------------

export const getPayroll = () => list('payroll', local.getPayroll, remote.getPayroll);
export const getDeletedPayroll = () => list('payroll_deleted', local.getDeletedPayroll, remote.getDeletedPayroll);
export const getPayrollById = (id: number) => one(() => local.getPayrollById(id), () => remote.getPayrollById(id));
export const savePayroll = (p: any) => save('payroll', 'savePayroll', p, local.savePayroll, remote.savePayroll);
export const deletePayroll = (id: number) => byId('payroll', 'deletePayroll', id, local.deletePayroll, remote.deletePayroll, { deleted_at: new Date().toISOString() });
export const restorePayroll = (id: number) => byId('payroll', 'restorePayroll', id, local.restorePayroll, remote.restorePayroll, { deleted_at: null });
// Compute payroll from the cache-first lists (getStaff/getAttendance) so the
// preview is instant once data is loaded — the remote implementation refetches
// staff + the whole attendance table over the network every call.
export const calculatePayrollForPeriod = async (staffId: number, startDate: string, endDate: string): Promise<any> => {
  const [staffList, attendance] = await Promise.all([getStaff(), getAttendance()]);
  const staff = staffList.find((s: any) => s.id === staffId);
  if (!staff) throw new Error('Staff not found');

  const periodAttendance = attendance.filter((a: any) =>
    a.staff_id === staffId && a.date >= startDate && a.date <= endDate
  );

  // Default hourly rate: ₱56/hr when the staff record has no rate set
  const hourlyRate = staff.hourly_rate > 0 ? staff.hourly_rate : 56;

  let totalHours = 0;
  let totalBreakHours = 0;
  let daysPresent = 0;
  let daysAbsent = 0;
  let daysLate = 0;

  periodAttendance.forEach((record: any) => {
    if (record.time_in && record.time_out) {
      const timeIn = new Date(`2000-01-01 ${record.time_in}`);
      const timeOut = new Date(`2000-01-01 ${record.time_out}`);
      const hours = (timeOut.getTime() - timeIn.getTime()) / (1000 * 60 * 60);
      if (hours > 0) {
        totalHours += hours;
        daysPresent++;
        if (timeIn.getHours() >= 9 && timeIn.getMinutes() > 0) daysLate++;
      } else {
        daysAbsent++;
      }
    } else {
      daysAbsent++;
    }

    if (record.break_start && record.break_end) {
      const breakStart = new Date(`2000-01-01 ${record.break_start}`);
      const breakEnd = new Date(`2000-01-01 ${record.break_end}`);
      const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
      if (breakHours > 0) totalBreakHours += breakHours;
    }
  });

  const netHours = totalHours - totalBreakHours;
  const grossPay = netHours * hourlyRate;
  const lateDeductions = daysLate * (hourlyRate * 0.5);

  return {
    staff_id: staffId,
    staff_name: staff.name,
    period_start: startDate,
    period_end: endDate,
    total_hours: totalHours,
    total_break_hours: totalBreakHours,
    net_hours: netHours,
    gross_pay: grossPay,
    deductions: 0,
    late_deductions: lateDeductions,
    days_present: daysPresent,
    days_absent: daysAbsent,
    days_late: daysLate,
    net_pay: grossPay - lateDeductions,
    status: 'pending',
  };
};

// --- expenses ----------------------------------------------------------------

export const getExpenses = () => list('expenses', local.getExpenses, remote.getExpenses);
export const getExpenseById = (id: number) => one(() => local.getExpenseById(id), () => remote.getExpenseById(id));
export const saveExpense = (e: any) => save('expenses', 'saveExpense', e, local.saveExpense, remote.saveExpense);
export const deleteExpense = (id: number) => byId('expenses', 'deleteExpense', id, local.deleteExpense, remote.deleteExpense);

// --- inventory ---------------------------------------------------------------

export const getInventory = () => list('inventory', local.getInventory, remote.getInventory);
export const getInventoryById = (id: number) => one(() => local.getInventoryById(id), () => remote.getInventoryById(id));
export const saveInventory = (i: any) => save('inventory', 'saveInventory', i, local.saveInventory, remote.saveInventory);
export const deleteInventory = (id: number) => byId('inventory', 'deleteInventory', id, local.deleteInventory, remote.deleteInventory);

// --- schedules ---------------------------------------------------------------

export const getSchedules = () => list('schedules', local.getSchedules, remote.getSchedules);
export const getScheduleById = (id: number) => one(() => local.getScheduleById(id), () => remote.getScheduleById(id));
export const saveSchedule = (s: any) => save('schedules', 'saveSchedule', s, local.saveSchedule, remote.saveSchedule);
export const deleteSchedule = (id: number) => byId('schedules', 'deleteSchedule', id, local.deleteSchedule, remote.deleteSchedule);

// --- ingredients -------------------------------------------------------------

export const getIngredients = () => list('ingredients', local.getIngredients, remote.getIngredients);
export const getIngredientById = (id: number) => one(() => local.getIngredientById(id), () => remote.getIngredientById(id));
export const getLowStockIngredients = () => list('ingredients_low', local.getLowStockIngredients, remote.getLowStockIngredients);
export const saveIngredient = (i: any) => save('ingredients', 'saveIngredient', i, local.saveIngredient, remote.saveIngredient);
export const deleteIngredient = (id: number) => byId('ingredients', 'deleteIngredient', id, local.deleteIngredient, remote.deleteIngredient);

// --- suppliers ---------------------------------------------------------------

export const getSuppliers = () => list('suppliers', local.getSuppliers, remote.getSuppliers);
export const getSupplierById = (id: number) => one(() => local.getSupplierById(id), () => remote.getSupplierById(id));
export const saveSupplier = (s: any) => save('suppliers', 'saveSupplier', s, local.saveSupplier, remote.saveSupplier);
export const deleteSupplier = (id: number) => byId('suppliers', 'deleteSupplier', id, local.deleteSupplier, remote.deleteSupplier);

// --- recipes -----------------------------------------------------------------

export const getRecipes = () => list('recipes', local.getRecipes, remote.getRecipes);
export const getRecipeByProductId = (productId: number) => one(() => local.getRecipeByProductId(productId), () => remote.getRecipeByProductId(productId));
export const getRecipeById = (id: number) => one(() => local.getRecipeById(id), () => remote.getRecipeById(id));
export const getRecipeItems = (recipeId: number) => list(`recipe_items_${recipeId}`, () => local.getRecipeItems(recipeId), () => remote.getRecipeItems(recipeId));
export const saveRecipe = (r: any) => save('recipes', 'saveRecipe', r, local.saveRecipe, remote.saveRecipe);
export const saveRecipeItem = (ri: any) => save('recipe_items', 'saveRecipeItem', ri, local.saveRecipeItem, remote.saveRecipeItem);
export const deleteRecipe = (id: number) => byId('recipes', 'deleteRecipe', id, local.deleteRecipe, remote.deleteRecipe);
export const deleteRecipeItem = (id: number) => byId('recipe_items', 'deleteRecipeItem', id, local.deleteRecipeItem, remote.deleteRecipeItem);

// --- stock transactions ------------------------------------------------------

export const getStockTransactions = () => list('stock_transactions', local.getStockTransactions, remote.getStockTransactions);
export const getStockTransactionsByIngredient = (ingredientId: number) =>
  list(`stock_transactions_${ingredientId}`, () => local.getStockTransactionsByIngredient(ingredientId), () => remote.getStockTransactionsByIngredient(ingredientId));
export const saveStockTransaction = (t: any) => save('stock_transactions', 'saveStockTransaction', t, local.saveStockTransaction, remote.saveStockTransaction);
// Stock writes happen inside these helpers, bypassing save()/the snapshot
// cache — refresh the cached lists afterwards so the UI isn't left stale.
async function refreshStockCaches(getIngs: () => Promise<any[]>, getTx: () => Promise<any[]>): Promise<void> {
  const [ings, tx] = await Promise.allSettled([getIngs(), getTx()]);
  if (ings.status === 'fulfilled') sync.cacheRows('ingredients', ings.value);
  if (tx.status === 'fulfilled') sync.cacheRows('stock_transactions', tx.value);
}

export const adjustIngredientStock = (ingredientId: number, quantityChange: number, transactionType: string, referenceId: string | null, referenceType: string | null, reason: string, createdBy: string) =>
  compound(
    async () => {
      const res = await local.adjustIngredientStock(ingredientId, quantityChange, transactionType, referenceId, referenceType, reason, createdBy);
      await refreshStockCaches(local.getIngredients, local.getStockTransactions);
      return res;
    },
    async () => {
      const res = await remote.adjustIngredientStock(ingredientId, quantityChange, transactionType, referenceId, referenceType, reason, createdBy);
      await refreshStockCaches(remote.getIngredients, remote.getStockTransactions);
      return res;
    },
    'stock adjustment'
  );
export const deductStockForSale = (productId: number, quantity: number, referenceId: string, createdBy: string) =>
  compound(
    async () => {
      const res = await local.deductStockForSale(productId, quantity, referenceId, createdBy);
      await refreshStockCaches(local.getIngredients, local.getStockTransactions);
      return res;
    },
    async () => {
      const res = await remote.deductStockForSale(productId, quantity, referenceId, createdBy);
      await refreshStockCaches(remote.getIngredients, remote.getStockTransactions);
      return res;
    },
    'stock deduction for sale'
  );

// Checkout in a single round-trip: the process_sale Postgres function does
// sale insert + ingredient deduction + stock transactions + product stock in
// one transaction. Falls back to the local multi-step path when offline or
// when the remote call fails, so orders still complete without connectivity.
export async function completeOrder(
  sale: any,
  cartItems: { product: any; quantity: number }[],
  createdBy: string
): Promise<{ success: boolean; message: string }> {
  const items = cartItems.map(i => ({ product_id: i.product.id, quantity: i.quantity }));

  if (isSupabaseConfigured && navigator.onLine) {
    try {
      const res = await withTimeout(
        remote.processSale(sale, items),
        'process sale'
      );
      const savedSale = res?.sale_id != null ? { ...sale, id: res.sale_id } : sale;
      sync.upsertCached('sales', savedSale);
      // Mirror to the local fallback db so reads stay consistent offline.
      try { await local.saveSale(savedSale); } catch { /* mirror is best-effort */ }
      // Stock + product quantities changed server-side — refresh caches so
      // the POS/Inventory screens don't show stale numbers.
      try { sync.cacheRows('products', await remote.getProducts()); } catch { /* keep stale cache */ }
      refreshStockCaches(remote.getIngredients, remote.getStockTransactions).catch(() => {});
      return { success: true, message: '' };
    } catch (err) {
      if (sync.isNetworkError(err)) {
        // Offline/timeout: queue the whole order so it replays atomically.
        sync.enqueue({ fn: 'processSale', args: [sale, items], kind: 'save', create: true });
      } else {
        // e.g. the function isn't deployed yet, or a business error like
        // insufficient stock — try the multi-request remote path so the sale
        // still syncs, and stock errors surface with their real message.
        try {
          return await completeOrderRemoteSteps(sale, cartItems, createdBy);
        } catch (err2) {
          console.warn('process_sale fallback failed, using local:', err2);
        }
      }
    }
  }

  // Local fallback: same steps the old multi-call path performed.
  for (const cartItem of cartItems) {
    const result = await local.deductStockForSale(
      cartItem.product.id,
      cartItem.quantity,
      sale.receipt_number,
      createdBy
    );
    if (!result.success) {
      return { success: false, message: result.message };
    }
  }
  await Promise.all(
    cartItems.map(cartItem =>
      local.saveProduct({ ...cartItem.product, stock: cartItem.product.stock - cartItem.quantity })
    )
  );
  const saved = await local.saveSale(sale);
  sync.upsertCached('sales', saved ?? sale);
  refreshStockCaches(local.getIngredients, local.getStockTransactions).catch(() => {});
  return { success: true, message: '' };
}

// Remote checkout without the RPC: same steps as the Postgres function, done
// as several PostgREST requests. Used when process_sale isn't deployed yet.
async function completeOrderRemoteSteps(
  sale: any,
  cartItems: { product: any; quantity: number }[],
  createdBy: string
): Promise<{ success: boolean; message: string }> {
  for (const cartItem of cartItems) {
    const result = await remote.deductStockForSale(
      cartItem.product.id,
      cartItem.quantity,
      sale.receipt_number,
      createdBy
    );
    if (!result.success) {
      return { success: false, message: result.message };
    }
  }
  await Promise.all(
    cartItems.map(cartItem =>
      remote.saveProduct({ ...cartItem.product, stock: cartItem.product.stock - cartItem.quantity })
    )
  );
  const saved = await remote.saveSale(sale);
  sync.upsertCached('sales', saved ?? sale);
  try { await local.saveSale(saved ?? sale); } catch { /* mirror is best-effort */ }
  try { sync.cacheRows('products', await remote.getProducts()); } catch { /* keep stale cache */ }
  refreshStockCaches(remote.getIngredients, remote.getStockTransactions).catch(() => {});
  return { success: true, message: '' };
}

export async function seedSampleData(): Promise<void> {
  try {
    const products = await getProducts();
    const ingredients = await getIngredients();
    if (products.length > 0 || ingredients.length > 0) return;

    const now = new Date().toISOString();

    const sampleProducts = [
      { name: 'Iced Espresso Latte', category: 'Coffee', price: 130, cost_price: 65, stock: 50, sku: 'COF-ESP-ICE', barcode: '100000000001', color: '#8B4513', description: 'Classic iced latte with espresso and milk', shape: 'circle' },
    ];

    const savedProducts: any[] = [];
    for (const p of sampleProducts) {
      savedProducts.push(await saveProduct(p));
    }

    const sampleIngredients = [
      { name: 'Espresso', category: 'beverage', unit: 'g', current_quantity: 500, minimum_quantity: 50, reorder_quantity: 100, cost_per_unit: 1.5, notes: 'Brewed espresso' },
      { name: 'Fresh Milk', category: 'dairy', unit: 'g', current_quantity: 5000, minimum_quantity: 500, reorder_quantity: 1000, cost_per_unit: 0.05, notes: 'Fresh milk' },
      { name: 'Ice Cubes', category: 'beverage', unit: 'g', current_quantity: 20000, minimum_quantity: 2000, reorder_quantity: 5000, cost_per_unit: 0.01, notes: 'Plain ice cubes' },
      { name: 'Dome Lid', category: 'packaging', unit: 'pcs', current_quantity: 100, minimum_quantity: 20, reorder_quantity: 50, cost_per_unit: 3, notes: '12oz dome lid' },
      { name: 'Sugar Syrup', category: 'beverage', unit: 'g', current_quantity: 2000, minimum_quantity: 200, reorder_quantity: 500, cost_per_unit: 0.1, notes: 'Simple syrup' },
    ];

    const savedIngredients: Record<string, number> = {};
    for (const i of sampleIngredients) {
      const saved = await saveIngredient({ ...i, created_at: now });
      savedIngredients[saved.name] = saved.id;
    }

    const recipeDefinitions = [
      {
        productName: 'Iced Espresso Latte',
        items: [
          { name: 'Espresso', quantity: 36, unit: 'g' },
          { name: 'Fresh Milk', quantity: 100, unit: 'g' },
          { name: 'Ice Cubes', quantity: 300, unit: 'g' },
          { name: 'Dome Lid', quantity: 1, unit: 'pcs' },
          { name: 'Sugar Syrup', quantity: 15, unit: 'g' },
        ],
      },
    ];

    for (const def of recipeDefinitions) {
      const product = savedProducts.find((p: any) => p.name === def.productName);
      if (!product) continue;
      const recipe = await saveRecipe({
        product_id: product.id,
        product_name: product.name,
        yield_quantity: 1,
        notes: 'Sample recipe - auto-deducts from inventory when sold',
        created_at: now,
      });
      for (const item of def.items) {
        await saveRecipeItem({
          recipe_id: recipe.id,
          ingredient_id: savedIngredients[item.name],
          quantity: item.quantity,
          unit: item.unit,
          notes: '',
        });
      }
    }
  } catch (error) {
    console.error('Error seeding sample data:', error);
  }
}
