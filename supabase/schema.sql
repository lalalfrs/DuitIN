-- ==============================================================================
-- DuitIN Personal Finance Tracker - Supabase SQL Schema
-- Jalankan skrip ini di SQL Editor pada Supabase Dashboard Anda.
-- ==============================================================================

-- 1. Buat Tabel Akun / Dompet (accounts)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'ewallet', 'other')),
  initial_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#006199',
  account_number TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Buat Tabel Kategori (categories)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT 'tag',
  color TEXT DEFAULT '#006199',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Buat Tabel Transaksi (transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index untuk mempercepat query
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- 4. Konfigurasi Row Level Security (RLS)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Publik (Anon Client) untuk Personal Tracker
CREATE POLICY "Allow public read accounts" ON accounts FOR SELECT USING (true);
CREATE POLICY "Allow public insert accounts" ON accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update accounts" ON accounts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete accounts" ON accounts FOR DELETE USING (true);

CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete categories" ON categories FOR DELETE USING (true);

CREATE POLICY "Allow public read transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update transactions" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete transactions" ON transactions FOR DELETE USING (true);

-- 5. Seed Data Awal Akun (Bila tabel masih kosong)
INSERT INTO accounts (name, type, initial_balance, color, account_number)
SELECT 'Cash (Dompet)', 'cash', 0, '#006199', 'Uang Tunai'
WHERE NOT EXISTS (SELECT 1 FROM accounts LIMIT 1);

INSERT INTO accounts (name, type, initial_balance, color, account_number)
SELECT 'BCA', 'bank', 0, '#006199', '8820-192-301'
WHERE (SELECT COUNT(*) FROM accounts) = 1;

INSERT INTO accounts (name, type, initial_balance, color, account_number)
SELECT 'GoPay', 'ewallet', 0, '#8ACFF8', '0812-9988-7711'
WHERE (SELECT COUNT(*) FROM accounts) = 2;

-- 6. Seed Data Awal Kategori Pengeluaran
INSERT INTO categories (name, type, icon, color) VALUES
  ('Makanan & Minuman', 'expense', 'coffee', '#EF4444'),
  ('Transportasi', 'expense', 'car', '#F59E0B'),
  ('Belanja Harian', 'expense', 'shopping', '#8B5CF6'),
  ('Tagihan & Utilitas', 'expense', 'receipt', '#06B6D4'),
  ('Hiburan & Santai', 'expense', 'game', '#EC4899'),
  ('Kesehatan', 'expense', 'heart', '#10B981'),
  ('Pendidikan', 'expense', 'book', '#3B82F6'),
  ('Lainnya', 'expense', 'tag', '#64748B')
ON CONFLICT DO NOTHING;

-- 7. Seed Data Awal Kategori Pemasukan
INSERT INTO categories (name, type, icon, color) VALUES
  ('Gaji Pokok', 'income', 'briefcase', '#10B981'),
  ('Bonus & THR', 'income', 'gift', '#059669'),
  ('Freelance / Proyek', 'income', 'laptop', '#047857'),
  ('Hasil Investasi', 'income', 'trending-up', '#0D9488'),
  ('Pemasukan Lain', 'income', 'tag', '#10B981')
ON CONFLICT DO NOTHING;
