import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Helper to ensure Supabase client is ready
function checkClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Kredensial Supabase belum dikonfigurasi. Silakan salin file .env.example menjadi .env dan masukkan VITE_SUPABASE_URL serta VITE_SUPABASE_ANON_KEY Anda.'
    );
  }
}

// -----------------------------------------------------------------------------
// ACCOUNTS SERVICE
// -----------------------------------------------------------------------------
export async function getAccounts() {
  checkClient();
  
  // 1. Ambil seluruh akun
  const { data: accounts, error: accError } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: true });

  if (accError) throw accError;

  // 2. Ambil transaksi untuk kalkulasi saldo aktif terkini
  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('account_id, type, amount');

  if (txError) throw txError;

  const accountsWithBalances = (accounts || []).map(acc => {
    const accTxs = (txs || []).filter(t => t.account_id === acc.id);
    const totalIncome = accTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalExpense = accTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const currentBalance = Number(acc.initial_balance || 0) + totalIncome - totalExpense;

    return {
      ...acc,
      current_balance: Math.round(currentBalance * 100) / 100,
      total_income: totalIncome,
      total_expense: totalExpense
    };
  });

  return { success: true, data: accountsWithBalances };
}

export async function createAccount({ name, type, initial_balance = 0, color = '#006199', account_number = '' }) {
  checkClient();
  const { data, error } = await supabase
    .from('accounts')
    .insert([
      {
        name: name.trim(),
        type,
        initial_balance: Number(initial_balance) || 0,
        color,
        account_number: account_number.trim()
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return { success: true, data: { ...data, current_balance: data.initial_balance } };
}

export async function updateAccount(id, { name, type, initial_balance, color, account_number }) {
  checkClient();
  const updatePayload = {};
  if (name !== undefined) updatePayload.name = name.trim();
  if (type !== undefined) updatePayload.type = type;
  if (initial_balance !== undefined) updatePayload.initial_balance = Number(initial_balance) || 0;
  if (color !== undefined) updatePayload.color = color;
  if (account_number !== undefined) updatePayload.account_number = account_number.trim();

  const { data, error } = await supabase
    .from('accounts')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return { success: true, data };
}

export async function deleteAccount(id) {
  checkClient();
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

// -----------------------------------------------------------------------------
// CATEGORIES SERVICE
// -----------------------------------------------------------------------------
export async function getCategories() {
  checkClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('type', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return { success: true, data: data || [] };
}

export async function createCategory({ name, type, icon = 'tag', color = '#006199' }) {
  checkClient();
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name: name.trim(), type, icon, color }])
    .select()
    .single();

  if (error) throw error;
  return { success: true, data };
}

// -----------------------------------------------------------------------------
// TRANSACTIONS SERVICE
// -----------------------------------------------------------------------------
export async function getTransactions({ timeframe = 'all', account_id = 'all', type = 'all', search = '' } = {}) {
  checkClient();

  let query = supabase
    .from('transactions')
    .select(`
      id,
      account_id,
      category_id,
      type,
      amount,
      date,
      note,
      created_at,
      account:accounts (name, type, color),
      category:categories (name, icon, color)
    `)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (account_id !== 'all') {
    query = query.eq('account_id', account_id);
  }

  if (type !== 'all') {
    query = query.eq('type', type);
  }

  const today = new Date().toISOString().split('T')[0];
  if (timeframe === 'daily') {
    query = query.eq('date', today);
  } else if (timeframe === 'weekly') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    query = query.gte('date', weekAgo.toISOString().split('T')[0]).lte('date', today);
  } else if (timeframe === 'monthly') {
    const currentMonthPrefix = today.slice(0, 7); // YYYY-MM
    const startOfMonth = `${currentMonthPrefix}-01`;
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    const endOfMonth = new Date(nextMonth - 1).toISOString().split('T')[0];
    query = query.gte('date', startOfMonth).lte('date', endOfMonth);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Format response to match existing UI structure
  let formatted = (data || []).map(t => ({
    id: t.id,
    account_id: t.account_id,
    category_id: t.category_id,
    type: t.type,
    amount: Number(t.amount),
    date: t.date,
    note: t.note || '',
    created_at: t.created_at,
    account_name: t.account?.name || 'Akun Tidak Ditemukan',
    account_type: t.account?.type || 'cash',
    account_color: t.account?.color || '#006199',
    category_name: t.category?.name || 'Tanpa Kategori',
    category_icon: t.category?.icon || 'tag',
    category_color: t.category?.color || '#006199'
  }));

  // Client-side text filter jika ada search query
  if (search.trim()) {
    const s = search.toLowerCase();
    formatted = formatted.filter(t => 
      t.note.toLowerCase().includes(s) ||
      t.category_name.toLowerCase().includes(s) ||
      t.account_name.toLowerCase().includes(s)
    );
  }

  return { success: true, data: formatted };
}

export async function createTransaction({ account_id, category_id, type, amount, date, note = '' }) {
  checkClient();
  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        account_id,
        category_id: category_id || null,
        type,
        amount: Number(amount),
        date,
        note: note.trim()
      }
    ])
    .select(`
      id,
      account_id,
      category_id,
      type,
      amount,
      date,
      note,
      created_at,
      account:accounts (name, type, color),
      category:categories (name, icon, color)
    `)
    .single();

  if (error) throw error;

  return {
    success: true,
    data: {
      ...data,
      amount: Number(data.amount),
      account_name: data.account?.name || '',
      account_type: data.account?.type || 'cash',
      category_name: data.category?.name || 'Tanpa Kategori',
      category_icon: data.category?.icon || 'tag'
    }
  };
}

