import { Router } from "express";
import Joi from "joi";
import { query, tx } from "../db.js";
import { AppError, asyncHandler, validate } from "../http.js";

const r = Router();

const buat = Joi.object({
  nama: Joi.string().trim().min(1).max(100).required(),
  harga: Joi.number().min(0).allow(null),
});
const resepSkema = Joi.object({
  resep: Joi.array()
    .items(Joi.object({ bahan_id: Joi.string().uuid().required(), jumlah: Joi.number().greater(0).required() }))
    .unique("bahan_id")
    .required(),
});

r.get("/", asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `select m.id, m.nama, m.harga, m.aktif,
            coalesce(json_agg(json_build_object('bahan_id', r.bahan_id, 'nama', b.nama, 'satuan', b.satuan, 'jumlah', r.jumlah)
                              order by b.nama) filter (where r.bahan_id is not null), '[]') as resep
       from menu m
       left join resep r on r.menu_id = m.id
       left join bahan b on b.id = r.bahan_id
      group by m.id
      order by m.nama`,
  );
  res.json({ data: rows });
}));

r.post("/", validate(buat), asyncHandler(async (req, res) => {
  const { rows } = await query("insert into menu (nama, harga) values ($1,$2) returning *", [
    req.body.nama,
    req.body.harga ?? null,
  ]);
  res.status(201).json({ data: rows[0] });
}));

r.put("/:id/resep", validate(resepSkema), asyncHandler(async (req, res) => {
  await tx(async (c) => {
    const ada = await c.query("select 1 from menu where id = $1", [req.params.id]);
    if (!ada.rowCount) throw new AppError(404, "TIDAK_DITEMUKAN", "Menu tidak ditemukan.");
    await c.query("delete from resep where menu_id = $1", [req.params.id]);
    for (const { bahan_id, jumlah } of req.body.resep) {
      await c.query("insert into resep (menu_id, bahan_id, jumlah) values ($1,$2,$3)", [req.params.id, bahan_id, jumlah]);
    }
  });
  res.json({ data: { menu_id: req.params.id, jumlah_bahan: req.body.resep.length } });
}));

export default r;
