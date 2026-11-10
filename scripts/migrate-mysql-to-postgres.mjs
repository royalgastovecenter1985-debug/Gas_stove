// One-time copy of the old MySQL (XAMPP) database into PostgreSQL (Neon).
//
//   node --env-file=.env.local scripts/migrate-mysql-to-postgres.mjs
//
// Reads MySQL from DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASS (defaults: local XAMPP)
// and writes to DATABASE_URL. Creates the tables from database/schema.postgres.sql, then
// REPLACES all rows in the PostgreSQL tables with the MySQL rows (safe to re-run).
import fs from 'node:fs';
import mysql from 'mysql2/promise';
import pg from 'pg';

const PG_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!PG_URL) {
  console.error('DATABASE_URL is not set (put it in .env.local).');
  process.exit(1);
}

// Parents before children (products need categories).
const TABLES = ['categories', 'products', 'inquiries', 'certificates', 'testimonials', 'reels', 'admin_users', 'settings'];
const JSON_COLS = { products: ['specs', 'images'] };
// DATETIME columns were written in India time (+05:30); TIMESTAMP columns are read as UTC below.
const IST_DATETIME_COLS = { admin_users: ['last_login_at'] };

const my = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'royalgasstove',
  timezone: 'Z',
  charset: 'utf8mb4',
});
await my.query("SET time_zone = '+00:00'");

const db = new pg.Client({ connectionString: PG_URL });
await db.connect();

try {
  console.log('Creating tables…');
  await db.query(fs.readFileSync(new URL('../database/schema.postgres.sql', import.meta.url), 'utf8'));

  await db.query('BEGIN');
  await db.query(`TRUNCATE ${[...TABLES, 'login_attempts'].join(', ')} RESTART IDENTITY CASCADE`);

  for (const table of TABLES) {
    const [rows] = await my.query(`SELECT * FROM \`${table}\``);
    for (const row of rows) {
      for (const c of JSON_COLS[table] ?? []) {
        if (row[c] != null && typeof row[c] !== 'string') row[c] = JSON.stringify(row[c]);
      }
      for (const c of IST_DATETIME_COLS[table] ?? []) {
        if (row[c] instanceof Date) row[c] = new Date(row[c].getTime() - 330 * 60_000);
      }
      const cols = Object.keys(row);
      const sql = `INSERT INTO ${table} (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${cols.map((_, i) => '$' + (i + 1)).join(', ')})`;
      await db.query(sql, cols.map((c) => row[c]));
    }
    if (table !== 'settings') {
      await db.query(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), (SELECT COUNT(*) > 0 FROM ${table}))`,
      );
    }
    console.log(`  ${table}: ${rows.length} rows`);
  }

  await db.query('COMMIT');
  console.log('Done ✓');
} catch (e) {
  await db.query('ROLLBACK').catch(() => {});
  console.error('Migration failed — no rows were changed in PostgreSQL:\n', e);
  process.exitCode = 1;
} finally {
  await my.end();
  await db.end();
}
