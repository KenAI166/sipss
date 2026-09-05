import { isSupabaseConfigured } from './supabase';
import * as local from './database';
import * as remote from './supabaseDatabase';

console.log('db.ts isSupabaseConfigured:', isSupabaseConfigured);
const db = isSupabaseConfigured ? remote : local;

export const initDatabase = db.initDatabase;
export const resetDatabase = db.resetDatabase;
export const forceDatabaseReset = db.forceDatabaseReset;
export const closeDatabase = db.closeDatabase;

export const getAttendance = db.getAttendance;
export const saveAttendance = db.saveAttendance;
export const deleteAttendance = db.deleteAttendance;

export const getStaff = db.getStaff;
export const getStaffById = db.getStaffById;
export const getStaffByQRCode = db.getStaffByQRCode;
export const saveStaff = db.saveStaff;
export const deleteStaff = db.deleteStaff;

export const getProducts = db.getProducts;
export const getProductById = db.getProductById;
export const saveProduct = db.saveProduct;
export const deleteProduct = db.deleteProduct;

export const getSales = db.getSales;
export const getSaleById = db.getSaleById;
export const saveSale = db.saveSale;
export const deleteSale = db.deleteSale;

export const getPayroll = db.getPayroll;
export const getDeletedPayroll = db.getDeletedPayroll;
export const getPayrollById = db.getPayrollById;
export const savePayroll = db.savePayroll;
export const deletePayroll = db.deletePayroll;
export const restorePayroll = db.restorePayroll;
export const calculatePayrollForPeriod = db.calculatePayrollForPeriod;

export const getExpenses = db.getExpenses;
export const getExpenseById = db.getExpenseById;
export const saveExpense = db.saveExpense;
export const deleteExpense = db.deleteExpense;

export const getInventory = db.getInventory;
export const getInventoryById = db.getInventoryById;
export const saveInventory = db.saveInventory;
export const deleteInventory = db.deleteInventory;

export const getSchedules = db.getSchedules;
export const getScheduleById = db.getScheduleById;
export const saveSchedule = db.saveSchedule;
export const deleteSchedule = db.deleteSchedule;

export const getIngredients = db.getIngredients;
export const getIngredientById = db.getIngredientById;
export const getLowStockIngredients = db.getLowStockIngredients;
export const saveIngredient = db.saveIngredient;
export const deleteIngredient = db.deleteIngredient;

export const getSuppliers = db.getSuppliers;
export const getSupplierById = db.getSupplierById;
export const saveSupplier = db.saveSupplier;
export const deleteSupplier = db.deleteSupplier;

export const getRecipes = db.getRecipes;
export const getRecipeByProductId = db.getRecipeByProductId;
export const getRecipeById = db.getRecipeById;
export const getRecipeItems = db.getRecipeItems;
export const saveRecipe = db.saveRecipe;
export const saveRecipeItem = db.saveRecipeItem;
export const deleteRecipe = db.deleteRecipe;
export const deleteRecipeItem = db.deleteRecipeItem;

export const getStockTransactions = db.getStockTransactions;
export const getStockTransactionsByIngredient = db.getStockTransactionsByIngredient;
export const saveStockTransaction = db.saveStockTransaction;
export const adjustIngredientStock = db.adjustIngredientStock;
export const deductStockForSale = db.deductStockForSale;
