import { supabase, isSupabaseConfigured } from './supabase';

export async function initDatabase(): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured. Attendance will not load from the cloud.');
  }
}

// Attendance operations
export async function getAttendance(): Promise<any[]> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('supabase getAttendance error:', error);
    throw error;
  }
  console.log('supabase getAttendance:', data);
  return data || [];
}

export async function saveAttendance(attendance: any): Promise<any> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const payload: any = { ...attendance };
  console.log('supabase saveAttendance input:', attendance, 'payload start:', payload);
  if (!payload.created_at) payload.created_at = new Date().toISOString();

  // Fast path: single round-trip via the upsert_attendance Postgres function.
  try {
    const { data, error } = await supabase.rpc('upsert_attendance', { p_record: payload });
    if (error) throw error;
    return data;
  } catch (err) {
    if (!isMissingFunction(err)) throw err;
    // Function not deployed yet — use the legacy find-then-write path below.
  }

  // If id is missing, try to find an existing attendance record for this staff/date
  // so updates don't silently fail or create duplicates.
  if (!payload.id && payload.staff_id && payload.date) {
    const { data: existing, error: findError } = await supabase
      .from('attendance')
      .select('id')
      .eq('staff_id', payload.staff_id)
      .eq('date', payload.date)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (findError) {
      console.error('supabase saveAttendance find existing error:', findError);
      throw findError;
    }
    console.log('supabase saveAttendance existing:', existing);
    if (existing?.id) {
      payload.id = existing.id;
    }
  }

  // Supabase id is GENERATED ALWAYS; we cannot provide it on INSERT/UPSERT.
  // Existing rows use .update(), new rows use .insert() without an id.
  if (payload.id) {
    const { id, ...updateData } = payload;
    console.log('supabase saveAttendance UPDATE id:', id, 'data:', updateData);
    const { data, error } = await supabase
      .from('attendance')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('supabase saveAttendance update error:', error);
      throw error;
    }
    console.log('supabase saveAttendance update result:', data);
    return data;
  }

  const { id, ...insertData } = payload; // drop any undefined id
  console.log('supabase saveAttendance INSERT data:', insertData);
  const { data, error } = await supabase
    .from('attendance')
    .insert(insertData)
    .select()
    .single();
  if (error) {
    console.error('supabase saveAttendance insert error:', error);
    throw error;
  }
  console.log('supabase saveAttendance insert result:', data);
  return data;
}

export async function getAttendanceById(id: number): Promise<any | null> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.from('attendance').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteAttendance(id: number): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('attendance').delete().eq('id', id);
  if (error) throw error;
}

// Staff operations
export async function getStaff(): Promise<any[]> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getStaffById(id: number): Promise<any | null> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.from('staff').select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getStaffByQRCode(qrCode: string): Promise<any | null> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.from('staff').select('*').eq('qr_code', qrCode).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function saveStaff(staff: any): Promise<any> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const payload = { ...staff };
  if (!payload.id) delete payload.id;
  if (!payload.created_at) payload.created_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('staff')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStaff(id: number): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('staff').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Shared helpers (used by the remaining modules)
// ---------------------------------------------------------------------------

function requireConfigured() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
}

// True when the RPC hasn't been deployed to the database yet — callers fall
// back to the multi-request implementation so the app keeps syncing before
// the new functions from supabase-schema.sql are applied.
function isMissingFunction(err: any): boolean {
  const msg = String(err?.message || '').toLowerCase();
  return err?.code === 'PGRST202' || msg.includes('could not find') || msg.includes('does not exist');
}

async function listRows(table: string, orderBy: string, ascending = false): Promise<any[]> {
  requireConfigured();
  const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending });
  if (error) throw error;
  return data || [];
}

