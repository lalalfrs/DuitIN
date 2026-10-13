import React, { useState } from 'react';
import { formatRupiah } from '../utils/formatters';

export function TrendChart({ data = [] }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state">
        <p>Belum ada data transaksi 7 hari terakhir.</p>
      </div>
    );
  }

  // Find max value for scaling
  const maxVal = Math.max(
    ...data.map(d => Math.max(d.income || 0, d.expense || 0)),
    100000 // minimum scale baseline
  );

  const chartHeight = 96;
  const barWidth = 9;
  const groupSpacing = 36;
  const paddingX = 14;
  const svgWidth = data.length * groupSpacing + paddingX * 2;

  function handleBarClick(index) {
    setSelectedIndex(prev => (prev === index ? null : index));
  }

  return (
    <div className="trend-chart-container">
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-dot income" />
          <span>Pemasukan</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot expense" />
          <span>Pengeluaran</span>
        </div>
        <span className="chart-tap-hint">Ketuk batang untuk rincian</span>
      </div>

      <div className="chart-svg-wrapper">
        <svg 
          viewBox={`0 0 ${svgWidth} ${chartHeight + 24}`} 
          className="chart-svg"
          role="img"
          aria-label="Grafik arus kas 7 hari terakhir"
        >
          {/* Horizontal baseline */}
          <line 
            x1="0" 
            y1={chartHeight} 
            x2={svgWidth} 
            y2={chartHeight} 
            className="chart-grid-line" 
          />

          {data.map((item, index) => {
            const xCenter = paddingX + index * groupSpacing + groupSpacing / 2;
            const incHeight = Math.max(2, ((item.income || 0) / maxVal) * (chartHeight - 20));
            const expHeight = Math.max(2, ((item.expense || 0) / maxVal) * (chartHeight - 20));

            const incY = chartHeight - incHeight;
            const expY = chartHeight - expHeight;

            const isSelected = selectedIndex === index;

            return (
              <g 
                key={item.date} 
                className="chart-bar-group"
                onClick={() => handleBarClick(index)}
                onMouseEnter={() => setSelectedIndex(index)}
                tabIndex="0"
                role="button"
                aria-pressed={isSelected}
                aria-label={`${item.day}, ${item.date}: Pemasukan ${formatRupiah(item.income)}, Pengeluaran ${formatRupiah(item.expense)}`}
              >
                {/* Touch/Click target area for mobile */}
                <rect
                  x={xCenter - barWidth - 6}
                  y={0}
                  width={barWidth * 2 + 12}
                  height={chartHeight + 22}
                  fill="transparent"
                  className="chart-touch-target"
                />

                {/* Highlight background when selected */}
                {isSelected && (
                  <rect
                    x={xCenter - barWidth - 4}
                    y={6}
                    width={barWidth * 2 + 8}
                    height={chartHeight + 14}
                    rx="4"
                    className="chart-hover-bg"
                  />
                )}

                {/* Income Bar (Left) */}
                <rect
                  x={xCenter - barWidth - 1}
                  y={incY}
                  width={barWidth}
                  height={incHeight}
                  rx="2"
                  className="bar-income"
                />

                {/* Expense Bar (Right) */}
                <rect
                  x={xCenter + 1}
                  y={expY}
                  width={barWidth}
                  height={expHeight}
                  rx="2"
                  className="bar-expense"
                />

                {/* Day label */}
                <text
                  x={xCenter}
                  y={chartHeight + 14}
                  textAnchor="middle"
                  className={`chart-axis-label ${isSelected ? 'active' : ''}`}
                >
                  {item.day}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected or Hovered Tooltip */}
        {selectedIndex !== null && data[selectedIndex] && (
          <div className="chart-tooltip">
            <div className="tooltip-header">
              <span className="tooltip-date">
                {data[selectedIndex].day}, {data[selectedIndex].date}
              </span>
              <button 
                type="button" 
                className="tooltip-close"
                onClick={() => setSelectedIndex(null)}
                aria-label="Tutup detail tooltip"
              >
                &times;
              </button>
            </div>
            <div className="tooltip-row income">
              <span>Masuk:</span>
              <strong className="tabular-nums">{formatRupiah(data[selectedIndex].income)}</strong>
            </div>
            <div className="tooltip-row expense">
              <span>Keluar:</span>
              <strong className="tabular-nums">{formatRupiah(data[selectedIndex].expense)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
