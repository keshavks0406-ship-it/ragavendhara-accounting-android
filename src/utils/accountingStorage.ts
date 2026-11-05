import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import type { StoredData } from '../context/AccountingContext';

const STORAGE_KEY = 'raghavendra_co_books_v2';
const DATABASE_NAME = 'raghavendra_accounting';
let databasePromise: ReturnType<SQLiteConnection['createConnection']> | null = null;
let databaseOpenPromise: Promise<void> | null = null;

async function getNativeDatabase() {
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  if (!databasePromise) {
    databasePromise = sqlite.createConnection(DATABASE_NAME, false, 'no-encryption', 1, false);
  }
  const db = await databasePromise;
  if (!databaseOpenPromise) {
    databaseOpenPromise = db.open().then(() => undefined);
  }
  await databaseOpenPromise;
  await db.execute(`CREATE TABLE IF NOT EXISTS accounting_store (
    id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`);
  return db;
}

/** Reads from SQLite on Android and localStorage in browser/PWA development. */
export async function loadAccountingData(): Promise<StoredData | null> {
  if (!Capacitor.isNativePlatform()) {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredData) : null;
  }

  const db = await getNativeDatabase();
  const result = await db.query('SELECT payload FROM accounting_store WHERE id = 1;');
  const savedPayload = result.values?.[0]?.payload;
  if (typeof savedPayload === 'string') return JSON.parse(savedPayload) as StoredData;

  // One-time migration for users who previously ran the browser/PWA version.
  const legacy = localStorage.getItem(STORAGE_KEY);
  if (!legacy) return null;
  const parsed = JSON.parse(legacy) as StoredData;
  await saveAccountingData(parsed);
  return parsed;
}

export async function saveAccountingData(data: StoredData): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return;
  }

  const db = await getNativeDatabase();
  await db.run(
    'INSERT OR REPLACE INTO accounting_store (id, payload, updated_at) VALUES (1, ?, ?);',
    [JSON.stringify(data), new Date().toISOString()],
  );
}
