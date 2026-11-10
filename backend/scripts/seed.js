// Data contoh (DUMMY) agar aplikasi bisa dicoba. Ganti dengan data asli dari Ale's Place Cipoho.
import "dotenv/config";
import { pool } from "../src/db.js";

const bahan = [
  // nama, satuan, kategori, minimum, target, kemasan
  ["Beras Jepang", "kg", "Bahan pokok", 10, 40, 5],
  ["Ayam fillet", "kg", "Protein", 4, 12, 1],
  ["Telur", "kg", "Protein", 2, 8, 1],
  ["Nori", "lembar", "Bahan kering", 50, 200, 50],
  ["Saus teriyaki", "liter", "Bumbu", 2, 6, 1],
  ["Minyak goreng", "liter", "Bahan pokok", 4, 16, 2],
];
const menu = [
  ["Chicken Katsu Don", 35000, [["Beras Jepang", 0.2], ["Ayam fillet", 0.15], ["Telur", 0.05], ["Minyak goreng", 0.1]]],
  ["Chicken Teriyaki Don", 33000, [["Beras Jepang", 0.2], ["Ayam fillet", 0.15], ["Saus teriyaki", 0.03]]],
  ["Onigiri", 12000, [["Beras Jepang", 0.1], ["Nori", 1]]],
];

const c = await pool.connect();
try {
  await c.query("begin");
  const id = {};
  for (const [nama, satuan, kategori, min, target, kemasan] of bahan) {
    const r = await c.query(
      `insert into bahan (nama, satuan, kategori, stok_minimum, stok_target, ukuran_kemasan)
       values ($1,$2,$3,$4,$5,$6) on conflict (nama) do update set nama = excluded.nama returning id`,
      [nama, satuan, kategori, min, target, kemasan],
    );
    id[nama] = r.rows[0].id;
  }
  for (const [nama, harga, resep] of menu) {
    const m = await c.query(
      "insert into menu (nama, harga) values ($1,$2) on conflict (nama) do update set harga = excluded.harga returning id",
      [nama, harga],
    );
    for (const [b, jumlah] of resep) {
      await c.query(
        "insert into resep (menu_id, bahan_id, jumlah) values ($1,$2,$3) on conflict (menu_id, bahan_id) do update set jumlah = excluded.jumlah",
        [m.rows[0].id, id[b], jumlah],
      );
    }
  }
  await c.query("commit");
  console.log("Seed selesai (data dummy).");
} catch (e) {
  await c.query("rollback");
  throw e;
} finally {
  c.release();
  await pool.end();
}
