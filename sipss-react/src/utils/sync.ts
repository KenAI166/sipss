// Offline sync layer: queues writes made while offline and replays them
// against Supabase when connectivity returns. Also keeps a localStorage
// snapshot of the last successful reads so the app keeps working offline.
import * as remote from './supabaseDatabase';

const QUEUE_KEY = 'sipss_pending_ops';
const SNAP_PREFIX = 'sipss_snapshot_';
const IDMAP_KEY = 'sipss_id_map';

export interface PendingOp {
  fn: string;                    // name of the remote function to call on replay
  args: any[];                   // arguments captured at queue time
  kind: 'save' | 'idOp';         // save ops carry a payload; idOp carry an id
  create?: boolean;              // save op where the row had no id yet
  localId?: number;              // id the local db assigned to an offline create
  createdAt: string;
}

export function isNetworkError(err: any): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const msg = String(err?.message || err || '').toLowerCase();
  return /failed to fetch|network ?error|network request failed|load failed|fetch failed|err_internet_disconnected|err_network/.test(msg);
}

function readQueue(): PendingOp[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}
function writeQueue(q: PendingOp[]): void {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* quota full — keep going */ }
}
function readIdMap(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(IDMAP_KEY) || '{}'); } catch { return {}; }
}
function writeIdMap(m: Record<string, number>): void {
  try { localStorage.setItem(IDMAP_KEY, JSON.stringify(m)); } catch {}
}

export function enqueue(op: Omit<PendingOp, 'createdAt'>): void {
  const q = readQueue();
  q.push({ ...op, createdAt: new Date().toISOString() });
  writeQueue(q);
}

export function pendingCount(): number {
  return readQueue().length;
}

// --- snapshot cache ---------------------------------------------------------

export function cacheRows(key: string, rows: any[]): void {
  try { localStorage.setItem(SNAP_PREFIX + key, JSON.stringify(rows)); } catch {}
}

export function readCachedRows<T = any>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(SNAP_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function upsertCached(key: string, row: any): void {
  const rows = readCachedRows<any>(key);
  if (!rows || !row) return;
  if (row.id != null) {
    const i = rows.findIndex(r => r.id === row.id);
    if (i >= 0) rows[i] = { ...rows[i], ...row };
    else rows.push(row);
  } else {
    rows.push(row);
  }
  cacheRows(key, rows);
}

export function removeCached(key: string, id: number): void {
  const rows = readCachedRows<any>(key);
  if (!rows) return;
  cacheRows(key, rows.filter(r => r.id !== id));
}

export function patchCached(key: string, id: number, patch: any): void {
  const rows = readCachedRows<any>(key);
  if (!rows) return;
  const i = rows.findIndex(r => r.id === id);
  if (i >= 0) {
    rows[i] = { ...rows[i], ...patch };
    cacheRows(key, rows);
  }
}

// --- queue replay -----------------------------------------------------------

const ID_KEY = /^(id|[a-zA-Z]+_id)$/;

function remapValue(value: any, idMap: Record<string, number>): any {
  if (typeof value === 'number' && idMap[String(value)] != null) return idMap[String(value)];
  if (Array.isArray(value)) return value.map(v => remapValue(v, idMap));
  if (value && typeof value === 'object') {
    const out: any = { ...value };
    for (const k of Object.keys(out)) {
      if (ID_KEY.test(k) || (out[k] && typeof out[k] === 'object')) {
        out[k] = remapValue(out[k], idMap);
      }
    }
    return out;
  }
  return value;
}

function remapArgs(args: any[], idMap: Record<string, number>): any[] {
  return args.map(a => {
    if (typeof a === 'number' && idMap[String(a)] != null) return idMap[String(a)];
    return remapValue(a, idMap);
  });
}

export async function flushQueue(): Promise<number> {
  const queue = readQueue();
  if (!queue.length) return 0;

  const idMap = readIdMap();
  const remaining: PendingOp[] = [];
  let synced = 0;

  for (let i = 0; i < queue.length; i++) {
    const op = queue[i];
    const fn = (remote as any)[op.fn];
    if (typeof fn !== 'function') continue;

    let args = remapArgs(op.args, idMap);
    // Rows created offline got a local id — strip it so Supabase generates one.
    if (op.kind === 'save' && op.create) {
      args = args.map(a => {
        if (a && typeof a === 'object' && 'id' in a) {
          const { id, ...rest } = a;
          return rest;
        }
        return a;
      });
    }

    try {
      const res = await fn(...args);
      if (op.localId != null && res && res.id != null) {
        idMap[String(op.localId)] = res.id;
        writeIdMap(idMap);
      }
      synced++;
    } catch (err) {
      if (isNetworkError(err)) {
        // Still offline — keep this op and everything after it for next time.
        remaining.push(op, ...queue.slice(i + 1));
        break;
      }
      // A real server error won't fix itself on retry; drop the op.
      console.warn('dropping unsyncable op', op.fn, err);
    }
  }

  writeQueue(remaining);
  return synced;
}
