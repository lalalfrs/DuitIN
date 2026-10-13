export function formatRupiah(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

// Memformat angka menjadi string dengan pemisah ribuan titik (contoh: 300000 -> "300.000")
export function formatNumberWithDots(val) {
  if (val === null || val === undefined || val === '') return '';
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('id-ID').format(Number(clean));
}

// Mengurai string berpemisah titik menjadi angka murni (contoh: "300.000" -> 300000)
export function parseNumberFromDots(val) {
  if (val === null || val === undefined || val === '') return 0;
  const clean = String(val).replace(/\D/g, '');
  return clean ? Number(clean) : 0;
}

export function formatDateIndo(dateString) {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, parseInt(month, 10) - 1, day);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getAccountTypeLabel(type) {
  switch (type) {
    case 'cash':
      return 'Uang Tunai';
    case 'bank':
      return 'Rekening Bank';
    case 'ewallet':
      return 'Dompet Digital';
    default:
      return 'Akun Lain';
  }
}
