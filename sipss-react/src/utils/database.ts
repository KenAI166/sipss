// SQLite database layer using sql.js for web with localStorage fallback
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let db: Database | null = null;
let SQL: SqlJsStatic | null = null;
let isInitializing = false;
let isInitialized = false;
let initPromise: Promise<void> | null = null;
let useLocalStorageFallback = false;

// Initialize SQL.js and database
export async function initDatabase(): Promise<void> {
  if (isInitialized) {
    return Promise.resolve();
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      // Load SQL.js with local WASM file from public folder
      try {
        SQL = await initSqlJs({
          locateFile: (file: string) => `${window.location.origin}/${file}`,
        });
      } catch (wasmError) {
        console.error('Failed to load local WASM, using localStorage fallback', wasmError);
        useLocalStorageFallback = true;
        initializeLocalStorageTables();
        console.log('Using localStorage fallback mode');
        return;
      }

      // Load or create database
      const savedDb = localStorage.getItem('sipss_sqlite_db');
      if (savedDb) {
        try {
          const uint8Array = new Uint8Array(JSON.parse(savedDb));
          db = new SQL.Database(uint8Array);
        } catch (parseError) {
          console.warn('Failed to parse saved database, creating new one', parseError);
          db = new SQL.Database();
          await createTables();
        }
      } else {
        db = new SQL.Database();
      }

      // Always run createTables to ensure new/missing tables are created (migrations)
      await createTables();

      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Error initializing database, switching to localStorage fallback:', error);
      useLocalStorageFallback = true;
      initializeLocalStorageTables();
      console.log('Using localStorage fallback mode');
    } finally {
      isInitializing = false;
      isInitialized = true;
    }
  })();

  return initPromise;
}

// Save database to localStorage
function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const arr = Array.from(data);
    localStorage.setItem('sipss_sqlite_db', JSON.stringify(arr));
  }
}

// Initialize localStorage fallback tables
function initializeLocalStorageTables(): void {
  const tables = ['products', 'sales', 'attendance', 'staff', 'payroll', 'expenses', 'inventory', 'schedules', 'ingredients', 'recipes', 'recipe_items', 'suppliers', 'stock_transactions'];
  tables.forEach(table => {
    if (!localStorage.getItem(`sipss_${table}`)) {
      localStorage.setItem(`sipss_${table}`, JSON.stringify([]));
    }
  });
}

// Helper functions for localStorage fallback
function getLocalStorageData(table: string): any[] {
  const data = localStorage.getItem(`sipss_${table}`);
  return data ? JSON.parse(data) : [];
}

function setLocalStorageData(table: string, data: any[]): void {
  localStorage.setItem(`sipss_${table}`, JSON.stringify(data));
}

function generateId(table: string): number {
  const data = getLocalStorageData(table);
  const maxId = data.reduce((max, item) => Math.max(max, item.id || 0), 0);
  return maxId + 1;
}

// Create all tables
async function createTables(): Promise<void> {
  if (!db) return;

  const tables = [
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      sku TEXT,
      is_active INTEGER DEFAULT 1,
      description TEXT,
      barcode TEXT,
      color TEXT DEFAULT '#22C55E'
    )`,
    `CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_number TEXT NOT NULL,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      customer_name TEXT,
      notes TEXT,
      cashier_name TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      staff_name TEXT NOT NULL,
      date TEXT NOT NULL,
      time_in TEXT,
      break_start TEXT,
      break_end TEXT,
      time_out TEXT,
      overtime_start TEXT,
      overtime_end TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      position TEXT,
      contact_number TEXT,
      qr_code TEXT UNIQUE,
      hourly_rate REAL DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS payroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      staff_name TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      total_hours REAL DEFAULT 0,
      total_break_hours REAL DEFAULT 0,
      net_hours REAL DEFAULT 0,
      gross_pay REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      late_deductions REAL DEFAULT 0,
      days_present INTEGER DEFAULT 0,
      days_absent INTEGER DEFAULT 0,
      days_late INTEGER DEFAULT 0,
      net_pay REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      deleted_at TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      current_quantity INTEGER NOT NULL,
      minimum_quantity INTEGER DEFAULT 10,
      unit TEXT DEFAULT 'pcs',
      last_updated TEXT NOT NULL,
      stock_type TEXT DEFAULT 'kitchen',
      category TEXT DEFAULT 'general'
    )`,
    `CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      unit TEXT DEFAULT 'pcs',
      current_quantity REAL DEFAULT 0,
      minimum_quantity REAL DEFAULT 10,
      reorder_quantity REAL DEFAULT 0,
      cost_per_unit REAL DEFAULT 0,
      supplier_id INTEGER,
      expiry_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      yield_quantity INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS recipe_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'pcs',
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      payment_terms TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS stock_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ingredient_id INTEGER,
      ingredient_name TEXT,
      transaction_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      quantity_before REAL NOT NULL,
      quantity_after REAL NOT NULL,
      reference_id TEXT,
      reference_type TEXT,
      reason TEXT,
      cost_per_unit REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      staff_name TEXT NOT NULL,
      date TEXT NOT NULL,
      shift_start TEXT NOT NULL,
      shift_end TEXT NOT NULL,
      notes TEXT
    )`,
  ];

  tables.forEach((sql) => {
    if (db) db.run(sql);
  });

  // Migration: add overtime columns to existing attendance table
  if (db) {
    try {
      db.run('ALTER TABLE attendance ADD COLUMN overtime_start TEXT');
    } catch (error) {
      // Column likely already exists
    }
    try {
      db.run('ALTER TABLE attendance ADD COLUMN overtime_end TEXT');
    } catch (error) {
      // Column likely already exists
    }
  }

  saveDatabase();
}

// Track last inserted ID for localStorage fallback
let lastInsertedId = 0;

// Helper function to parse INSERT column names from SQL
function parseInsertColumns(sql: string): string[] {
  const match = sql.match(/INSERT INTO\s+\w+\s*\(([^)]+)\)/i);
  if (!match) return [];
  return match[1].split(',').map(col => col.trim().replace(/['"`]/g, ''));
}

