import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { initSchema } from './schema';

let _db: BetterSqlite3.Database | null = null;

export function getDb(): BetterSqlite3.Database {
  if (_db) return _db;

  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  _db = new BetterSqlite3(config.dbPath);
  initSchema(_db);
  return _db;
}
