import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { 
  WalletIcon, 
  BankIcon, 
  CashIcon, 
  PhoneIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  PlusIcon, 
  SunIcon, 
  MoonIcon, 
  TrashIcon, 
  EditIcon, 
  SearchIcon,
  CategoryIcon 
} from './components/Icons';
import { formatRupiah, formatDateIndo, getAccountTypeLabel } from './utils/formatters';
import { AccountModal } from './components/AccountModal';
import { TransactionModal } from './components/TransactionModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { TrendChart } from './components/TrendChart';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { 
  getAccounts, 
  createAccount, 
  updateAccount, 
  deleteAccount, 
  getCategories, 
  getTransactions, 
  createTransaction, 
  updateTransaction, 
  deleteTransaction, 
  getAnalyticsSummary 
} from './services/supabaseService';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  // Theme state: light or dark
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('duitin_theme') || 'light';
  });

  // Timeframe filter state: 'daily' | 'weekly' | 'monthly' | 'all'
  const [timeframe, setTimeframe] = useState('monthly');

  // Transaction list filters
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [summaryData, setSummaryData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDeleting: false
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('duitin_theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }

  // Fetch summary and accounts
  const fetchSummaryAndAccounts = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Kredensial Supabase belum diatur di file .env.');
      return;
    }

    try {
      const [sumRes, accRes, catRes] = await Promise.all([
        getAnalyticsSummary(),
        getAccounts(),
        getCategories()
      ]);

      if (sumRes.success) setSummaryData(sumRes.data);
      if (accRes.success) setAccounts(accRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Gagal mengambil ringkasan:', err);
      setError(err.message || 'Gagal terhubung ke database Supabase.');
    }
  }, []);

  // Fetch transactions with active filters
  const fetchTransactions = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    try {
      const res = await getTransactions({
        timeframe,
        account_id: filterAccount,
        type: filterType,
        search: searchQuery
      });
      if (res.success) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar transaksi:', err);
    }
  }, [timeframe, filterAccount, filterType, searchQuery]);

  // Initial load
  useEffect(() => {
    async function loadInitial() {
      setIsLoading(true);
      setError(null);
      await Promise.all([fetchSummaryAndAccounts(), fetchTransactions()]);
      setIsLoading(false);
    }
    loadInitial();
  }, [fetchSummaryAndAccounts, fetchTransactions]);

  // Re-fetch transactions when filter changes
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle Account Actions
  async function handleSaveAccount(accountData) {
    if (editingAccount) {
      await updateAccount(editingAccount.id, accountData);
    } else {
      await createAccount(accountData);
    }
    await Promise.all([fetchSummaryAndAccounts(), fetchTransactions()]);
  }

  function handleOpenEditAccount(acc) {
    setEditingAccount(acc);
    setIsAccountModalOpen(true);
  }

  function handleOpenCreateAccount() {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  }

  function handleDeleteAccount(acc) {
    setDeleteModalConfig({
      isOpen: true,
      title: `Hapus Akun "${acc.name}"`,
      message: `Seluruh transaksi yang terhubung dengan akun "${acc.name}" juga akan dihapus dari catatan. Apakah Anda ingin melanjutkan?`,
      onConfirm: async () => {
        setDeleteModalConfig(prev => ({ ...prev, isDeleting: true }));
        try {
          await deleteAccount(acc.id);
          setDeleteModalConfig(prev => ({ ...prev, isOpen: false }));
          await Promise.all([fetchSummaryAndAccounts(), fetchTransactions()]);
        } catch (err) {
          alert('Terjadi kesalahan saat menghapus akun: ' + (err.message || err));
        } finally {
          setDeleteModalConfig(prev => ({ ...prev, isDeleting: false }));
        }
      }
    });
  }

  // Handle Transaction Actions
  async function handleSaveTransaction(txData) {
    if (editingTx) {
      await updateTransaction(editingTx.id, txData);
    } else {
      await createTransaction(txData);
    }
    await Promise.all([fetchSummaryAndAccounts(), fetchTransactions()]);
  }

  function handleOpenEditTx(tx) {
    setEditingTx(tx);
    setIsTxModalOpen(true);
  }

  function handleOpenCreateTx() {
    setEditingTx(null);
    setIsTxModalOpen(true);
  }

  function handleDeleteTransaction(tx) {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Hapus Transaksi',
      message: `Hapus catatan transaksi ${tx.type === 'income' ? 'pemasukan' : 'pengeluaran'} sebesar ${formatRupiah(tx.amount)} (${tx.note || tx.category_name || 'Tanpa Keterangan'})?`,
      onConfirm: async () => {
        setDeleteModalConfig(prev => ({ ...prev, isDeleting: true }));
        try {
          await deleteTransaction(tx.id);
          setDeleteModalConfig(prev => ({ ...prev, isOpen: false }));
          await Promise.all([fetchSummaryAndAccounts(), fetchTransactions()]);
        } catch (err) {
          alert('Terjadi kesalahan saat menghapus transaksi: ' + (err.message || err));
        } finally {
          setDeleteModalConfig(prev => ({ ...prev, isDeleting: false }));
        }
      }
    });
  }

  // Active period stats
  const activePeriodStats = summaryData ? (
    timeframe === 'daily' ? summaryData.daily :
    timeframe === 'weekly' ? summaryData.weekly :
    timeframe === 'monthly' ? summaryData.monthly :
    {
      income: summaryData.accounts.reduce((a, c) => a + (c.total_income || 0), 0),
      expense: summaryData.accounts.reduce((a, c) => a + (c.total_expense || 0), 0),
      net: summaryData.accounts.reduce((a, c) => a + (c.total_income || 0) - (c.total_expense || 0), 0)
    }
  ) : { income: 0, expense: 0, net: 0 };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'cash': return <CashIcon size={24} />;
      case 'bank': return <BankIcon size={24} />;
      case 'ewallet': return <PhoneIcon size={24} />;
      default: return <WalletIcon size={24} />;
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-group">
            <div className="brand-badge">
              <span className="brand-dot" />
            </div>
            <div>
              <h1 className="brand-title">DuitIN</h1>
              <p className="brand-tagline">Personal Finance Tracker</p>
            </div>
          </div>

          <div className="header-actions">
            <button 
              type="button" 
              className="btn btn-primary header-desktop-btn"
              onClick={handleOpenCreateTx}
              aria-label="Buka form catat transaksi baru"
            >
              <PlusIcon size={16} />
              <span>Catat Transaksi</span>
            </button>

            <button 
              type="button" 
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={`Beralih ke mode ${theme === 'light' ? 'gelap' : 'terang'}`}
              title={`Beralih ke mode ${theme === 'light' ? 'gelap' : 'terang'}`}
            >
              {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {!isSupabaseConfigured ? (
          <div className="alert-error main-alert" role="alert" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem', backgroundColor: 'rgba(0, 97, 153, 0.12)', borderColor: 'var(--color-primary)', color: 'var(--text-main)' }}>
            <strong style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>Konfigurasi Supabase Diperlukan</strong>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>
              Aplikasi ini sekarang terhubung langsung ke Supabase. Salin file <code>.env.example</code> menjadi <code>.env</code> lalu isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> Anda. Skema tabel database tersedia di <code>supabase/schema.sql</code>.
            </p>
          </div>
        ) : error ? (
          <div className="alert-error main-alert" role="alert">
            <span>{error}</span>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setError(null);
                fetchSummaryAndAccounts();
                fetchTransactions();
              }}
            >
              Coba Lagi
            </button>
          </div>
        ) : null}

        {/* SECTION 1: Total Saldo & Kantong Keuangan (Cash, BCA, GoPay, dst) */}
        <section className="section-wallets" aria-labelledby="wallet-section-title">
          <div className="section-header">
            <div>
              <span className="section-kicker">Struktur Keuangan Anda</span>
              <h2 id="wallet-section-title" className="section-title">
                Posisi Saldo & Kantong Akun
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleOpenCreateAccount}
            >
              <PlusIcon size={14} />
              <span>Tambah Akun Baru</span>
            </button>
          </div>

          {/* Net Worth Highlight Card */}
          <div className="net-worth-banner">
            <div className="net-worth-left">
              <span className="net-worth-label">Total Saldo Terkumpul (Net Worth)</span>
              <div className="net-worth-value tabular-nums">
                {isLoading ? 'Menghitung...' : formatRupiah(summaryData?.total_balance || 0)}
              </div>
              <p className="net-worth-subtext">
                Akumulasi seluruh uang tunai, rekening bank, dan dompet digital yang Anda miliki saat ini.
              </p>
            </div>
            <div className="net-worth-badge">
              <span>{accounts.length} Akun Terdaftar</span>
            </div>
          </div>

          {/* Accounts Cards Grid */}
          <div className="accounts-grid">
            {accounts.map(acc => (
              <div 
                key={acc.id} 
                className="account-card"
                style={{ borderTopColor: acc.color || '#006199' }}
              >
                <div className="account-card-top">
                  <div className="account-icon-badge" style={{ backgroundColor: `${acc.color || '#006199'}18`, color: acc.color || '#006199' }}>
                    {getAccountIcon(acc.type)}
                  </div>
                  <div className="account-card-actions">
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => handleOpenEditAccount(acc)}
                      aria-label={`Ubah akun ${acc.name}`}
                      title="Ubah detail akun"
                    >
                      <EditIcon size={16} />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        className="icon-action-btn danger"
                        onClick={() => handleDeleteAccount(acc)}
                        aria-label={`Hapus akun ${acc.name}`}
                        title="Hapus akun"
                      >
                        <TrashIcon size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="account-card-body">
                  <h3 className="account-name">{acc.name}</h3>
                  <span className="account-type-tag">{getAccountTypeLabel(acc.type)}</span>
                  {acc.account_number && (
                    <span className="account-number">{acc.account_number}</span>
                  )}

                  <div className="account-balance-box">
                    <span className="balance-label">Saldo Aktif</span>
                    <div className="balance-amount tabular-nums">
                      {formatRupiah(acc.current_balance || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Quick Add Account Card */}
            <button 
              type="button" 
              className="account-card-add" 
              onClick={handleOpenCreateAccount}
              aria-label="Tambah akun baru"
            >
              <div className="add-icon-circle">
                <PlusIcon size={20} />
              </div>
              <span className="add-card-title">Tambah Akun / Dompet</span>
              <span className="add-card-desc">Rekening bank lain, dompet digital, atau tabungan saku</span>
            </button>
          </div>
        </section>

        {/* SECTION 2: Lacak Pemasukan & Pengeluaran (Harian, Mingguan, Bulanan) */}
        <section className="section-analytics" aria-labelledby="analytics-section-title">
          <div className="section-header">
            <div>
              <span className="section-kicker">Pelacakan Arus Kas</span>
              <h2 id="analytics-section-title" className="section-title">
                Pemasukan & Pengeluaran
              </h2>
            </div>

            {/* Timeframe Selector (Horizontal Chip Scroll on Mobile) */}
            <div className="timeframe-wrapper">
              <div className="timeframe-selector" role="group" aria-label="Pilih periode pelacakan">
                <button
                  type="button"
                  className={`timeframe-btn ${timeframe === 'daily' ? 'active' : ''}`}
                  onClick={() => setTimeframe('daily')}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  className={`timeframe-btn ${timeframe === 'weekly' ? 'active' : ''}`}
                  onClick={() => setTimeframe('weekly')}
                >
                  7 Hari Terakhir
                </button>
                <button
                  type="button"
                  className={`timeframe-btn ${timeframe === 'monthly' ? 'active' : ''}`}
                  onClick={() => setTimeframe('monthly')}
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  className={`timeframe-btn ${timeframe === 'all' ? 'active' : ''}`}
                  onClick={() => setTimeframe('all')}
                >
                  Semua Waktu
                </button>
              </div>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="metrics-grid">
            <div className="metric-card income-card">
              <div className="metric-header">
                <span className="metric-label">Total Pemasukan</span>
                <span className="metric-icon income">
                  <ArrowUpIcon size={16} />
                </span>
              </div>
              <div className="metric-value income tabular-nums">
                {formatRupiah(activePeriodStats.income)}
              </div>
              <span className="metric-footer-text">
                {timeframe === 'daily' ? 'Pemasukan hari ini' :
                 timeframe === 'weekly' ? 'Pemasukan 7 hari terakhir' :
                 timeframe === 'monthly' ? 'Pemasukan bulan ini' : 'Total seluruh pemasukan'}
              </span>
            </div>

            <div className="metric-card expense-card">
              <div className="metric-header">
                <span className="metric-label">Total Pengeluaran</span>
                <span className="metric-icon expense">
                  <ArrowDownIcon size={16} />
                </span>
              </div>
              <div className="metric-value expense tabular-nums">
                {formatRupiah(activePeriodStats.expense)}
              </div>
              <span className="metric-footer-text">
                {timeframe === 'daily' ? 'Pengeluaran hari ini' :
                 timeframe === 'weekly' ? 'Pengeluaran 7 hari terakhir' :
                 timeframe === 'monthly' ? 'Pengeluaran bulan ini' : 'Total seluruh pengeluaran'}
              </span>
            </div>

            <div className="metric-card net-card">
              <div className="metric-header">
                <span className="metric-label">Arus Kas Bersih</span>
                <span className="metric-icon net">
                  <WalletIcon size={16} />
                </span>
              </div>
              <div className={`metric-value tabular-nums ${activePeriodStats.net >= 0 ? 'text-income' : 'text-expense'}`}>
                {activePeriodStats.net >= 0 ? '+' : ''}{formatRupiah(activePeriodStats.net)}
              </div>
              <span className="metric-footer-text">
                Selisih pemasukan dikurangi pengeluaran periode ini
              </span>
            </div>
          </div>

          {/* Analytics Visual Split */}
          <div className="analytics-split-grid">
            <div className="card-panel">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Tren Arus Kas (7 Hari Terakhir)</h3>
                  <p className="panel-subtitle">Perbandingan pemasukan dan pengeluaran harian</p>
                </div>
              </div>
              <TrendChart data={summaryData?.last7Days || []} />
            </div>

            <div className="card-panel">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Distribusi Kategori Pengeluaran</h3>
                  <p className="panel-subtitle">Alokasi belanja terbesar pada bulan ini</p>
                </div>
              </div>
              <CategoryBreakdown data={summaryData?.expenseByCategory || []} />
            </div>
          </div>
        </section>

        {/* SECTION 3: Daftar Catatan Transaksi */}
        <section className="section-transactions" aria-labelledby="tx-section-title">
          <div className="section-header">
            <div>
              <span className="section-kicker">Histori Finansial</span>
              <h2 id="tx-section-title" className="section-title">
                Daftar Catatan Transaksi
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleOpenCreateTx}
            >
              <PlusIcon size={14} />
              <span>Tambah Transaksi</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="filter-bar">
            <div className="search-box">
              <SearchIcon size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Cari catatan, kategori, atau akun..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus kata kunci pencarian"
                >
                  &times;
                </button>
              )}
            </div>

            <div className="filter-dropdowns">
              <select
                className="filter-select"
                value={filterAccount}
                onChange={e => setFilterAccount(e.target.value)}
                aria-label="Filter berdasarkan akun dompet"
              >
                <option value="all">Semua Akun</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                aria-label="Filter berdasarkan jenis transaksi"
              >
                <option value="all">Semua Jenis</option>
                <option value="expense">Hanya Pengeluaran</option>
                <option value="income">Hanya Pemasukan</option>
              </select>
            </div>
          </div>

          {/* Transactions List Container */}
          <div className="transactions-card">
            {isLoading ? (
              <div className="state-container loading">
                <div className="spinner" />
                <p>Memuat catatan transaksi...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="state-container empty">
                <div className="empty-icon-circle">
                  <WalletIcon size={28} />
                </div>
                <h3 className="empty-title">Belum ada transaksi</h3>
                <p className="empty-description">
                  {searchQuery || filterAccount !== 'all' || filterType !== 'all' 
                    ? 'Tidak ditemukan transaksi yang cocok dengan filter. Silakan ubah filter atau kata kunci.' 
                    : 'Seluruh saldo saat ini 0. Klik tombol di bawah untuk mencatat transaksi pertama Anda.'}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleOpenCreateTx}
                >
                  <PlusIcon size={16} />
                  <span>Catat Transaksi Pertama</span>
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="table-responsive desktop-only-table">
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>Kategori & Keterangan</th>
                        <th>Akun / Dompet</th>
                        <th>Tanggal</th>
                        <th className="text-right">Nominal</th>
                        <th className="text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => {
                        const isIncome = tx.type === 'income';
                        return (
                          <tr key={tx.id} className="tx-row">
                            <td>
                              <div className="tx-category-cell">
                                <span 
                                  className={`tx-icon-badge ${isIncome ? 'income' : 'expense'}`}
                                  style={tx.category_color ? { color: tx.category_color } : {}}
                                >
                                  <CategoryIcon icon={tx.category_icon || 'tag'} size={18} />
                                </span>
                                <div className="tx-details">
                                  <span className="tx-category-name">
                                    {tx.category_name || 'Tanpa Kategori'}
                                  </span>
                                  {tx.note && (
                                    <span className="tx-note">{tx.note}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span 
                                className="account-badge-pill"
                                style={{ 
                                  backgroundColor: `${tx.account_color || '#006199'}15`,
                                  color: tx.account_color || '#006199',
                                  borderColor: `${tx.account_color || '#006199'}30`
                                }}
                              >
                                {tx.account_name}
                              </span>
                            </td>
                            <td className="tx-date-cell">
                              {formatDateIndo(tx.date)}
                            </td>
                            <td className="text-right">
                              <span className={`tx-amount tabular-nums ${isIncome ? 'income' : 'expense'}`}>
                                {isIncome ? '+ ' : '- '}
                                {formatRupiah(tx.amount)}
                              </span>
                            </td>
                            <td className="text-right">
                              <div className="table-actions">
                                <button
                                  type="button"
                                  className="icon-action-btn"
                                  onClick={() => handleOpenEditTx(tx)}
                                  aria-label={`Ubah transaksi ${tx.note || tx.category_name}`}
                                  title="Ubah transaksi"
                                >
                                  <EditIcon size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-action-btn danger"
                                  onClick={() => handleDeleteTransaction(tx)}
                                  aria-label={`Hapus transaksi ${tx.note || tx.category_name}`}
                                  title="Hapus transaksi"
                                >
                                  <TrashIcon size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Friendly Card List View */}
                <div className="mobile-only-list">
                  {transactions.map(tx => {
                    const isIncome = tx.type === 'income';
                    return (
                      <div key={tx.id} className="mobile-tx-card">
                        <div className="mobile-tx-top">
                          <div className="mobile-tx-left">
                            <span 
                              className={`tx-icon-badge ${isIncome ? 'income' : 'expense'}`}
                              style={tx.category_color ? { color: tx.category_color } : {}}
                            >
                              <CategoryIcon icon={tx.category_icon || 'tag'} size={18} />
                            </span>
                            <div>
                              <span className="mobile-tx-cat">{tx.category_name || 'Tanpa Kategori'}</span>
                              <span className="mobile-tx-date">{formatDateIndo(tx.date)}</span>
                            </div>
                          </div>
                          <span className={`mobile-tx-amount tabular-nums ${isIncome ? 'income' : 'expense'}`}>
                            {isIncome ? '+ ' : '- '}
                            {formatRupiah(tx.amount)}
                          </span>
                        </div>

                        {tx.note && (
                          <div className="mobile-tx-note">
                            {tx.note}
                          </div>
                        )}

                        <div className="mobile-tx-bottom">
                          <span 
                            className="account-badge-pill"
                            style={{ 
                              backgroundColor: `${tx.account_color || '#006199'}15`,
                              color: tx.account_color || '#006199',
                              borderColor: `${tx.account_color || '#006199'}30`
                            }}
                          >
                            {tx.account_name}
                          </span>

                          <div className="mobile-tx-actions">
                            <button
                              type="button"
                              className="btn-mobile-action"
                              onClick={() => handleOpenEditTx(tx)}
                              aria-label={`Ubah transaksi ${tx.note || tx.category_name}`}
                            >
                              <EditIcon size={15} />
                              <span>Ubah</span>
                            </button>
                            <button
                              type="button"
                              className="btn-mobile-action danger"
                              onClick={() => handleDeleteTransaction(tx)}
                              aria-label={`Hapus transaksi ${tx.note || tx.category_name}`}
                            >
                              <TrashIcon size={15} />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Floating Action Button (FAB) for Mobile Handphone Navigation */}
      <div className="mobile-fab-container">
        <button 
          type="button" 
          className="mobile-fab-btn"
          onClick={handleOpenCreateTx}
          aria-label="Catat transaksi baru"
        >
          <PlusIcon size={18} />
          <span>Catat</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <p>
            <strong>DuitIN</strong> &copy; {new Date().getFullYear()} Personal Money Tracker. Database SQLite lokal.
          </p>
        </div>
      </footer>

      {/* Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={handleSaveAccount}
        editingAccount={editingAccount}
      />

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        accounts={accounts}
        categories={categories}
        editingTransaction={editingTx}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModalConfig.onConfirm}
        title={deleteModalConfig.title}
        message={deleteModalConfig.message}
        isDeleting={deleteModalConfig.isDeleting}
      />
    </div>
  );
}