// Helper function to parse UPDATE column names from SQL
function parseUpdateColumns(sql: string): string[] {
  const match = sql.match(/SET\s+(.+?)\s+WHERE/i);
  if (!match) return [];
  return match[1].split(',').map(part => part.split('=')[0].trim().replace(/['"`]/g, ''));
}

// Helper function to run queries
function runQuery(sql: string, params: any[] = []): any[] {
  if (useLocalStorageFallback) {
    // Handle last_insert_rowid() queries
    if (sql.toLowerCase().includes('last_insert_rowid()')) {
      return [{ id: lastInsertedId }];
    }

    // Parse table name from SQL query for localStorage fallback
    const tableMatch = sql.match(/FROM\s+(\w+)/i) || sql.match(/UPDATE\s+(\w+)/i);
    if (tableMatch) {
      const tableName = tableMatch[1].toLowerCase();
      let data = getLocalStorageData(tableName);
      
      // Simple WHERE clause handling for basic queries
      if (sql.toLowerCase().includes('where')) {
        const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
        if (whereMatch) {
          const condition = whereMatch[1];
          // Handle simple WHERE id = ? conditions
          const idMatch = condition.match(/id\s*=\s*\?/i);
          if (idMatch && params.length > 0) {
            return data.filter((item: any) => item.id === params[0]);
          }
          // Handle WHERE is_active = 1
          const activeMatch = condition.match(/is_active\s*=\s*1/i);
          if (activeMatch) {
            return data.filter((item: any) => item.is_active === 1 || item.is_active === true);
          }
          // Handle WHERE deleted_at IS NULL / IS NOT NULL
          const nullDeletedMatch = condition.match(/deleted_at\s+IS\s+NULL/i);
          if (nullDeletedMatch) {
            return data.filter((item: any) => !item.deleted_at);
          }
          const notNullDeletedMatch = condition.match(/deleted_at\s+IS\s+NOT\s+NULL/i);
          if (notNullDeletedMatch) {
            return data.filter((item: any) => item.deleted_at);
          }
          // Handle WHERE staff_id = ?
          const staffIdMatch = condition.match(/staff_id\s*=\s*\?/i);
          if (staffIdMatch) {
            return data.filter((item: any) => item.staff_id === params[0]);
          }
          // Handle WHERE staff_id = ? AND date >= ? AND date <= ?
          const dateRangeMatch = condition.match(/date\s*>=\s*\?\s+AND\s+date\s*<=\s*\?/i);
          if (dateRangeMatch) {
            return data.filter((item: any) => item.date >= params[params.length - 2] && item.date <= params[params.length - 1]);
          }
        }
      }
      
      // Handle ORDER BY
      if (sql.toLowerCase().includes('order by')) {
        const orderMatch = sql.match(/ORDER BY\s+(\w+)(?:\s+(DESC|ASC))?/i);
        if (orderMatch) {
          const field = orderMatch[1];
          const direction = (orderMatch[2] || 'ASC').toUpperCase();
          return [...data].sort((a, b) => {
            if (direction === 'DESC') {
              return b[field] > a[field] ? 1 : -1;
            }
            return a[field] > b[field] ? 1 : -1;
          });
        }
      }
      
      return data;
    }
    return [];
  }
  
  if (!db) throw new Error('Database not initialized');
  
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: any[] = [];
  
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  
  stmt.free();
  return results;
}

// Helper function to run insert/update/delete
function runExecute(sql: string, params: any[] = []): void {
  console.log('runExecute db?', !!db, 'fallback?', useLocalStorageFallback, 'sql first 50:', sql.substring(0, 50));
  if (useLocalStorageFallback) {
    // Parse table name from SQL query
    const tableMatch = sql.match(/INSERT INTO\s+(\w+)/i) || sql.match(/UPDATE\s+(\w+)/i) || sql.match(/DELETE FROM\s+(\w+)/i);
    if (tableMatch) {
      const tableName = tableMatch[1].toLowerCase();
      let data = getLocalStorageData(tableName);
      
      if (sql.toLowerCase().startsWith('insert')) {
        // Generic INSERT - parse columns and map params
        const columns = parseInsertColumns(sql);
        const newItem: any = { id: generateId(tableName) };
        columns.forEach((col, index) => {
          if (params[index] !== undefined) {
            newItem[col] = params[index];
          }
        });
        data.push(newItem);
        lastInsertedId = newItem.id;
      } else if (sql.toLowerCase().startsWith('update')) {
        // Generic UPDATE - parse columns and find id from params
        const columns = parseUpdateColumns(sql);
        // Find the id parameter - assume it appears in a WHERE id = ? clause at the end
        const idMatch = sql.match(/WHERE\s+id\s*=\s*\?/i);
        if (idMatch && params.length > 0) {
          const id = params[params.length - 1];
          console.log('runExecute fallback UPDATE id:', id, 'params:', params, 'columns:', columns);
          data = data.map((item: any) => {
            if (item.id === id) {
              const updates: any = { ...item };
              columns.forEach((col, index) => {
                if (params[index] !== undefined) {
                  updates[col] = params[index];
                }
              });
              console.log('runExecute fallback UPDATE item:', item.id, '-> updates:', updates);
              return updates;
            }
            return item;
          });
        }
      } else if (sql.toLowerCase().startsWith('delete')) {
        // Handle DELETE
        if (params.length > 0) {
          data = data.filter((item: any) => item.id !== params[0]);
        }
      }
      
      setLocalStorageData(tableName, data);
    }
    return;
  }
  
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  saveDatabase();
}

// Products operations
export async function getProducts(): Promise<any[]> {
  return runQuery('SELECT * FROM products WHERE is_active = 1');
}

export async function getProductById(id: number): Promise<any | null> {
  const results = runQuery('SELECT * FROM products WHERE id = ?', [id]);
  return results[0] || null;
}

export async function saveProduct(product: any): Promise<any> {
  if (product.id) {
    runExecute(
      `UPDATE products SET name = ?, category = ?, price = ?, cost_price = ?, stock = ?, 
       sku = ?, is_active = ?, description = ?, barcode = ?, color = ? WHERE id = ?`,
      [
        product.name,
        product.category,
        product.price,
        product.cost_price || 0,
        product.stock || 0,
        product.sku || '',
        product.is_active !== undefined ? product.is_active : 1,
        product.description || '',
        product.barcode || '',
        product.color || '#22C55E',
        product.id,
      ]
    );
    return product;
  } else {
    runExecute(
      `INSERT INTO products (name, category, price, cost_price, stock, sku, is_active, description, barcode, color) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.name,
        product.category,
        product.price,
        product.cost_price || 0,
        product.stock || 0,
        product.sku || '',
        product.is_active !== undefined ? product.is_active : 1,
        product.description || '',
        product.barcode || '',
        product.color || '#22C55E',
      ]
    );
    const results = runQuery('SELECT last_insert_rowid() as id');
    return { ...product, id: results[0].id };
  }
}

export async function deleteProduct(id: number): Promise<void> {
  runExecute('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
}

// Sales operations
export async function getSales(): Promise<any[]> {
  return runQuery('SELECT * FROM sales ORDER BY created_at DESC');
}

export async function getSaleById(id: number): Promise<any | null> {
  const results = runQuery('SELECT * FROM sales WHERE id = ?', [id]);
  return results[0] || null;
}

export async function saveSale(sale: any): Promise<any> {
  if (sale.id) {
    runExecute(
      `UPDATE sales SET receipt_number = ?, items = ?, subtotal = ?, tax = ?, discount = ?, 
       total = ?, payment_method = ?, customer_name = ?, notes = ?, cashier_name = ? WHERE id = ?`,
      [
        sale.receipt_number,
        sale.items,
        sale.subtotal,
        sale.tax,
        sale.discount || 0,
        sale.total,
        sale.payment_method,
        sale.customer_name || '',
        sale.notes || '',
        sale.cashier_name || '',
        sale.id,
      ]
    );
    return sale;
  } else {
    runExecute(
      `INSERT INTO sales (receipt_number, items, subtotal, tax, discount, total, payment_method, customer_name, notes, cashier_name, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sale.receipt_number,
        sale.items,
        sale.subtotal,
        sale.tax,
        sale.discount || 0,
        sale.total,
        sale.payment_method,
        sale.customer_name || '',
        sale.notes || '',
        sale.cashier_name || '',
        sale.created_at || new Date().toISOString(),
      ]
    );
    const results = runQuery('SELECT last_insert_rowid() as id');
    return { ...sale, id: results[0].id };
  }
}

export async function deleteSale(id: number): Promise<void> {
  runExecute('DELETE FROM sales WHERE id = ?', [id]);
}

// Attendance operations
export async function getAttendance(): Promise<any[]> {
  return runQuery('SELECT * FROM attendance ORDER BY created_at DESC');
}

export async function getAttendanceById(id: number): Promise<any | null> {
  const results = runQuery('SELECT * FROM attendance WHERE id = ?', [id]);
  return results[0] || null;
}

export async function saveAttendance(attendance: any): Promise<any> {
  let recordToSave = { ...attendance };
  console.log('saveAttendance input:', attendance, 'recordToSave start:', recordToSave);

  // If id is missing, try to find an existing attendance record for this staff/date
  // so updates don't silently fail or create duplicates.
  if (!recordToSave.id && recordToSave.staff_id && recordToSave.date) {
    try {
      const existingRecords = await getAttendance();
      console.log('saveAttendance existingRecords:', existingRecords);
      const existing = existingRecords.find(
        (a: any) => a.staff_id === recordToSave.staff_id && a.date === recordToSave.date
      );
      console.log('saveAttendance existing match:', existing);
      if (existing) {
        recordToSave.id = existing.id;
        // Preserve values already recorded for fields the caller did not set
        Object.keys(existing).forEach((key) => {
          if (recordToSave[key] === null || recordToSave[key] === undefined) {
            recordToSave[key] = existing[key];
          }
        });
      }
    } catch (findError) {
      console.error('saveAttendance error finding existing record:', findError);
    }
  }

  console.log('saveAttendance recordToSave final:', recordToSave);

  if (recordToSave.id) {
    const updateParams = [
      recordToSave.staff_id,
      recordToSave.staff_name,
      recordToSave.date,
      recordToSave.time_in,
      recordToSave.break_start,
      recordToSave.break_end,
      recordToSave.time_out,
      recordToSave.overtime_start || null,
      recordToSave.overtime_end || null,
      recordToSave.notes || '',
      recordToSave.id,
    ];
    console.log('saveAttendance UPDATE params:', updateParams, 'break_start param:', recordToSave.break_start);
    try {
      runExecute(
        `UPDATE attendance SET staff_id = ?, staff_name = ?, date = ?, time_in = ?, break_start = ?,
         break_end = ?, time_out = ?, overtime_start = ?, overtime_end = ?, notes = ? WHERE id = ?`,
        updateParams
      );
      const allAfter = await getAttendance();
      const verify = allAfter.find((a: any) => a.id === recordToSave.id);
      console.log('saveAttendance UPDATE verify after save:', JSON.stringify(verify));
    } catch (updateError) {
      console.error('saveAttendance UPDATE error:', updateError);
      throw updateError;
    }
    return recordToSave;
  } else {
    const insertParams = [
      recordToSave.staff_id,
      recordToSave.staff_name,
      recordToSave.date,
      recordToSave.time_in,
      recordToSave.break_start,
      recordToSave.break_end,
      recordToSave.time_out,
      recordToSave.overtime_start || null,
      recordToSave.overtime_end || null,
      recordToSave.notes || '',
      recordToSave.created_at || new Date().toISOString(),
    ];
    console.log('saveAttendance INSERT params:', insertParams, 'break_start param:', recordToSave.break_start);
    try {
      runExecute(
        `INSERT INTO attendance (staff_id, staff_name, date, time_in, break_start, break_end, time_out, overtime_start, overtime_end, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        insertParams
      );
      const results = runQuery('SELECT last_insert_rowid() as id');
      console.log('saveAttendance INSERT result id:', results[0]?.id);
      return { ...recordToSave, id: results[0].id };
    } catch (insertError) {
      console.error('saveAttendance INSERT error:', insertError);
      throw insertError;
    }
  }
}

export async function deleteAttendance(id: number): Promise<void> {
  runExecute('DELETE FROM attendance WHERE id = ?', [id]);
}

// Staff operations
export async function getStaff(): Promise<any[]> {
  return runQuery('SELECT * FROM staff ORDER BY created_at DESC');
}

export async function getStaffById(id: number): Promise<any | null> {
  const results = runQuery('SELECT * FROM staff WHERE id = ?', [id]);
  return results[0] || null;
}

export async function getStaffByQRCode(qrCode: string): Promise<any | null> {
  const results = runQuery('SELECT * FROM staff WHERE qr_code = ?', [qrCode]);
  return results[0] || null;
}

export async function saveStaff(staff: any): Promise<any> {
  if (staff.id) {
    runExecute(
      `UPDATE staff SET name = ?, age = ?, position = ?, contact_number = ?, qr_code = ?, hourly_rate = ? WHERE id = ?`,
      [
        staff.name,
        staff.age || 0,
        staff.position,
        staff.contact_number || '',
        staff.qr_code || '',
        staff.hourly_rate || 0,
        staff.id,
      ]
    );
    return staff;
  } else {
    runExecute(
      `INSERT INTO staff (name, age, position, contact_number, qr_code, hourly_rate, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        staff.name,
        staff.age || 0,
        staff.position,
        staff.contact_number || '',
        staff.qr_code || '',
        staff.hourly_rate || 0,
        staff.created_at || new Date().toISOString(),
      ]
    );
    const results = runQuery('SELECT last_insert_rowid() as id');
    return { ...staff, id: results[0].id };
  }
}

export async function deleteStaff(id: number): Promise<void> {
  runExecute('DELETE FROM staff WHERE id = ?', [id]);
}

// Payroll operations
export async function getPayroll(): Promise<any[]> {
  return runQuery('SELECT * FROM payroll WHERE deleted_at IS NULL ORDER BY created_at DESC');
}

export async function getDeletedPayroll(): Promise<any[]> {
  return runQuery('SELECT * FROM payroll WHERE deleted_at IS NOT NULL ORDER BY created_at DESC');
}

export async function getPayrollById(id: number): Promise<any | null> {
  const results = runQuery('SELECT * FROM payroll WHERE id = ?', [id]);
  return results[0] || null;
}

export async function savePayroll(payroll: any): Promise<any> {
  if (payroll.id) {
    runExecute(
      `UPDATE payroll SET staff_id = ?, staff_name = ?, period_start = ?, period_end = ?, total_hours = ?, 
       total_break_hours = ?, net_hours = ?, gross_pay = ?, deductions = ?, late_deductions = ?, 
       days_present = ?, days_absent = ?, days_late = ?, net_pay = ?, status = ?, deleted_at = ? WHERE id = ?`,
      [
        payroll.staff_id,
        payroll.staff_name,
        payroll.period_start,
        payroll.period_end,
        payroll.total_hours || 0,
        payroll.total_break_hours || 0,
        payroll.net_hours || 0,
        payroll.gross_pay || 0,
        payroll.deductions || 0,
        payroll.late_deductions || 0,
        payroll.days_present || 0,
        payroll.days_absent || 0,
        payroll.days_late || 0,
        payroll.net_pay || 0,
        payroll.status || 'pending',
        payroll.deleted_at || null,
        payroll.id,
      ]
    );
    return payroll;
  } else {
    runExecute(
      `INSERT INTO payroll (staff_id, staff_name, period_start, period_end, total_hours, total_break_hours, net_hours, 
       gross_pay, deductions, late_deductions, days_present, days_absent, days_late, net_pay, status, deleted_at, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payroll.staff_id,
        payroll.staff_name,
        payroll.period_start,
        payroll.period_end,
        payroll.total_hours || 0,
        payroll.total_break_hours || 0,
        payroll.net_hours || 0,
        payroll.gross_pay || 0,
        payroll.deductions || 0,
        payroll.late_deductions || 0,
        payroll.days_present || 0,
        payroll.days_absent || 0,
        payroll.days_late || 0,
        payroll.net_pay || 0,
        payroll.status || 'pending',
        payroll.deleted_at || null,
        payroll.created_at || new Date().toISOString(),
      ]
    );
    const results = runQuery('SELECT last_insert_rowid() as id');
    return { ...payroll, id: results[0].id };
  }
}

export async function deletePayroll(id: number): Promise<void> {
  runExecute('UPDATE payroll SET deleted_at = ? WHERE id = ?', [new Date().toISOString(), id]);
}

export async function restorePayroll(id: number): Promise<void> {
  runExecute('UPDATE payroll SET deleted_at = NULL WHERE id = ?', [id]);
}

export async function calculatePayrollForPeriod(staffId: number, startDate: string, endDate: string): Promise<any> {
  const staff = await getStaffById(staffId);
  if (!staff) {
    throw new Error('Staff not found');
  }

  const attendance = await getAttendance();
  const periodAttendance = attendance.filter((a: any) => {
    const date = a.date;
    return a.staff_id === staffId && date >= startDate && date <= endDate;
  });

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
      totalHours += hours;
      daysPresent++;

      // Check if late (after 9:00 AM)
      if (timeIn.getHours() >= 9 && timeIn.getMinutes() > 0) {
        daysLate++;
      }
    } else {
      daysAbsent++;
    }

    if (record.break_start && record.break_end) {
      const breakStart = new Date(`2000-01-01 ${record.break_start}`);
      const breakEnd = new Date(`2000-01-01 ${record.break_end}`);
      const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
      totalBreakHours += breakHours;
    }
  });

  const netHours = totalHours - totalBreakHours;
  const grossPay = netHours * staff.hourly_rate;
  const lateDeductions = daysLate * (staff.hourly_rate * 0.5);
  const netPay = grossPay - lateDeductions;

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
    net_pay: netPay,
    status: 'pending',
  };
}

// Expenses operations
export async function getExpenses(): Promise<any[]> {
  return runQuery('SELECT * FROM expenses ORDER BY created_at DESC');
}

export async function getExpenseById(id: number): Promise<any | null> {
  const results = runQuery('SELECT * FROM expenses WHERE id = ?', [id]);
  return results[0] || null;
}

export async function saveExpense(expense: any): Promise<any> {
  if (expense.id) {
    runExecute(
      `UPDATE expenses SET description = ?, amount = ?, category = ?, date = ?, notes = ? WHERE id = ?`,
      [
        expense.description,
        expense.amount,
        expense.category,
        expense.date,
        expense.notes || '',
        expense.id,
      ]
    );
    return expense;
  } else {
    runExecute(
      `INSERT INTO expenses (description, amount, category, date, notes) VALUES (?, ?, ?, ?, ?)`,
      [
        expense.description,
        expense.amount,
        expense.category,
        expense.date,
        expense.notes || '',
      ]
    );
    const results = runQuery('SELECT last_insert_rowid() as id');
    return { ...expense, id: results[0].id };
  }
}

export async function deleteExpense(id: number): Promise<void> {
  runExecute('DELETE FROM expenses WHERE id = ?', [id]);
}

// Inventory operations
export async function getInventory(): Promise<any[]> {
  return runQuery('SELECT * FROM inventory ORDER BY last_updated DESC');
}

export async function getInventoryById(id: number): Promise<any | null> {
  const results = runQuery('SELECT * FROM inventory WHERE id = ?', [id]);
  return results[0] || null;
}

export async function saveInventory(inventory: any): Promise<any> {
  if (inventory.id) {
    runExecute(
      `UPDATE inventory SET product_id = ?, product_name = ?, current_quantity = ?, minimum_quantity = ?, 
       unit = ?, last_updated = ?, stock_type = ?, category = ? WHERE id = ?`,
      [
        inventory.product_id,
        inventory.product_name,
        inventory.current_quantity,
        inventory.minimum_quantity || 10,
        inventory.unit || 'pcs',
        inventory.last_updated || new Date().toISOString(),
        inventory.stock_type || 'kitchen',
        inventory.category || 'general',
        inventory.id,
      ]
    );
    return inventory;
  } else {
    runExecute(
      `INSERT INTO inventory (product_id, product_name, current_quantity, minimum_quantity, unit, last_updated, stock_type, category) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inventory.product_id,
        inventory.product_name,
        inventory.current_quantity,
        inventory.minimum_quantity || 10,
        inventory.unit || 'pcs',
        inventory.last_updated || new Date().toISOString(),
        inventory.stock_type || 'kitchen',
        inventory.category || 'general',
      ]
    );
    const results = runQuery('SELECT last_insert_rowid() as id');
    return { ...inventory, id: results[0].id };
  }
}

export async function deleteInventory(id: number): Promise<void> {
  runExecute('DELETE FROM inventory WHERE id = ?', [id]);
}

// Schedule operations
export async function getSchedules(): Promise<any[]> {
  return runQuery('SELECT * FROM schedules ORDER BY date DESC');
}

export async function getScheduleById(id: number): Promise<any | null> {
  const results = runQuery('SELECT * FROM schedules WHERE id = ?', [id]);
  return results[0] || null;
}

export async function saveSchedule(schedule: any): Promise<any> {
  if (schedule.id) {
    runExecute(
      `UPDATE schedules SET staff_id = ?, staff_name = ?, date = ?, shift_start = ?, shift_end = ?, notes = ? WHERE id = ?`,
      [
        schedule.staff_id,
        schedule.staff_name,
        schedule.date,
        schedule.shift_start,
        schedule.shift_end,
        schedule.notes || '',
        schedule.id,
      ]
    );
    return schedule;
  } else {
    runExecute(
      `INSERT INTO schedules (staff_id, staff_name, date, shift_start, shift_end, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        schedule.staff_id,
        schedule.staff_name,
        schedule.date,
        schedule.shift_start,
        schedule.shift_end,
        schedule.notes || '',
      ]
    );
    const results = runQuery('SELECT last_insert_rowid() as id');
    return { ...schedule, id: results[0].id };
  }
}

export async function deleteSchedule(id: number): Promise<void> {
  runExecute('DELETE FROM schedules WHERE id = ?', [id]);
}

// Ingredient operations
export async function getIngredients(): Promise<any[]> {
  return runQuery('SELECT * FROM ingredients ORDER BY name ASC');
}

export async function getIngredientById(id: number): Promise<any | null> {
  const results = runQuery('SELECT * FROM ingredients WHERE id = ?', [id]);
  return results[0] || null;
}

export async function getLowStockIngredients(): Promise<any[]> {
  return runQuery('SELECT * FROM ingredients WHERE current_quantity <= minimum_quantity ORDER BY name ASC');
}

export async function saveIngredient(ingredient: any): Promise<any> {
  if (ingredient.id) {
    runExecute(
      `UPDATE ingredients SET name = ?, category = ?, unit = ?, current_quantity = ?, minimum_quantity = ?, 
       reorder_quantity = ?, cost_per_unit = ?, supplier_id = ?, expiry_date = ?, notes = ? WHERE id = ?`,
      [
        ingredient.name,
        ingredient.category || 'general',
        ingredient.unit || 'pcs',
        ingredient.current_quantity || 0,
        ingredient.minimum_quantity || 10,
        ingredient.reorder_quantity || 0,
        ingredient.cost_per_unit || 0,
        ingredient.supplier_id || null,
        ingredient.expiry_date || null,
        ingredient.notes || '',
        ingredient.id,
      ]
    );
    return ingredient;
  } else {
    runExecute(
      `INSERT INTO ingredients (name, category, unit, current_quantity, minimum_quantity, reorder_quantity, 
       cost_per_unit, supplier_id, expiry_date, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ingredient.name,
        ingredient.category || 'general',
        ingredient.unit || 'pcs',
        ingredient.current_quantity || 0,
        ingredient.minimum_quantity || 10,
        ingredient.reorder_quantity || 0,
        ingredient.cost_per_unit || 0,
        ingredient.supplier_id || null,
        ingredient.expiry_date || null,
        ingredient.notes || '',
        ingredient.created_at || new Date().toISOString(),
      ]
    );
    const results = runQuery('SELECT last_insert_rowid() as id');
    return { ...ingredient, id: results[0].id };
  }
}

export async function deleteIngredient(id: number): Promise<void> {
  runExecute('DELETE FROM ingredients WHERE id = ?', [id]);
  runExecute('DELETE FROM recipe_items WHERE ingredient_id = ?', [id]);
}

// Supplier operations
export async function getSuppliers(): Promise<any[]> {
  return runQuery('SELECT * FROM suppliers ORDER BY name ASC');
}

export async function getSupplierById(id: number): Promise<any | null> {
  const results = runQuery('SELECT * FROM suppliers WHERE id = ?', [id]);
  return results[0] || null;
}

export async function saveSupplier(supplier: any): Promise<any> {
  if (supplier.id) {
    runExecute(
      `UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, 
       payment_terms = ?, notes = ? WHERE id = ?`,
      [
        supplier.name,
        supplier.contact_person || '',
        supplier.phone || '',
        supplier.email || '',
        supplier.address || '',
        supplier.payment_terms || '',
        supplier.notes || '',
        supplier.id,
      ]
    );
    return supplier;
  } else {
    runExecute(
      `INSERT INTO suppliers (name, contact_person, phone, email, address, payment_terms, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        supplier.name,
        supplier.contact_person || '',
        supplier.phone || '',
        supplier.email || '',
        supplier.address || '',
        supplier.payment_terms || '',
        supplier.notes || '',
        supplier.created_at || new Date().toISOString(),
      ]
    );
    const results = runQuery('SELECT last_insert_rowid() as id');
    return { ...supplier, id: results[0].id };
  }
}

export async function deleteSupplier(id: number): Promise<void> {
  runExecute('DELETE FROM suppliers WHERE id = ?', [id]);
}

// Recipe operations
export async function getRecipes(): Promise<any[]> {
  return runQuery('SELECT r.*, p.name as product_name FROM recipes r JOIN products p ON r.product_id = p.id ORDER BY p.name ASC');
}

export async function getRecipeByProductId(productId: number): Promise<any | null> {
  const results = runQuery('SELECT * FROM recipes WHERE product_id = ?', [productId]);
  return results[0] || null;
}

export async function getRecipeById(id: number): Promise<any | null> {
  const results = runQuery('SELECT * FROM recipes WHERE id = ?', [id]);
  return results[0] || null;
}

export async function getRecipeItems(recipeId: number): Promise<any[]> {
  return runQuery(
    `SELECT ri.*, i.name as ingredient_name, i.unit as ingredient_unit, i.current_quantity 
     FROM recipe_items ri JOIN ingredients i ON ri.ingredient_id = i.id 
     WHERE ri.recipe_id = ? ORDER BY i.name ASC`,
    [recipeId]
  );
}

export async function saveRecipe(recipe: any): Promise<any> {
  if (recipe.id) {
    runExecute(
      `UPDATE recipes SET product_id = ?, product_name = ?, yield_quantity = ?, notes = ? WHERE id = ?`,
      [
        recipe.product_id,
        recipe.product_name,
        recipe.yield_quantity || 1,
        recipe.notes || '',
        recipe.id,
      ]
    );
    return recipe;
  } else {
    runExecute(
      `INSERT INTO recipes (product_id, product_name, yield_quantity, notes, created_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        recipe.product_id,
        recipe.product_name,
        recipe.yield_quantity || 1,
        recipe.notes || '',
        recipe.created_at || new Date().toISOString(),
      ]
    );
    const results = runQuery('SELECT last_insert_rowid() as id');
    return { ...recipe, id: results[0].id };
  }
}

export async function saveRecipeItem(recipeItem: any): Promise<any> {
  if (recipeItem.id) {
    runExecute(
      `UPDATE recipe_items SET recipe_id = ?, ingredient_id = ?, quantity = ?, unit = ?, notes = ? WHERE id = ?`,
      [
        recipeItem.recipe_id,
        recipeItem.ingredient_id,
        recipeItem.quantity,
        recipeItem.unit || 'pcs',
        recipeItem.notes || '',
        recipeItem.id,
      ]
    );
    return recipeItem;
  } else {
    runExecute(
      `INSERT INTO recipe_items (recipe_id, ingredient_id, quantity, unit, notes) VALUES (?, ?, ?, ?, ?)`,
      [
        recipeItem.recipe_id,
        recipeItem.ingredient_id,
        recipeItem.quantity,
        recipeItem.unit || 'pcs',
        recipeItem.notes || '',
      ]
    );
    const results = runQuery('SELECT last_insert_rowid() as id');
    return { ...recipeItem, id: results[0].id };
  }
}

export async function deleteRecipe(id: number): Promise<void> {
  runExecute('DELETE FROM recipe_items WHERE recipe_id = ?', [id]);
  runExecute('DELETE FROM recipes WHERE id = ?', [id]);
}

export async function deleteRecipeItem(id: number): Promise<void> {
  runExecute('DELETE FROM recipe_items WHERE id = ?', [id]);
}

// Stock transaction operations
export async function getStockTransactions(): Promise<any[]> {
  return runQuery('SELECT * FROM stock_transactions ORDER BY created_at DESC');
}

export async function getStockTransactionsByIngredient(ingredientId: number): Promise<any[]> {
  return runQuery('SELECT * FROM stock_transactions WHERE ingredient_id = ? ORDER BY created_at DESC', [ingredientId]);
}

export async function saveStockTransaction(transaction: any): Promise<any> {
  runExecute(
    `INSERT INTO stock_transactions (ingredient_id, ingredient_name, transaction_type, quantity, quantity_before, 
     quantity_after, reference_id, reference_type, reason, cost_per_unit, total_cost, notes, created_by, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transaction.ingredient_id,
      transaction.ingredient_name,
      transaction.transaction_type,
      transaction.quantity,
      transaction.quantity_before,
      transaction.quantity_after,
      transaction.reference_id || null,
      transaction.reference_type || null,
      transaction.reason || '',
      transaction.cost_per_unit || 0,
      transaction.total_cost || 0,
      transaction.notes || '',
      transaction.created_by || '',
      transaction.created_at || new Date().toISOString(),
    ]
  );
  const results = runQuery('SELECT last_insert_rowid() as id');
  return { ...transaction, id: results[0].id };
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
  const ingredient = await getIngredientById(ingredientId);
  if (!ingredient) {
    throw new Error('Ingredient not found');
  }

  const quantityBefore = ingredient.current_quantity;
  const quantityAfter = quantityBefore + quantityChange;
  const costPerUnit = ingredient.cost_per_unit || 0;
  const totalCost = Math.abs(quantityChange) * costPerUnit;

  // Update ingredient stock
  await saveIngredient({ ...ingredient, current_quantity: quantityAfter });

  // Log transaction
  await saveStockTransaction({
    ingredient_id: ingredientId,
    ingredient_name: ingredient.name,
    transaction_type: transactionType,
    quantity: quantityChange,
    quantity_before: quantityBefore,
    quantity_after: quantityAfter,
    reference_id: referenceId,
    reference_type: referenceType,
    reason: reason,
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
    let totalCost = 0;
    let deductions: string[] = [];

    for (const item of recipeItems) {
      const ingredient = await getIngredientById(item.ingredient_id);
      if (!ingredient) continue;

      const deductAmount = item.quantity * multiplier;
      const newQuantity = ingredient.current_quantity - deductAmount;

      if (newQuantity < 0) {
        throw new Error(`Insufficient stock for ${ingredient.name}: need ${deductAmount} ${ingredient.unit}, have ${ingredient.current_quantity}`);
      }

      await saveIngredient({ ...ingredient, current_quantity: newQuantity });
      totalCost += deductAmount * (ingredient.cost_per_unit || 0);
      deductions.push(`${ingredient.name}: -${deductAmount.toFixed(2)} ${ingredient.unit}`);

      await saveStockTransaction({
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
      });
    }

    return { 
      success: true, 
      message: `Stock deducted: ${deductions.join(', ')}`, 
      cost: totalCost 
    };
  } catch (error: any) {
    return { success: false, message: error.message, cost: 0 };
  }
}

// Database management
export async function resetDatabase(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }
  localStorage.removeItem('sipss_sqlite_db');
  await initDatabase();
}

export async function forceDatabaseReset(): Promise<{ success: boolean; message: string }> {
  try {
    await resetDatabase();
    return {
      success: true,
      message: 'Database has been reset successfully. The app will now use a fresh database.'
    };
  } catch (error) {
    console.error('Forced database reset failed:', error);
    return {
      success: false,
      message: 'Failed to reset database. Please try restarting the app.'
    };
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}
