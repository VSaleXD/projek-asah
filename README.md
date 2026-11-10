<section align="center">
  <img src="src/assets/Logo.jpg" alt="Judgels Logo" width="280" style="margin-bottom: 1.5rem;"/>
  <div align="center">
    <h1>Aplikasi Stok Ale's Place Cipoho</h1>
    <p><strong>Projek Akhir Dicoding Asah</strong><br/>
    Departemen Ilmu Komputer - IPB University<br/>
    Target Deployment: <a href="https://alesplacecipoho.web.id">
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

Frontend Stok Dapur berada langsung di root workspace (`src/`, `App.jsx`, dan
`main.jsx`). Backend Express berada di [`backend/`](backend/).

## Menjalankan lokal

Jalankan dua proses dari terminal terpisah:

```bash
npm run dev
cd backend
npm run dev
```

Frontend meneruskan `/api` ke `http://localhost:3000` melalui proxy Vite.
Kontrak endpoint tersedia di [`docs/API.md`](docs/API.md).

Proyek ini tidak memakai Supabase atau BaaS sejenis. Jangan commit `.env`,
`_ref/`, atau data nyata.

## Konfigurasi produksi

Frontend memakai `VITE_API_URL` untuk alamat backend, misalnya:

```env
VITE_API_URL=https://api.example.com/api/v1
```

Salin [`.env.example`](.env.example) menjadi `.env` bila perlu. File `.env`
tidak boleh di-commit.

Backend memakai `DATABASE_URL`, `CORS_ORIGIN`, dan `KODE_AKSES` dari
`backend/.env` (lihat [`backend/.env.example`](backend/.env.example)).
Isi `CORS_ORIGIN` dengan URL frontend produksi. Jangan deploy sebelum
`KODE_AKSES` diisi. Untuk Cloudflare Pages/Netlify, build command adalah
`npm run build`, publish directory `dist`, dan file `public/_redirects`
menjaga routing React tetap berjalan. Deploy belum dilakukan dari workspace ini.
