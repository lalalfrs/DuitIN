export function formatRupiah(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
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
