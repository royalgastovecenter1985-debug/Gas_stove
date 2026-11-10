import 'server-only';
import pg from 'pg';

type Row = Record<string, unknown>;

/** Result of INSERT / UPDATE / DELETE. */
export type ExecResult = { affectedRows: number };

// ---- How PostgreSQL values come back to JavaScript ----------------------------
// COUNT(*) and BIGINT arrive as strings by default; the site expects numbers.
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number(v));
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => Number(v));
// Dates are shown as 'YYYY-MM-DD HH:MM:SS' strings in India time, whatever time zone the server uses.
const TZ_OFFSET_MIN = parseOffset(process.env.DB_TIMEZONE || '+05:30');
const toLocalString = (v: string) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return new Date(d.getTime() + TZ_OFFSET_MIN * 60_000).toISOString().slice(0, 19).replace('T', ' ');
};
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, toLocalString);
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (v) => v.slice(0, 19));
pg.types.setTypeParser(pg.types.builtins.DATE, (v) => v);

function parseOffset(s: string): number {
  const m = /^([+-])(\d{1,2}):?(\d{2})$/.exec(s.trim());
  if (!m) return 330;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

// ---- Connection pool -------------------------------------------------------------
const globalForDb = globalThis as unknown as { __rgsPool?: pg.Pool };

function createPool(): pg.Pool {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) console.error('db: DATABASE_URL is not set');
  const pool = new pg.Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX || 5),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  });
  pool.on('error', (e) => console.error('db pool:', e.message));
  return pool;
}

// One pool per server process (survives hot reloads in development).
export const pool: pg.Pool = globalForDb.__rgsPool ?? (globalForDb.__rgsPool = createPool());

/** Turn MySQL-style `?` placeholders into PostgreSQL `$1, $2, …` (ignoring any inside quoted text). */
function toPg(sql: string): string {
  let n = 0;
  let out = '';
  let quote: string | null = null;
  for (const ch of sql) {
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
    } else if (ch === '?') {
      out += '$' + ++n;
      continue;
    }
    out += ch;
  }
  return out;
}

/** SELECT → rows. Values are sent separately from the SQL (`?` placeholders). */
export async function query<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(toPg(sql), params);
  return res.rows as T[];
}

export async function queryOne<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** INSERT / UPDATE / DELETE → number of affected rows. */
export async function execute(sql: string, params: unknown[] = []): Promise<ExecResult> {
  const res = await pool.query(toPg(sql), params);
  return { affectedRows: res.rowCount ?? 0 };
}

/** JSONB columns come back already parsed; older data may still be text — accept both. */
export function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

/** Escape LIKE wildcards in user input (use with ILIKE for case-insensitive search). */
export function likeTerm(q: string): string {
  return '%' + q.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
}
