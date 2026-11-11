import { Router } from "express";
import Joi from "joi";
import { query, tx } from "../db.js";
import { AppError, asyncHandler, validate } from "../http.js";
import { daftarBahanStok } from "../repo.js";
import { statusStok } from "../domain/stok.js";

const r = Router();

const dasar = {
  nama: Joi.string().trim().min(1).max(100),
  satuan: Joi.string().trim().min(1).max(20),
  kategori: Joi.string().trim().max(50).allow(null, ""),
  stok_minimum: Joi.number().min(0),
  stok_target: Joi.number().min(0),
  ukuran_kemasan: Joi.number().greater(0),
  aktif: Joi.boolean(),
};
const buat = Joi.object({
  ...dasar,
  nama: dasar.nama.required(),
  satuan: dasar.satuan.required(),
  stok_minimum: dasar.stok_minimum.required(),
  stok_target: dasar.stok_target.required(),
  ukuran_kemasan: dasar.ukuran_kemasan.default(1),
});
const ubahDenganStok = Joi.object({
  ...dasar,
  stok: Joi.number().min(0),
}).min(1);

r.get("/", asyncHandler(async (_req, res) => {
  const rows = await daftarBahanStok({ query });
  res.json({
    data: rows.map((b) => ({ ...b, status: statusStok(b.stok, b.stok_minimum) })),
  });
}));

r.post("/", validate(buat), asyncHandler(async (req, res) => {
  const b = req.body;
  const { rows } = await query(
    `insert into bahan (nama, satuan, kategori, stok_minimum, stok_target, ukuran_kemasan)
     values ($1,$2,$3,$4,$5,$6) returning *`,
    [b.nama, b.satuan, b.kategori || null, b.stok_minimum, b.stok_target, b.ukuran_kemasan],
  );
  res.status(201).json({ data: rows[0] });
}));

r.patch("/:id", validate(ubahDenganStok), asyncHandler(async (req, res) => {
  const hasil = await tx(async (c) => {
    const lama = (await c.query("select * from bahan where id = $1 for update", [req.params.id])).rows[0];
    if (!lama) throw new AppError(404, "TIDAK_DITEMUKAN", "Bahan tidak ditemukan.");

    const { stok, ...perubahan } = req.body;
    const kolom = Object.keys(perubahan);
    if (kolom.length) {
      const set = kolom.map((k, i) => `${k} = $${i + 2}`).join(", ");
      await c.query(`update bahan set ${set} where id = $1`, [
        req.params.id,
        ...kolom.map((k) => (k === "kategori" ? perubahan[k] || null : perubahan[k])),
      ]);
    }
    if (stok !== undefined) {
      const sekarang = Number((await c.query(
        "select coalesce(sum(jumlah), 0) as stok from stok_movement where bahan_id = $1",
        [req.params.id],
      )).rows[0].stok);
      const selisih = stok - sekarang;
      if (selisih !== 0) {
        await c.query(
          `insert into stok_movement (bahan_id, tipe, jumlah, tanggal, catatan)
           values ($1, 'koreksi', $2, (now() at time zone 'Asia/Jakarta')::date, 'Penyesuaian stok dari halaman bahan')`,
          [req.params.id, selisih],
        );
      }
    }
    return (await c.query("select * from bahan where id = $1", [req.params.id])).rows[0];
  });
  res.json({ data: hasil });
}));

export default r;
