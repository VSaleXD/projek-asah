<section align="center">
  <img src="src/assets/Logo.jpg" alt="Judgels Logo" width="280" style="margin-bottom: 1.5rem;"/>
  <div align="center">
    <h1>Aplikasi Stok Ale's Place Cipoho</h1>
    <p><strong>Projek Akhir Dicoding Asah</strong><br/>
    Departemen Ilmu Komputer - IPB University<br/>
    </a></p>
    <p>Disusun oleh:</p>
    <table align="center" style="margin-top: 1rem; text-align: left; border-collapse: collapse;">
      <tr>
        <th style="padding: 6px 16px; border: 1px solid #444;">Nama</th>
        <th style="padding: 6px 16px; border: 1px solid #444;">NIM</th>
      </tr>
      <tr>
        <td style="padding: 6px 16px; border: 1px solid #444;"><strong>Mochamad Aleandre Moulidouane</strong></td>
        <td style="padding: 6px 16px; border: 1px solid #444;"><code>M0403241105</code></td>
      </tr>
    </table>
  </div>
  <br/>
</section>

# Stok Dapur

## Informasi Proyek

Stok Dapur adalah aplikasi web untuk digitalisasi pencatatan stok bahan makanan
di Ale's Place Cipoho, Sukabumi.

| Keterangan | Isi |
|---|---|
| ID Tim Capstone | A26-CS218 |
| Nama UMKM | Ale's Place Cipoho |
| Bidang | Kuliner |
| Judul Use Case | Digitalisasi Pencatatan Stok Bahan Makanan untuk Mengurangi Kesalahan Pemrosesan Manual |
| Tautan Use Case | https://ipb.link/use-case-ales-place |

## Ringkasan

Ale's Place Cipoho merupakan restoran masakan Jepang di Kota Sukabumi.
Pengelolaan dan pemantauan stok bahan baku masih dilakukan melalui pemeriksaan
fisik dan pencatatan manual menggunakan kertas setiap malam. Proses tersebut
memerlukan waktu, berisiko menimbulkan kesalahan pencatatan, dan menyulitkan
pemilik dalam memantau kondisi persediaan.

Stok Dapur membantu staf operasional dan pemilik mencatat bahan baku, mengelola
resep menu, mencatat penjualan, melakukan cek stok malam, serta membuat daftar
belanja berdasarkan kondisi persediaan. Stok dihitung menggunakan buku besar
pergerakan stok. Penjualan mengurangi stok berdasarkan resep menu, sedangkan cek
fisik malam mencatat koreksi jika terdapat perbedaan antara stok sistem dan stok
aktual.

## Cakupan Fitur

- Dashboard stok dan status bahan aman/menipis.
- Master data bahan, menu, dan resep.
- Pencatatan penjualan berdasarkan resep.
- Peringatan menu yang belum memiliki resep.
- Cek stok malam dan koreksi stok.
- Rekomendasi daftar belanja.
- Penandaan bahan yang sudah dibeli.
- Berbagi daftar belanja melalui WhatsApp dan cetak.
- Riwayat pergerakan stok dengan filter.
- Satu kode akses staf bersama.

Prediksi pemakaian disiapkan untuk tim Data Science melalui endpoint API yang
tersedia. Model prediksi dan fitur AI tidak dibuat oleh bagian Full-Stack.

## Di Luar Scope

- Integrasi langsung ke NutaCloud.
- Supabase atau BaaS sejenis.
- Chatbot.
- Reservasi atau fitur dine-in.
- Data pribadi pelanggan atau staf.
- Marketplace.

## Arsitektur

Frontend berada langsung di root workspace:

- `src/`
- `App.jsx`
- `main.jsx`

Backend Express berada di `backend/`.

Teknologi yang digunakan:

- Vite dan React.
- React Router.
- Axios.
- CSS biasa.
- Express 4 dengan JavaScript ESM.
- PostgreSQL/Neon.
- Joi untuk validasi request.

Semua request frontend harus melalui `src/api/client.js`. Saat development,
proxy Vite meneruskan `/api` ke `http://localhost:3000`.

## Struktur Penting

- `src/App.jsx` — routing aplikasi.
- `src/api/client.js` — Axios client dan pesan error.
- `src/components/` — komponen navigasi dan status halaman.
- `src/pages/` — halaman aplikasi.
- `src/style/japanese.css` — styling visual aplikasi.
- `backend/src/domain/stok.js` — aturan domain stok.
- `backend/src/routes/` — endpoint API.
