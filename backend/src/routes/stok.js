import { Router } from "express";
import Joi from "joi";
import { query } from "../db.js";
import { asyncHandler, validate } from "../http.js";

const r = Router();
const tanggal = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);

const skemaPergerakan = Joi.object({
  bahan_id: Joi.string().uuid(),
  dari: tanggal,
  sampai: tanggal,
  limit: Joi.number().integer().min(1).max(500).default(100),
});

r.get("/pergerakan", validate(skemaPergerakan, "query"), asyncHandler(async (req, res) => {
  const { bahan_id, dari, sampai, limit } = req.query;
  const { rows } = await query(
    `select m.id, m.tanggal, m.tipe, m.jumlah, m.catatan, b.id as bahan_id, b.nama, b.satuan
       from stok_movement m join bahan b on b.id = m.bahan_id
      where ($1::uuid is null or m.bahan_id = $1)
        and ($2::date is null or m.tanggal >= $2)
        and ($3::date is null or m.tanggal <= $3)
      order by m.tanggal desc, m.dibuat_pada desc
      limit $4`,
    [bahan_id ?? null, dari ?? null, sampai ?? null, limit],
  );
  res.json({ data: rows });
}));

export default r;