export async function updateTransaction(id, { account_id, category_id, type, amount, date, note }) {
  checkClient();
  const updatePayload = {};
  if (account_id !== undefined) updatePayload.account_id = account_id;
  if (category_id !== undefined) updatePayload.category_id = category_id || null;
  if (type !== undefined) updatePayload.type = type;
  if (amount !== undefined) updatePayload.amount = Number(amount);
  if (date !== undefined) updatePayload.date = date;
  if (note !== undefined) updatePayload.note = note.trim();

  const { data, error } = await supabase
    .from('transactions')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return { success: true, data };
}

export async function deleteTransaction(id) {
  checkClient();
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

// -----------------------------------------------------------------------------
// ANALYTICS & SUMMARY SERVICE
// -----------------------------------------------------------------------------
export async function getAnalyticsSummary() {
  checkClient();

  // 1. Ambil akun dan transaksi
  const [accRes, txRes, catRes] = await Promise.all([
    getAccounts(),
    supabase.from('transactions').select('*'),
    supabase.from('categories').select('*')
  ]);

  const accounts = accRes.data || [];
  const transactions = (txRes.data || []).map(t => ({
    ...t,
    amount: Number(t.amount)
  }));
  const categories = catRes.data || [];

  const totalBalance = accounts.reduce((acc, curr) => acc + (curr.current_balance || 0), 0);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);

  // 7 hari terakhir
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  // Daily Stats (hari ini)
  const todayTxs = transactions.filter(t => t.date === today);
  const dailyIncome = todayTxs.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0);
  const dailyExpense = todayTxs.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0);

  // Weekly Stats (7 hari terakhir)
  const weeklyTxs = transactions.filter(t => t.date >= weekAgoStr && t.date <= today);
  const weeklyIncome = weeklyTxs.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0);
  const weeklyExpense = weeklyTxs.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0);

  // Monthly Stats (bulan ini)
  const monthlyTxs = transactions.filter(t => t.date.startsWith(currentMonth));
  const monthlyIncome = monthlyTxs.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0);
  const monthlyExpense = monthlyTxs.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0);

  // 7 Hari Terakhir Arus Kas Harian
  const last7DaysData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayTxs = transactions.filter(t => t.date === dateStr);
    const inc = dayTxs.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0);
    const exp = dayTxs.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0);
    const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(d);

    last7DaysData.push({
      date: dateStr,
      day: dayName,
      income: inc,
      expense: exp
    });
  }

  // Pengeluaran per kategori bulan ini
  const catMap = new Map();
  categories.forEach(c => catMap.set(c.id, c));

  const expenseGroupMap = new Map();
  monthlyTxs
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const cat = catMap.get(t.category_id);
      const catName = cat?.name || 'Lain-lain';
      const catColor = cat?.color || '#006199';
      const catIcon = cat?.icon || 'tag';

      if (!expenseGroupMap.has(catName)) {
        expenseGroupMap.set(catName, {
          category_name: catName,
          category_color: catColor,
          category_icon: catIcon,
          total_amount: 0
        });
      }
      expenseGroupMap.get(catName).total_amount += t.amount;
    });

  const expenseByCategory = Array.from(expenseGroupMap.values()).sort(
    (a, b) => b.total_amount - a.total_amount
  );

  return {
    success: true,
    data: {
      total_balance: totalBalance,
      accounts,
      daily: {
        income: dailyIncome,
        expense: dailyExpense,
        net: dailyIncome - dailyExpense
      },
      weekly: {
        income: weeklyIncome,
        expense: weeklyExpense,
        net: weeklyIncome - weeklyExpense
      },
      monthly: {
        income: monthlyIncome,
        expense: monthlyExpense,
        net: monthlyIncome - monthlyExpense
      },
      last7Days: last7DaysData,
      expenseByCategory
    }
  };
}
