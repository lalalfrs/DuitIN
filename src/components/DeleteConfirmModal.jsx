import React, { useEffect } from 'react';
import { CloseIcon, TrashIcon } from './Icons';

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message, isDeleting }) {
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

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div 
        className="modal-box modal-box-sm" 
        onClick={e => e.stopPropagation()} 
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
      >
        <div className="modal-header">
          <h2 id="delete-dialog-title" className="modal-title text-danger">
            {title || 'Konfirmasi Hapus'}
          </h2>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Tutup dialog konfirmasi"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p id="delete-dialog-desc" className="dialog-text">
            {message || 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.'}
          </p>
        </div>

        <div className="modal-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Batal
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            <TrashIcon size={16} />
            <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
