import { Router } from "express";
import Joi from "joi";
import { query, tx } from "../db.js";
import { asyncHandler, validate } from "../http.js";

const r = Router();
const tanggal = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);

const skemaKirim = Joi.object({
  model_versi: Joi.string().max(50).required(),
  data: Joi.array()
    .items(Joi.object({ tanggal: tanggal.required(), bahan_id: Joi.string().uuid().required(), jumlah_prediksi: Joi.number().min(0).required() }))
    .min(1)
    .max(1000)
    .required(),
});

r.post("/", validate(skemaKirim), asyncHandler(async (req, res) => {
  const { model_versi, data } = req.body;
  await tx(async (c) => {
    for (const d of data) {
      await c.query(
        `insert into prediksi_pemakaian (tanggal, bahan_id, jumlah_prediksi, model_versi)
         values ($1,$2,$3,$4)
         on conflict (tanggal, bahan_id) do update
           set jumlah_prediksi = excluded.jumlah_prediksi, model_versi = excluded.model_versi, dibuat_pada = now()`,
        [d.tanggal, d.bahan_id, d.jumlah_prediksi, model_versi],
      );
    }
  });
  res.status(201).json({ data: { diterima: data.length, model_versi } });
}));

r.get("/", validate(Joi.object({ tanggal }), "query"), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `select p.tanggal, p.bahan_id, b.nama, b.satuan, p.jumlah_prediksi, p.model_versi
       from prediksi_pemakaian p join bahan b on b.id = p.bahan_id
      where ($1::date is null or p.tanggal = $1) order by p.tanggal desc, b.nama limit 500`,
    [req.query.tanggal ?? null],
  );
  res.json({ data: rows });
}));

export default r;
