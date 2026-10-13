import React from 'react';
import { formatRupiah } from '../utils/formatters';
import { CategoryIcon } from './Icons';

export function CategoryBreakdown({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="category-empty-state">
        <p>Belum ada pengeluaran yang tercatat pada bulan ini.</p>
      </div>
    );
  }

  const totalExpense = data.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

  return (
    <div className="category-breakdown-list">
      {data.map(item => {
        const percentage = totalExpense > 0 
          ? Math.round((item.total_amount / totalExpense) * 100) 
          : 0;

        return (
          <div key={item.category_name} className="category-item">
            <div className="category-item-header">
              <div className="category-info">
                <span className="category-icon-wrapper" style={{ color: item.category_color || '#006199' }}>
                  <CategoryIcon icon={item.category_icon || 'tag'} size={16} />
                </span>
                <span className="category-name">{item.category_name}</span>
              </div>
              <div className="category-numbers">
                <span className="category-amount tabular-nums">{formatRupiah(item.total_amount)}</span>
                <span className="category-percentage tabular-nums">({percentage}%)</span>
              </div>
            </div>

            <div className="progress-track" role="progressbar" aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: item.category_color || '#006199'
                }} 
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
