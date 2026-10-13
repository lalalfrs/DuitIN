import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = __dirname;
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'duit_in.db');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'cash', 'bank', 'ewallet', 'other'
      initial_balance REAL NOT NULL DEFAULT 0,
      color TEXT DEFAULT '#006199',
      account_number TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'income', 'expense'
      icon TEXT DEFAULT 'tag',
      color TEXT DEFAULT '#006199'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      type TEXT NOT NULL, -- 'income', 'expense'
      amount REAL NOT NULL,
      date TEXT NOT NULL, -- YYYY-MM-DD
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Seed default accounts if empty
  const accountCount = db.prepare('SELECT COUNT(*) as count FROM accounts').get().count;
  if (accountCount === 0) {
    const insertAccount = db.prepare(`
      INSERT INTO accounts (name, type, initial_balance, color, account_number)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertAccount.run('Cash (Dompet)', 'cash', 0, '#006199', 'Uang Tunai');
    insertAccount.run('BCA', 'bank', 0, '#006199', '8820-192-301');
    insertAccount.run('GoPay', 'ewallet', 0, '#8ACFF8', '0812-9988-7711');
  }

  // Seed default categories if empty
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (categoryCount === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (name, type, icon, color)
      VALUES (?, ?, ?, ?)
    `);

    // Expenses
    insertCat.run('Makanan & Minuman', 'expense', 'food', '#006199');
    insertCat.run('Transportasi', 'expense', 'transport', '#006199');
    insertCat.run('Belanja Kebutuhan', 'expense', 'shopping', '#8ACFF8');
    insertCat.run('Tagihan & Utilitas', 'expense', 'bill', '#FFD444');
    insertCat.run('Hiburan & Santai', 'expense', 'entertainment', '#8ACFF8');
    insertCat.run('Kesehatan & Obat', 'expense', 'health', '#006199');
    insertCat.run('Lain-lain', 'expense', 'other', '#8ACFF8');

    // Incomes
    insertCat.run('Gaji Pokok', 'income', 'salary', '#006199');
    insertCat.run('Bonus & THR', 'income', 'bonus', '#FFD444');
    insertCat.run('Freelance / Side Job', 'income', 'work', '#8ACFF8');
    insertCat.run('Hasil Investasi', 'income', 'investment', '#F4EB6C');
    insertCat.run('Pemasukan Lainnya', 'income', 'income_other', '#006199');
  }
}
