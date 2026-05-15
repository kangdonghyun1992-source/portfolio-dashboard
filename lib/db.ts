import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;
let _initialized = false;

function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

async function initDb(client: Client) {
  if (_initialized) return;

  const statements = [
    `CREATE TABLE IF NOT EXISTS cash (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL DEFAULT '', month TEXT, account TEXT, amount REAL DEFAULT 0, note TEXT DEFAULT '')`,
    `CREATE TABLE IF NOT EXISTS stocks (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL DEFAULT '', month TEXT, platform TEXT DEFAULT '토스증권', name TEXT, ticker TEXT, quantity REAL DEFAULT 0, avg_price REAL DEFAULT 0, current_price REAL DEFAULT 0, currency TEXT DEFAULT 'USD', value_usd REAL, value_krw REAL DEFAULT 0, category TEXT DEFAULT '기타', domestic INTEGER DEFAULT 0, price_updated_at TEXT, locked INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS crypto (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL DEFAULT '', month TEXT, name TEXT, ticker TEXT, exchange TEXT DEFAULT '', quantity REAL DEFAULT 0, avg_price REAL DEFAULT 0, current_price REAL DEFAULT 0, value_krw REAL DEFAULT 0, category TEXT DEFAULT '기타', price_updated_at TEXT, locked INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS liabilities (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL DEFAULT '', month TEXT, name TEXT, amount REAL DEFAULT 0, rate REAL DEFAULT 0, note TEXT DEFAULT '')`,
    `CREATE TABLE IF NOT EXISTS pension (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL DEFAULT '', month TEXT, institution TEXT, type TEXT DEFAULT '', amount REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS real_estate (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL DEFAULT '', month TEXT, name TEXT, amount REAL DEFAULT 0, note TEXT DEFAULT '')`,
    `CREATE TABLE IF NOT EXISTS summary (user_id TEXT NOT NULL DEFAULT '', month TEXT, total_assets REAL DEFAULT 0, total_liabilities REAL DEFAULT 0, net_worth REAL DEFAULT 0, fx_rate REAL DEFAULT 1471.02, PRIMARY KEY (user_id, month))`,
    `CREATE TABLE IF NOT EXISTS saa_targets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, name TEXT NOT NULL, target_percent REAL NOT NULL, band REAL NOT NULL DEFAULT 3, tickers TEXT NOT NULL DEFAULT '', color TEXT NOT NULL DEFAULT '#737373', sort_order INTEGER DEFAULT 0, cash_floor REAL DEFAULT 0)`,
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }

  // Migration: add user_id to existing tables if missing
  const migrateTables = ["cash", "stocks", "crypto", "liabilities", "pension", "real_estate"];
  for (const table of migrateTables) {
    try {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`);
    } catch {
      // Column already exists
    }
  }

  // Migration: add avg_price to stocks/crypto
  for (const table of ["stocks", "crypto"]) {
    try {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN avg_price REAL DEFAULT 0`);
    } catch {
      // Column already exists
    }
  }

  // Migration: add price_updated_at and locked columns
  for (const table of ["stocks", "crypto"]) {
    try {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN price_updated_at TEXT`);
    } catch { /* exists */ }
    try {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN locked INTEGER DEFAULT 0`);
    } catch { /* exists */ }
  }

  _initialized = true;
}

// Wrapper that mimics the subset of better-sqlite3 API we use
// so we don't have to rewrite all API routes
export default function getDb() {
  const client = getClient();
  const ensureInit = initDb(client);

  return {
    prepare(sql: string) {
      return {
        async all(...args: unknown[]) {
          await ensureInit;
          const result = await client.execute({ sql, args: args as (string | number | null)[] });
          return result.rows as unknown[];
        },
        async get(...args: unknown[]) {
          await ensureInit;
          const result = await client.execute({ sql, args: args as (string | number | null)[] });
          return (result.rows[0] as unknown) ?? undefined;
        },
        async run(...args: unknown[]) {
          await ensureInit;
          const result = await client.execute({ sql, args: args as (string | number | null)[] });
          const id = result.lastInsertRowid;
          return { lastInsertRowid: id != null ? Number(id) : undefined };
        },
      };
    },
  };
}
