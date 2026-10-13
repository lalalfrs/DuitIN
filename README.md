# DuitIN - Personal Money Tracker

DuitIN adalah aplikasi web pencatatan keuangan personal yang dirancang untuk memantau saldo di berbagai kantong akun (Cash, BCA, GoPay, dan rekening kustom), serta melacak arus kas pemasukan dan pengeluaran harian, mingguan, dan bulanan.

Aplikasi ini menggunakan arsitektur serverless modern berbasis **React (Vite)** dan **Supabase (PostgreSQL)**, sehingga dapat langsung di-deploy dengan mudah ke platform cloud seperti Vercel, Netlify, atau Cloudflare Pages tanpa membutuhkan server backend mandiri.

## Fitur Utama

- **Kantong Akun Fleksibel**: Lacak saldo uang tunai (Cash), rekening bank (BCA), dompet digital (GoPay), serta tambah, ubah, dan hapus akun kustom.
- **Lacak Arus Kas Terpadu**: Filter transaksi berdasarkan periode Hari Ini, 7 Hari Terakhir, Bulan Ini, dan Semua Waktu.
- **Grafik Tren Finansial**: Visualisasi tren pemasukan vs pengeluaran 7 hari terakhir secara interaktif.
- **Distribusi Kategori**: Analisis persentase alokasi pengeluaran bulanan per kategori.
- **Pencarian & Filter Lengkap**: Cari transaksi berdasarkan catatan atau saring berdasarkan akun dan tipe transaksi.
- **Dual Mode (Light & Dark)**: Dukungan tema terang dan gelap dengan palet warna terkurasi.
- **Mobile Responsive & Ramah Sentuhan**: Tampilan adaptif untuk smartphone dan desktop dengan tombol aksi cepat (FAB).
- **Database Supabase Cloud**: Menggunakan database PostgreSQL cloud Supabase dengan Row Level Security (RLS).

## Palet Warna

- Primary Blue: `#006199`
- Sky Blue: `#8ACFF8`
- Soft Lemon Yellow: `#F4EB6C`
- Vibrant Warm Yellow: `#FFD444`

## Teknologi

- **Frontend**: React (Vite)
- **Styling**: Vanilla CSS (CSS Variables, Flexbox, CSS Grid)
- **Database & Backend**: Supabase (PostgreSQL Cloud)
- **Client SDK**: `@supabase/supabase-js`

## Panduan Pengaturan Supabase

1. **Buat Proyek di Supabase**:
   - Masuk atau daftar di [supabase.com](https://supabase.com).
   - Buat proyek baru (*New Project*) dan tunggu hingga database siap.

2. **Jalankan Skema Database**:
   - Di dashboard Supabase, buka menu **SQL Editor** pada navigasi kiri.
   - Buka file `supabase/schema.sql` di proyek ini, salin seluruh kodenya, lalu tempelkan di SQL Editor Supabase.
   - Klik tombol **Run** untuk membuat tabel `accounts`, `categories`, `transactions`, kebijakan RLS, serta data bawaannya.

3. **Ambil Kredensial API**:
   - Di dashboard Supabase, buka menu **Project Settings** (ikon gerigi) -> **API**.
   - Salin **Project URL** dan **Project API Keys (anon public)**.

4. **Konfigurasi Environment**:
   - Salin file `.env.example` menjadi `.env`:
     ```bash
     cp .env.example .env
     ```
   - Masukkan nilai kredensial Anda ke dalam file `.env`:
     ```env
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     ```

## Menjalankan di Komputer Lokal

1. Pasang dependensi:
   ```bash
   npm install
   ```

2. Jalankan server pengembang (port 5173):
   ```bash
   npm run dev
   ```

3. Buka `http://localhost:5173` di peramban web.

## Panduan Deploy ke Vercel / Netlify

1. Hubungkan repositori GitHub `lalalfrs/DuitIN` ke Vercel atau Netlify.
2. Pada menu **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL`: URL proyek Supabase Anda.
   - `VITE_SUPABASE_ANON_KEY`: Anon key proyek Supabase Anda.
3. Klik **Deploy**. Aplikasi akan otomatis dibangun dan aktif secara daring.
