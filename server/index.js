import express from 'express';
import cors from 'cors';
import { db, initDatabase } from './db.js';

initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Accounts Endpoints
app.get('/api/accounts', (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT 
        a.id,
        a.name,
        a.type,
        a.initial_balance,
        a.color,
        a.account_number,
        a.created_at,
        ROUND(a.initial_balance + COALESCE(inc.total_income, 0) - COALESCE(exp.total_expense, 0), 2) AS current_balance,
        COALESCE(inc.total_income, 0) AS total_income,
        COALESCE(exp.total_expense, 0) AS total_expense
      FROM accounts a
      LEFT JOIN (
        SELECT account_id, SUM(amount) AS total_income 
        FROM transactions 
        WHERE type = 'income' 
        GROUP BY account_id
      ) inc ON a.id = inc.account_id
      LEFT JOIN (
        SELECT account_id, SUM(amount) AS total_expense 
        FROM transactions 
        WHERE type = 'expense' 
        GROUP BY account_id
      ) exp ON a.id = exp.account_id
      ORDER BY a.id ASC
    `).all();

    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/accounts', (req, res) => {
  try {
    const { name, type, initial_balance = 0, color = '#006199', account_number = '' } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Nama dan tipe akun wajib diisi.' });
    }

    const stmt = db.prepare(`
      INSERT INTO accounts (name, type, initial_balance, color, account_number)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name.trim(), type, Number(initial_balance) || 0, color, account_number.trim());

    const newAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: { ...newAccount, current_balance: newAccount.initial_balance } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/accounts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, initial_balance, color, account_number } = req.body;

    const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });
    }

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedType = type !== undefined ? type : existing.type;
    const updatedInitBal = initial_balance !== undefined ? Number(initial_balance) : existing.initial_balance;
    const updatedColor = color !== undefined ? color : existing.color;
    const updatedAccNum = account_number !== undefined ? account_number.trim() : existing.account_number;

    db.prepare(`
      UPDATE accounts 
      SET name = ?, type = ?, initial_balance = ?, color = ?, account_number = ?
      WHERE id = ?
    `).run(updatedName, updatedType, updatedInitBal, updatedColor, updatedAccNum, id);

    res.json({ success: true, message: 'Akun berhasil diperbarui.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/accounts/:id', (req, res) => {
  try {
    const { id } = req.params;
    // Check if account exists
    const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });
    }

    // Safety check: ensure at least one account remains
    const count = db.prepare('SELECT COUNT(*) as count FROM accounts').get().count;
    if (count <= 1) {
      return res.status(400).json({ success: false, message: 'Minimal harus tersisa satu akun di sistem.' });
    }

    db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
    res.json({ success: true, message: 'Akun dan seluruh transaksinya berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Categories Endpoints
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY type ASC, name ASC').all();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const { name, type, icon = 'tag', color = '#006199' } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Nama dan tipe kategori wajib diisi.' });
    }

    const stmt = db.prepare('INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name.trim(), type, icon, color);
    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Transactions Endpoints
app.get('/api/transactions', (req, res) => {
  try {
    const { timeframe, account_id, type, search, start_date, end_date } = req.query;

    let query = `
      SELECT 
        t.id,
        t.account_id,
        t.category_id,
        t.type,
        t.amount,
        t.date,
        t.note,
        t.created_at,
        a.name AS account_name,
        a.type AS account_type,
        a.color AS account_color,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (account_id) {
      query += ' AND t.account_id = ?';
      params.push(account_id);
    }

    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }

    if (search) {
      query += ' AND (t.note LIKE ? OR c.name LIKE ? OR a.name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    // Timeframe filters
    const today = new Date().toISOString().split('T')[0];
    if (timeframe === 'daily') {
      query += ' AND t.date = ?';
      params.push(today);
    } else if (timeframe === 'weekly') {
      // past 7 days up to today
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      query += ' AND t.date >= ? AND t.date <= ?';
      params.push(weekAgo.toISOString().split('T')[0], today);
    } else if (timeframe === 'monthly') {
      // Current year-month (YYYY-MM)
      const currentMonth = today.slice(0, 7);
      query += ' AND t.date LIKE ?';
      params.push(`${currentMonth}%`);
    } else if (start_date && end_date) {
      query += ' AND t.date >= ? AND t.date <= ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY t.date DESC, t.id DESC';

    const transactions = db.prepare(query).all(...params);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/transactions', (req, res) => {
  try {
    const { account_id, category_id, type, amount, date, note = '' } = req.body;
    if (!account_id || !type || !amount || !date) {
      return res.status(400).json({ success: false, message: 'Akun, tipe, jumlah, dan tanggal transaksi wajib diisi.' });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah transaksi harus lebih besar dari 0.' });
    }

    const stmt = db.prepare(`
      INSERT INTO transactions (account_id, category_id, type, amount, date, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      Number(account_id),
      category_id ? Number(category_id) : null,
      type,
      Number(amount),
      date,
      note.trim()
    );

    const created = db.prepare(`
      SELECT t.*, a.name AS account_name, c.name AS category_name
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { account_id, category_id, type, amount, date, note } = req.body;

    const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }

    db.prepare(`
      UPDATE transactions
      SET account_id = ?, category_id = ?, type = ?, amount = ?, date = ?, note = ?
      WHERE id = ?
    `).run(
      account_id !== undefined ? Number(account_id) : existing.account_id,
      category_id !== undefined ? (category_id ? Number(category_id) : null) : existing.category_id,
      type !== undefined ? type : existing.type,
      amount !== undefined ? Number(amount) : existing.amount,
      date !== undefined ? date : existing.date,
      note !== undefined ? note.trim() : existing.note,
      id
    );

    res.json({ success: true, message: 'Transaksi berhasil diubah.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }

    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    res.json({ success: true, message: 'Transaksi berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Summary & Analytics
app.get('/api/analytics/summary', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7);

    // Week boundaries (past 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    // Accounts with current balances
    const accounts = db.prepare(`
      SELECT 
        a.id,
        a.name,
        a.type,
        a.color,
        a.account_number,
        ROUND(a.initial_balance + COALESCE(inc.total_income, 0) - COALESCE(exp.total_expense, 0), 2) AS current_balance
      FROM accounts a
      LEFT JOIN (
        SELECT account_id, SUM(amount) AS total_income 
        FROM transactions 
        WHERE type = 'income' 
        GROUP BY account_id
      ) inc ON a.id = inc.account_id
      LEFT JOIN (
        SELECT account_id, SUM(amount) AS total_expense 
        FROM transactions 
        WHERE type = 'expense' 
        GROUP BY account_id
      ) exp ON a.id = exp.account_id
      ORDER BY a.id ASC
    `).all();

    const totalBalance = accounts.reduce((acc, curr) => acc + (curr.current_balance || 0), 0);

    // Daily stats (today)
    const dailyStats = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
      FROM transactions
      WHERE date = ?
    `).get(today);

    // Weekly stats (last 7 days)
    const weeklyStats = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
      FROM transactions
      WHERE date >= ? AND date <= ?
    `).get(weekAgoStr, today);

    // Monthly stats (this month)
    const monthlyStats = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
      FROM transactions
      WHERE date LIKE ?
    `).get(`${currentMonth}%`);

    // Past 7 days daily trend
    const last7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const stats = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
        FROM transactions
        WHERE date = ?
      `).get(dateStr);

      const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(d);
      last7DaysData.push({
        date: dateStr,
        day: dayName,
        income: stats.income,
        expense: stats.expense
      });
    }

    // Expense breakdown by category for this month
    const expenseByCategory = db.prepare(`
      SELECT 
        COALESCE(c.name, 'Lain-lain') AS category_name,
        COALESCE(c.color, '#006199') AS category_color,
        COALESCE(c.icon, 'tag') AS category_icon,
        SUM(t.amount) AS total_amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense' AND t.date LIKE ?
      GROUP BY t.category_id
      ORDER BY total_amount DESC
    `).all(`${currentMonth}%`);

    // Recent 5 transactions
    const recentTransactions = db.prepare(`
      SELECT 
        t.id,
        t.account_id,
        t.type,
        t.amount,
        t.date,
        t.note,
        a.name AS account_name,
        a.type AS account_type,
        c.name AS category_name,
        c.icon AS category_icon
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC, t.id DESC
      LIMIT 6
    `).all();

    res.json({
      success: true,
      data: {
        total_balance: totalBalance,
        accounts,
        daily: {
          income: dailyStats.income,
          expense: dailyStats.expense,
          net: dailyStats.income - dailyStats.expense
        },
        weekly: {
          income: weeklyStats.income,
          expense: weeklyStats.expense,
          net: weeklyStats.income - weeklyStats.expense
        },
        monthly: {
          income: monthlyStats.income,
          expense: monthlyStats.expense,
          net: monthlyStats.income - monthlyStats.expense
        },
        last7Days: last7DaysData,
        expenseByCategory,
        recentTransactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`DuitIN backend SQLite server running on port ${PORT}`);
});
