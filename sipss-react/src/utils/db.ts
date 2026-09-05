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
}

// Local-only maintenance helpers (Supabase data is never reset from the client).
export const resetDatabase = local.resetDatabase;
export const forceDatabaseReset = local.forceDatabaseReset;
export const closeDatabase = local.closeDatabase;

export const pendingSyncCount = sync.pendingCount;

if (typeof window !== 'undefined' && isSupabaseConfigured) {
  window.addEventListener('online', () => {
    sync.flushQueue()
      .then(n => { if (n) console.log(`Synced ${n} pending change(s) to Supabase`); })
      .catch(() => {});
  });
}

// --- generic helpers ---------------------------------------------------------

async function list<T = any>(key: string, localFn: () => Promise<T[]>, remoteFn: () => Promise<T[]>): Promise<T[]> {
  if (!isSupabaseConfigured) return localFn();
  try {
    const rows = await remoteFn();
    sync.cacheRows(key, rows);
    return rows;
  } catch (err) {
    console.warn(`Remote list for "${key}" failed, falling back to local data:`, err);
    return sync.readCachedRows<T>(key) ?? localFn();
  }
}

async function one<T = any>(localFn: () => Promise<T>, remoteFn: () => Promise<T>): Promise<T> {
  if (!isSupabaseConfigured) return localFn();
  try {
    return await remoteFn();
  } catch (err) {
    console.warn('Remote one failed, falling back to local data:', err);
    return localFn();
  }
}

async function save(key: string, name: string, payload: any, localFn: (p: any) => Promise<any>, remoteFn: (p: any) => Promise<any>): Promise<any> {
  if (!isSupabaseConfigured) return localFn(payload);
  try {
    const res = await remoteFn(payload);
    sync.upsertCached(key, res);
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
    const res = await remoteFn(id);
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
    return await remoteFn();
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
export const getSaleById = (id: number) => one(() => local.getSaleById(id), () => remote.getSaleById(id));
export const saveSale = (s: any) => save('sales', 'saveSale', s, local.saveSale, remote.saveSale);
export const deleteSale = (id: number) => byId('sales', 'deleteSale', id, local.deleteSale, remote.deleteSale);

// --- payroll -----------------------------------------------------------------

export const getPayroll = () => list('payroll', local.getPayroll, remote.getPayroll);
export const getDeletedPayroll = () => list('payroll_deleted', local.getDeletedPayroll, remote.getDeletedPayroll);
export const getPayrollById = (id: number) => one(() => local.getPayrollById(id), () => remote.getPayrollById(id));
export const savePayroll = (p: any) => save('payroll', 'savePayroll', p, local.savePayroll, remote.savePayroll);
export const deletePayroll = (id: number) => byId('payroll', 'deletePayroll', id, local.deletePayroll, remote.deletePayroll, { deleted_at: new Date().toISOString() });
export const restorePayroll = (id: number) => byId('payroll', 'restorePayroll', id, local.restorePayroll, remote.restorePayroll, { deleted_at: null });
export const calculatePayrollForPeriod = (staffId: number, startDate: string, endDate: string) =>
  one(() => local.calculatePayrollForPeriod(staffId, startDate, endDate), () => remote.calculatePayrollForPeriod(staffId, startDate, endDate));

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
export const adjustIngredientStock = (ingredientId: number, quantityChange: number, transactionType: string, referenceId: string | null, referenceType: string | null, reason: string, createdBy: string) =>
  compound(
    () => local.adjustIngredientStock(ingredientId, quantityChange, transactionType, referenceId, referenceType, reason, createdBy),
    () => remote.adjustIngredientStock(ingredientId, quantityChange, transactionType, referenceId, referenceType, reason, createdBy),
    'stock adjustment'
  );
export const deductStockForSale = (productId: number, quantity: number, referenceId: string, createdBy: string) =>
  compound(
    () => local.deductStockForSale(productId, quantity, referenceId, createdBy),
    () => remote.deductStockForSale(productId, quantity, referenceId, createdBy),
    'stock deduction for sale'
  );
