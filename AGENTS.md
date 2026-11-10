# Stok Dapur — panduan untuk coding agent

## Konteks
Capstone Asah 2026 untuk UMKM Ale's Place Cipoho (restoran Jepang, Sukabumi). Use case yang sudah dikonfirmasi owner:
digitalisasi pengecekan stok bahan baku malam hari. Detail ada di `docs/ASUMSI.md`.

## Batasan keras
- **Dilarang memakai Supabase** (atau BaaS sejenis). Backend wajib Express buatan sendiri, database PostgreSQL biasa (Neon).
- **Di luar scope** (jangan dikerjakan): integrasi langsung ke NutaCloud, chatbot, reservasi/dine-in, data pribadi pelanggan,
  database/manajemen data staf, marketplace.
- Jangan menambah teknologi baru tanpa alasan kuat. Tim tidak punya waktu belajar tool baru (4 minggu).

## Arsitektur
- `backend/` Express 4 (ESM, JavaScript). URL `/api/v1/<resource>`. Validasi Joi di setiap route. Galat JSON seragam:
  `{ "error": { "kode", "pesan", "detail" } }`; sukses: `{ "data": ... }`.
- Frontend berada di root workspace (`src/`, `App.jsx`, `main.jsx`): Vite + React + React Router + Axios. Semua panggilan API lewat `src/api/client.js`.
- Stok disimpan sebagai **buku besar** `stok_movement` (penjualan, pembelian, koreksi, buang). Stok saat ini = SUM per bahan.
  Jangan menyimpan kolom "stok" yang diubah langsung.

## Aturan domain (satu sumber: `backend/src/domain/stok.js`, wajib ada tes)
- Menipis bila `stok < stok_minimum` (strictly di bawah).
- Jumlah beli = ceil((target − stok) / ukuran_kemasan) kemasan. Target = max(stok_target, prediksi_besok + stok_minimum).
- Bila ada prediksi untuk besok: perlu beli juga bila `stok − prediksi < stok_minimum`. Tanpa prediksi, hanya aturan minimum.
- Penjualan memotong stok menurut `resep` (bahan per 1 porsi menu). Menu tanpa resep dilaporkan di respons, tidak diam-diam diabaikan.
- Cek stok malam (`opname`) = hitungan fisik. Selisih terhadap estimasi sistem dicatat sebagai `koreksi`. Satu cek per tanggal;
  simpan ulang pada tanggal yang sama menimpa cek itu (dan menghapus dampaknya).
- Tanggal "hari ini" memakai zona Asia/Jakarta.

## Konvensi
- UI dan pesan galat: bahasa Indonesia, kalimat aksi jelas ("Simpan cek stok", bukan "Submit"). Galat tidak minta maaf dan menjelaskan solusinya.
- Mobile-first (staf memakai HP). Input angka: `inputMode="decimal"`. Setiap aksi harus menampilkan status: memuat, berhasil, atau gagal.
- Jangan commit `.env`. Data contoh di seed adalah DUMMY dan harus berlabel begitu.
- Sebelum menyatakan tugas selesai: `cd backend && npm test` (dengan `DATABASE_URL_TEST`) dan `cd frontend && npm run build` harus lolos.

## Alur kerja
Kerjakan satu tugas dari `docs/TASKS.md` per sesi, urut dari atas. Perubahan kontrak API harus memperbarui `docs/API.md`
dan diberitahukan ke tim Data Science.
