import React, { useState, useEffect } from 'react';
import { CloseIcon, ArrowDownIcon, ArrowUpIcon } from './Icons';

export function TransactionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  accounts = [], 
  categories = [], 
  editingTransaction = null 
}) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type || 'expense');
      setAmount(editingTransaction.amount ? String(editingTransaction.amount) : '');
      setAccountId(editingTransaction.account_id ? String(editingTransaction.account_id) : '');
      setCategoryId(editingTransaction.category_id ? String(editingTransaction.category_id) : '');
      setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);
      setNote(editingTransaction.note || '');
    } else {
      setType('expense');
      setAmount('');
      setAccountId(accounts.length > 0 ? String(accounts[0].id) : '');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
    setError('');
  }, [editingTransaction, isOpen, accounts]);

  // Set default category based on type
  useEffect(() => {
    if (!editingTransaction && isOpen) {
      const filtered = categories.filter(c => c.type === type);
      if (filtered.length > 0) {
        setCategoryId(String(filtered[0].id));
      } else {
        setCategoryId('');
      }
    }
  }, [type, categories, editingTransaction, isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === type);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!accountId) {
      setError('Silakan pilih akun / dompet transaksi.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Nominal transaksi harus lebih dari Rp 0.');
      return;
    }
    if (!date) {
      setError('Silakan tentukan tanggal transaksi.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        account_id: parseInt(accountId, 10),
        category_id: categoryId ? parseInt(categoryId, 10) : null,
        type,
        amount: parsedAmount,
        date,
        note: note.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div 
        className="modal-box" 
        onClick={e => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="tx-modal-title"
      >
        <div className="modal-header">
          <h2 id="tx-modal-title" className="modal-title">
            {editingTransaction ? 'Edit Catatan Transaksi' : 'Catat Transaksi Baru'}
          </h2>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Tutup form transaksi"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {error && (
          <div className="alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Type Toggle: Pemasukan vs Pengeluaran */}
          <div className="type-toggle-group">
            <button
              type="button"
              className={`type-toggle-btn expense ${type === 'expense' ? 'active' : ''}`}
              onClick={() => setType('expense')}
            >
              <ArrowDownIcon size={16} />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              className={`type-toggle-btn income ${type === 'income' ? 'active' : ''}`}
              onClick={() => setType('income')}
            >
              <ArrowUpIcon size={16} />
              <span>Pemasukan</span>
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="tx-amount" className="form-label">
              Nominal (Rp) <span className="text-required">*</span>
            </label>
            <input
              id="tx-amount"
              type="number"
              min="1"
              step="1000"
              className="form-input form-input-lg tabular-nums"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="tx-account" className="form-label">
                Pilih Akun / Dompet <span className="text-required">*</span>
              </label>
              <select
                id="tx-account"
                className="form-select"
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                required
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group flex-1">
              <label htmlFor="tx-category" className="form-label">
                Kategori
              </label>
              <select
                id="tx-category"
                className="form-select"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                <option value="">Lain-lain / Tanpa Kategori</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="tx-date" className="form-label">
                Tanggal <span className="text-required">*</span>
              </label>
              <input
                id="tx-date"
                type="date"
                className="form-input"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-2">
              <label htmlFor="tx-note" className="form-label">
                Catatan / Keterangan
              </label>
              <input
                id="tx-note"
                type="text"
                className="form-input"
                placeholder="Misal: Makan siang, bayar wifi, kopi"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : (editingTransaction ? 'Simpan Perubahan' : 'Catat Transaksi')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
