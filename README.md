# DuitIN - Personal Money Tracker

DuitIN adalah aplikasi web pencatatan keuangan personal yang dirancang untuk memantau saldo di berbagai kantong akun (Cash, BCA, GoPay, dan rekening kustom), serta melacak arus kas pemasukan dan pengeluaran harian, mingguan, dan bulanan.

## Fitur Utama

- **Kantong Akun Fleksibel**: Lacak saldo uang tunai (Cash), rekening bank (BCA), dompet digital (GoPay), serta tambah, ubah, dan hapus akun kustom.
- **Lacak Arus Kas Terpadu**: Filter transaksi berdasarkan periode Hari Ini, 7 Hari Terakhir, Bulan Ini, dan Semua Waktu.
- **Grafik Tren Finansial**: Visualisasi tren pemasukan vs pengeluaran 7 hari terakhir secara interaktif.
- **Distribusi Kategori**: Analisis persentase alokasi pengeluaran bulanan per kategori.
- **Pencarian & Filter Lengkap**: Cari transaksi berdasarkan catatan atau saring berdasarkan akun dan tipe transaksi.
- **Dual Mode (Light & Dark)**: Dukungan tema terang dan gelap dengan palet warna terkurasi.
- **Mobile Responsive & Ramah Sentuhan**: Tampilan adaptif untuk smartphone dan desktop dengan tombol aksi cepat (FAB).
- **Database SQLite Lokal**: Data tersimpan aman di server lokal menggunakan SQLite bawaan Node.js.

## Palet Warna

- Primary Blue: `#006199`
- Sky Blue: `#8ACFF8`
- Soft Lemon Yellow: `#F4EB6C`
- Vibrant Warm Yellow: `#FFD444`

## Teknologi

- **Frontend**: React (Vite)
- **Styling**: Vanilla CSS (CSS Variables, Flexbox, CSS Grid)
- **Backend**: Node.js, Express
- **Database**: SQLite (Node.js native `node:sqlite` DatabaseSync)

## Cara Menjalankan

1. Clone repositori:
   ```bash
   git clone https://github.com/lalalfrs/DuitIN.git
   cd DuitIN
   ```

2. Pasang dependensi:
   ```bash
   npm install
   ```

3. Jalankan backend dan frontend bersamaan:
   ```bash
   npm run dev
   ```
   Perintah ini menjalankan backend di port 5000 dan frontend di port 5173. Jangan menjalankan `node server/index.js` secara terpisah saat memakai perintah ini.

   Jika hanya ingin menjalankan backend:
   ```bash
   npm run server
   ```

4. Buka `http://localhost:5173` di peramban web.

> Catatan: fitur SQLite bawaan `node:sqlite` membutuhkan Node.js 22.5.0 atau lebih baru. Cek versi dengan `node --version`.
