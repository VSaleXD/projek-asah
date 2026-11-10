import { Router } from "express";
import Joi from "joi";
import { tx } from "../db.js";
import { asyncHandler, validate } from "../http.js";
import { daftarBahanStok } from "../repo.js";
import { rekomendasiBelanja } from "../domain/stok.js";

const r = Router();

const skema = Joi.object({
  tanggal: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  catatan: Joi.string().max(500).allow("", null),
  items: Joi.array()
    .items(Joi.object({ bahan_id: Joi.string().uuid().required(), jumlah_aktual: Joi.number().min(0).required() }))
    .min(1)
    .unique("bahan_id")
    .required(),
});

r.post("/", validate(skema), asyncHandler(async (req, res) => {
  const { tanggal, catatan, items } = req.body;

  const hasil = await tx(async (c) => {
    const lama = await c.query("select id from opname where tanggal = $1 for update", [tanggal]);
    let opnameId;
    if (lama.rowCount) {
      opnameId = lama.rows[0].id;
      await c.query(
        "delete from stok_movement where referensi_id = $1 or referensi_id in (select id from belanja_item where opname_id = $1)",
        [opnameId],
      );
      await c.query("delete from belanja_item where opname_id = $1", [opnameId]);
      await c.query("delete from opname_item where opname_id = $1", [opnameId]);
      await c.query("update opname set catatan = $2 where id = $1", [opnameId, catatan || null]);
    } else {
      opnameId = (await c.query("insert into opname (tanggal, catatan) values ($1,$2) returning id", [tanggal, catatan || null])).rows[0].id;
    }

    for (const it of items) {
      const estimasi = (await c.query("select coalesce(sum(jumlah),0) as s from stok_movement where bahan_id = $1", [it.bahan_id])).rows[0].s;
      const selisih = Math.round((it.jumlah_aktual - estimasi) * 1000) / 1000;
      await c.query(
        "insert into opname_item (opname_id, bahan_id, jumlah_aktual, jumlah_estimasi, selisih) values ($1,$2,$3,$4,$5)",
        [opnameId, it.bahan_id, it.jumlah_aktual, estimasi, selisih],
      );
      if (selisih !== 0) {
        await c.query(
          "insert into stok_movement (bahan_id, tipe, jumlah, tanggal, referensi_id, catatan) values ($1,'koreksi',$2,$3,$4,'Cek stok malam')",
          [it.bahan_id, selisih, tanggal, opnameId],
        );
      }
    }

    const besok = (await c.query("select ($1::date + 1)::text as d", [tanggal])).rows[0].d;
    const bahan = await daftarBahanStok(c, besok);
    const rekomendasi = rekomendasiBelanja(bahan.map((b) => ({ bahan: b, stok: b.stok, prediksi: b.prediksi })));
    for (const x of rekomendasi) {
      await c.query(
        "insert into belanja_item (opname_id, bahan_id, jumlah_kemasan, jumlah_beli, alasan) values ($1,$2,$3,$4,$5)",
        [opnameId, x.bahan_id, x.jumlah_kemasan, x.jumlah_beli, x.alasan],
      );
    }
    const dipakaiPrediksi = bahan.some((b) => b.prediksi > 0);
    return { opname_id: opnameId, tanggal, tanggal_belanja: besok, memakai_prediksi: dipakaiPrediksi, belanja: rekomendasi };
  });

  res.status(201).json({ data: hasil });
}));

export default r;
