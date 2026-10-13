import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';

const COLOR_OPTIONS = [
  { label: 'Biru Utama', value: '#006199' },
  { label: 'Biru Langit', value: '#8ACFF8' },
  { label: 'Kuning Emas', value: '#FFD444' },
  { label: 'Kuning Lembut', value: '#F4EB6C' },
  { label: 'Hijau Segar', value: '#10B981' }
];

export function AccountModal({ isOpen, onClose, onSave, editingAccount }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState('#006199');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name || '');
      setType(editingAccount.type || 'bank');
      setInitialBalance(editingAccount.initial_balance !== undefined ? String(editingAccount.initial_balance) : '0');
      setColor(editingAccount.color || '#006199');
      setAccountNumber(editingAccount.account_number || '');
    } else {
      setName('');
      setType('bank');
      setInitialBalance('0');
      setColor('#006199');
      setAccountNumber('');
    }
    setError('');
  }, [editingAccount, isOpen]);

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Silakan isi nama akun atau dompet.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
        type,
        initial_balance: parseFloat(initialBalance) || 0,
        color,
        account_number: accountNumber.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan akun.');
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
        aria-labelledby="account-modal-title"
      >
        <div className="modal-header">
          <h2 id="account-modal-title" className="modal-title">
            {editingAccount ? 'Edit Akun atau Dompet' : 'Tambah Akun Baru'}
          </h2>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Tutup form akun"
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
          <div className="form-group">
            <label htmlFor="acc-name" className="form-label">
              Nama Akun / Dompet <span className="text-required">*</span>
            </label>
            <input
              id="acc-name"
              type="text"
              className="form-input"
              placeholder="Contoh: BCA, Cash, GoPay, Mandiri"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="acc-type" className="form-label">
              Tipe Akun <span className="text-required">*</span>
            </label>
            <select
              id="acc-type"
              className="form-select"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="cash">Uang Tunai (Cash / Dompet Saku)</option>
              <option value="bank">Rekening Bank (BCA, Mandiri, BRI, dll)</option>
              <option value="ewallet">Dompet Digital (GoPay, OVO, Dana, dll)</option>
              <option value="other">Investasi / Tabungan Lainnya</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="acc-init-bal" className="form-label">
              Saldo Awal (Rp) <span className="text-required">*</span>
            </label>
            <input
              id="acc-init-bal"
              type="number"
              min="0"
              step="1000"
              className="form-input tabular-nums"
              placeholder="0"
              value={initialBalance}
              onChange={e => setInitialBalance(e.target.value)}
              required
            />
            <span className="form-hint">Saldo awal sebelum pencatatan transaksi di aplikasi.</span>
          </div>

          <div className="form-group">
            <label htmlFor="acc-number" className="form-label">
              Nomor Rekening / Keterangan Tambahan
            </label>
            <input
              id="acc-number"
              type="text"
              className="form-input"
              placeholder="Contoh: 8820-192-301 atau 0812-xxxx"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Warna Penanda Akun</label>
            <div className="color-swatch-list">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className={`color-swatch-btn ${color === c.value ? 'selected' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  aria-label={c.label}
                />
              ))}
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
              {isSubmitting ? 'Menyimpan...' : (editingAccount ? 'Simpan Perubahan' : 'Tambah Akun')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