async function getRowById(table: string, id: number): Promise<any | null> {
  requireConfigured();
  const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

// Update when payload.id exists, otherwise insert (id is generated by Postgres).
async function saveRow(table: string, payload: any): Promise<any> {
  requireConfigured();
  const row: any = { ...payload };
  if (row.id) {
    const { id, ...updateData } = row;
    const { data, error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  delete row.id;
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw error;
  return data;
}

async function deleteRow(table: string, id: number): Promise<void> {
  requireConfigured();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

// Product operations
export async function getProducts(): Promise<any[]> {
  requireConfigured();
  const { data, error } = await supabase.from('products').select('*').eq('is_active', true);
  if (error) throw error;
  return data || [];
}

export async function getProductById(id: number): Promise<any | null> {
  return getRowById('products', id);
}

export async function saveProduct(product: any): Promise<any> {
  // Only send columns that exist in the products table.
  const payload: any = {
    id: product.id,
    name: product.name,
    category: product.category,
    price: Number(product.price) || 0,
    cost_price: Number(product.cost_price) || 0,
    stock: Number(product.stock) || 0,
    sku: product.sku || null,
    barcode: product.barcode || null,
    color: product.color || '#22C55E',
    shape: product.shape || 'rectangle',
    description: product.description || null,
    is_active: product.is_active === undefined ? true : Boolean(product.is_active),
  };
  return saveRow('products', payload);
}

export async function deleteProduct(id: number): Promise<void> {
  requireConfigured();
  const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

// Sales operations
export async function getSales(): Promise<any[]> {
  requireConfigured();
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getDeletedSales(): Promise<any[]> {
  requireConfigured();
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getSaleById(id: number): Promise<any | null> {
  return getRowById('sales', id);
}

export async function saveSale(sale: any): Promise<any> {
  const payload = { ...sale };
  if (!payload.created_at) payload.created_at = new Date().toISOString();
  return saveRow('sales', payload);
}

// One-round-trip checkout: the process_sale Postgres function inserts the
// sale, deducts all recipe ingredient stock, logs stock transactions, and
// decrements product stock atomically. Replaces dozens of sequential
// PostgREST calls. See supabase-schema.sql for the function definition.
export async function processSale(
  sale: any,
  items: { product_id: number; quantity: number }[]
): Promise<{ sale_id: number; receipt_number: string }> {
  requireConfigured();
  const { data, error } = await supabase.rpc('process_sale', {
    p_sale: sale,
    p_items: items,
  });
  if (error) throw error;
  return data;
}

export async function deleteSale(id: number): Promise<void> {
  requireConfigured();
  const { error } = await supabase
    .from('sales')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function restoreSale(id: number): Promise<void> {
  requireConfigured();
  const { error } = await supabase.from('sales').update({ deleted_at: null }).eq('id', id);
  if (error) throw error;
}

// Payroll operations
export async function getPayroll(): Promise<any[]> {
  requireConfigured();
  const { data, error } = await supabase
    .from('payroll')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getDeletedPayroll(): Promise<any[]> {
  requireConfigured();
  const { data, error } = await supabase
    .from('payroll')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getPayrollById(id: number): Promise<any | null> {
  return getRowById('payroll', id);
}

export async function savePayroll(payroll: any): Promise<any> {
  const payload = { ...payroll };
  if (!payload.created_at) payload.created_at = new Date().toISOString();
  return saveRow('payroll', payload);
}

export async function deletePayroll(id: number): Promise<void> {
  requireConfigured();
  const { error } = await supabase
    .from('payroll')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function restorePayroll(id: number): Promise<void> {
  requireConfigured();
  const { error } = await supabase.from('payroll').update({ deleted_at: null }).eq('id', id);
  if (error) throw error;
}

export async function calculatePayrollForPeriod(staffId: number, startDate: string, endDate: string): Promise<any> {
  const staff = await getStaffById(staffId);
  if (!staff) throw new Error('Staff not found');

  const attendance = await getAttendance();
  const periodAttendance = attendance.filter((a: any) => {
    const date = a.date;
    return a.staff_id === staffId && date >= startDate && date <= endDate;
  });

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
}

// Expenses operations
export async function getExpenses(): Promise<any[]> {
  return listRows('expenses', 'created_at');
}

export async function getExpenseById(id: number): Promise<any | null> {
  return getRowById('expenses', id);
}

export async function saveExpense(expense: any): Promise<any> {
  return saveRow('expenses', expense);
}

export async function deleteExpense(id: number): Promise<void> {
  return deleteRow('expenses', id);
}

// Inventory operations
export async function getInventory(): Promise<any[]> {
  return listRows('inventory', 'last_updated');
}

export async function getInventoryById(id: number): Promise<any | null> {
  return getRowById('inventory', id);
}

export async function saveInventory(inventory: any): Promise<any> {
  const payload = { ...inventory };
  if (!payload.last_updated) payload.last_updated = new Date().toISOString();
  return saveRow('inventory', payload);
}

export async function deleteInventory(id: number): Promise<void> {
  return deleteRow('inventory', id);
}

// Schedule operations
export async function getSchedules(): Promise<any[]> {
  return listRows('schedules', 'date');
}

export async function getScheduleById(id: number): Promise<any | null> {
  return getRowById('schedules', id);
}

export async function saveSchedule(schedule: any): Promise<any> {
  return saveRow('schedules', schedule);
}

export async function deleteSchedule(id: number): Promise<void> {
  return deleteRow('schedules', id);
}

// Ingredient operations
export async function getIngredients(): Promise<any[]> {
  return listRows('ingredients', 'name', true);
}

export async function getIngredientById(id: number): Promise<any | null> {
  return getRowById('ingredients', id);
}

export async function getLowStockIngredients(): Promise<any[]> {
  requireConfigured();
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .filter('current_quantity', 'lte', 'minimum_quantity')
    .order('name');
  if (error) throw error;
  // PostgREST can't compare two columns via .filter; do it client-side instead.
  return (data || []).filter((i: any) => i.current_quantity <= i.minimum_quantity);
}

export async function saveIngredient(ingredient: any): Promise<any> {
  const payload = { ...ingredient };
  if (!payload.created_at) payload.created_at = new Date().toISOString();
  return saveRow('ingredients', payload);
}

export async function deleteIngredient(id: number): Promise<void> {
  return deleteRow('ingredients', id);
}

// Supplier operations
export async function getSuppliers(): Promise<any[]> {
  return listRows('suppliers', 'name', true);
}

export async function getSupplierById(id: number): Promise<any | null> {
  return getRowById('suppliers', id);
}

export async function saveSupplier(supplier: any): Promise<any> {
  const payload = { ...supplier };
  if (!payload.created_at) payload.created_at = new Date().toISOString();
  return saveRow('suppliers', payload);
}

export async function deleteSupplier(id: number): Promise<void> {
  return deleteRow('suppliers', id);
}

// Recipe operations
export async function getRecipes(): Promise<any[]> {
  return listRows('recipes', 'product_name', true);
}

export async function getRecipeByProductId(productId: number): Promise<any | null> {
  requireConfigured();
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('product_id', productId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRecipeById(id: number): Promise<any | null> {
  return getRowById('recipes', id);
}

export async function getRecipeItems(recipeId: number): Promise<any[]> {
  requireConfigured();
  const { data, error } = await supabase
    .from('recipe_items')
    .select('*, ingredients(name, unit, current_quantity)')
    .eq('recipe_id', recipeId);
  if (error) {
    // The ingredients(...) embed needs a foreign key on recipe_items.ingredient_id.
    // If it is missing, fall back to a manual join so recipes still load.
    const { data: items, error: itemsError } = await supabase
      .from('recipe_items')
      .select('*')
      .eq('recipe_id', recipeId);
    if (itemsError) throw itemsError;
    const ingredientIds = Array.from(new Set((items || []).map((i: any) => i.ingredient_id).filter((x: any) => x != null)));
    let ingredientMap: Record<string, any> = {};
    if (ingredientIds.length > 0) {
      const { data: ings } = await supabase
        .from('ingredients')
        .select('id, name, unit, current_quantity')
        .in('id', ingredientIds);
      (ings || []).forEach((ing: any) => { ingredientMap[ing.id] = ing; });
    }
    return (items || [])
      .map((item: any) => {
        const ing = ingredientMap[item.ingredient_id];
        return {
          ...item,
          ingredient_name: ing?.name ?? item.ingredient_name,
          ingredient_unit: ing?.unit ?? item.ingredient_unit,
          current_quantity: ing?.current_quantity ?? item.current_quantity,
        };
      })
      .sort((a: any, b: any) => String(a.ingredient_name).localeCompare(String(b.ingredient_name)));
  }
  return (data || [])
    .map((item: any) => ({
      ...item,
      ingredient_name: item.ingredients?.name ?? item.ingredient_name,
      ingredient_unit: item.ingredients?.unit ?? item.ingredient_unit,
      current_quantity: item.ingredients?.current_quantity ?? item.current_quantity,
      ingredients: undefined,
    }))
    .sort((a: any, b: any) => String(a.ingredient_name).localeCompare(String(b.ingredient_name)));
}

export async function saveRecipe(recipe: any): Promise<any> {
  const payload = { ...recipe };
  if (!payload.created_at) payload.created_at = new Date().toISOString();
  return saveRow('recipes', payload);
}

export async function saveRecipeItem(recipeItem: any): Promise<any> {
  return saveRow('recipe_items', recipeItem);
}

export async function deleteRecipe(id: number): Promise<void> {
  requireConfigured();
  // Both deletes are independent — run them in one parallel round-trip.
  const [{ error: itemsError }, { error }] = await Promise.all([
    supabase.from('recipe_items').delete().eq('recipe_id', id),
    supabase.from('recipes').delete().eq('id', id),
  ]);
  if (itemsError) throw itemsError;
  if (error) throw error;
}

export async function deleteRecipeItem(id: number): Promise<void> {
  return deleteRow('recipe_items', id);
}

// Stock transaction operations
export async function getStockTransactions(): Promise<any[]> {
  return listRows('stock_transactions', 'created_at');
}

export async function getStockTransactionsByIngredient(ingredientId: number): Promise<any[]> {
  requireConfigured();
  const { data, error } = await supabase
    .from('stock_transactions')
    .select('*')
    .eq('ingredient_id', ingredientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveStockTransaction(transaction: any): Promise<any> {
  const payload = { ...transaction };
  if (!payload.created_at) payload.created_at = new Date().toISOString();
  delete payload.id;
  const { data, error } = await supabase.from('stock_transactions').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function adjustIngredientStock(
  ingredientId: number,
  quantityChange: number,
  transactionType: string,
  referenceId: string | null,
  referenceType: string | null,
  reason: string,
  createdBy: string
): Promise<void> {
  // Fast path: single round-trip via the adjust_stock Postgres function.
  try {
    const { error } = await supabase.rpc('adjust_stock', {
      p_ingredient_id: ingredientId,
      p_quantity_change: quantityChange,
      p_transaction_type: transactionType,
      p_reference_id: referenceId,
      p_reference_type: referenceType,
      p_reason: reason,
      p_created_by: createdBy,
    });
    if (error) throw error;
    return;
  } catch (err) {
    if (!isMissingFunction(err)) throw err;
    // Function not deployed yet — use the legacy multi-request path below.
  }

  const ingredient = await getIngredientById(ingredientId);
  if (!ingredient) throw new Error('Ingredient not found');

  const quantityBefore = ingredient.current_quantity;
  const quantityAfter = quantityBefore + quantityChange;
  const costPerUnit = ingredient.cost_per_unit || 0;
  const totalCost = Math.abs(quantityChange) * costPerUnit;

  await saveIngredient({ ...ingredient, current_quantity: quantityAfter });
  await saveStockTransaction({
    ingredient_id: ingredientId,
    ingredient_name: ingredient.name,
    transaction_type: transactionType,
    quantity: quantityChange,
    quantity_before: quantityBefore,
    quantity_after: quantityAfter,
    reference_id: referenceId,
    reference_type: referenceType,
    reason,
    cost_per_unit: costPerUnit,
    total_cost: totalCost,
    created_by: createdBy,
  });
}

export async function deductStockForSale(
  productId: number,
  quantity: number,
  referenceId: string,
  createdBy: string
): Promise<{ success: boolean; message: string; cost: number }> {
  try {
    const recipe = await getRecipeByProductId(productId);
    if (!recipe) {
      return { success: true, message: 'No recipe found for product, no stock deducted', cost: 0 };
    }

    const recipeItems = await getRecipeItems(recipe.id);
    if (recipeItems.length === 0) {
      return { success: true, message: 'Recipe has no ingredients, no stock deducted', cost: 0 };
    }

    const yieldQuantity = recipe.yield_quantity || 1;
    const multiplier = quantity / yieldQuantity;

    // Fetch every ingredient in parallel — sequential round-trips made
    // checkout painfully slow for recipes with several ingredients.
    const ingredients = await Promise.all(
      recipeItems.map((item) => getIngredientById(item.ingredient_id))
    );

    // Validate the whole recipe BEFORE writing anything — previously the loop
    // deducted earlier ingredients and then threw on an insufficient one,
    // leaving stock partially deducted.
    interface PendingDeduction {
      ingredient: any;
      item: any;
      deductAmount: number;
      newQuantity: number;
    }
    const pending: PendingDeduction[] = [];
    for (let i = 0; i < recipeItems.length; i++) {
      const item = recipeItems[i];
      const ingredient = ingredients[i];
      if (!ingredient) continue;
      const deductAmount = item.quantity * multiplier;
      const newQuantity = ingredient.current_quantity - deductAmount;
      if (newQuantity < 0) {
        throw new Error(`Insufficient stock for ${ingredient.name}: need ${deductAmount} ${ingredient.unit}, have ${ingredient.current_quantity}`);
      }
      pending.push({ ingredient, item, deductAmount, newQuantity });
    }

    // Apply all updates and log all transactions in parallel.
    let totalCost = 0;
    const deductions: string[] = [];
    await Promise.all(
      pending.flatMap(({ ingredient, deductAmount, newQuantity }) => {
        totalCost += deductAmount * (ingredient.cost_per_unit || 0);
        deductions.push(`${ingredient.name}: -${deductAmount.toFixed(2)} ${ingredient.unit}`);
        return [
          saveIngredient({ ...ingredient, current_quantity: newQuantity }),
          saveStockTransaction({
            ingredient_id: ingredient.id,
            ingredient_name: ingredient.name,
            transaction_type: 'sale',
            quantity: -deductAmount,
            quantity_before: ingredient.current_quantity,
            quantity_after: newQuantity,
            reference_id: referenceId,
            reference_type: 'sale',
            reason: `Sold ${quantity} x ${recipe.product_name}`,
            cost_per_unit: ingredient.cost_per_unit || 0,
            total_cost: deductAmount * (ingredient.cost_per_unit || 0),
            created_by: createdBy,
          }),
        ];
      })
    );

    return { success: true, message: `Stock deducted: ${deductions.join(', ')}`, cost: totalCost };
  } catch (error: any) {
    return { success: false, message: error.message, cost: 0 };
  }
}

// Database management (no-ops for Supabase — data lives server-side)
export async function resetDatabase(): Promise<void> {}
export async function forceDatabaseReset(): Promise<{ success: boolean; message: string }> {
  return { success: false, message: 'Reset is not supported for Supabase storage' };
}
export async function closeDatabase(): Promise<void> {}
