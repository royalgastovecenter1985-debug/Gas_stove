import 'server-only';
import mysql, { type Pool, type ResultSetHeader } from 'mysql2/promise';

type Row = Record<string, unknown>;

const globalForDb = globalThis as unknown as { __rgsPool?: Pool };

function createPool(): Pool {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'royalgasstove',
    charset: 'utf8mb4',
    connectionLimit: 10,
    dateStrings: true, // keep TIMESTAMPs as 'YYYY-MM-DD HH:MM:SS' strings
    supportBigNumbers: true,
  });
  // Inquiry dates are shown in India time whatever time zone the hosting server uses.
  pool.pool.on('connection', (conn) => {
    conn.query(`SET time_zone = '${process.env.DB_TIMEZONE || '+05:30'}'`);
  });
  return pool;
}

// One pool per server process (survives hot reloads in development).
export const pool: Pool = globalForDb.__rgsPool ?? (globalForDb.__rgsPool = createPool());

/** SELECT → rows. Values are escaped by the driver (`?` placeholders). */
export async function query<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

export async function queryOne<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** INSERT / UPDATE / DELETE → result header (insertId, affectedRows). */
export async function execute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [res] = await pool.query(sql, params);
  return res as ResultSetHeader;
}

/** MariaDB returns JSON columns as text, MySQL as parsed values — accept both. */
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

/** Escape LIKE wildcards in user input. */
export function likeTerm(q: string): string {
  return '%' + q.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
}
