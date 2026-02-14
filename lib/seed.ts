import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export function seed(db: Database.Database): void {
  const hasTable = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='employees'")
    .get();

  if (hasTable) return;

  const sql = fs.readFileSync(
    path.join(process.cwd(), 'data', 'seed.sql'),
    'utf-8'
  );

  db.exec(sql);
}
