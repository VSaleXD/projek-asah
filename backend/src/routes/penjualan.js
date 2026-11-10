import { Router } from "express";
import Joi from "joi";
import { query, tx } from "../db.js";
import { asyncHandler, validate } from "../http.js";
import { pemakaianDariPenjualan } from "../domain/stok.js";

const r = Router();
const tanggal = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).message("Tanggal harus berformat YYYY-MM-DD");

const buat = Joi.object({
  tanggal: tanggal.required(),
  items: Joi.array()
    .items(Joi.object({ menu_id: Joi.string().uuid().required(), qty: Joi.number().integer().min(1).required() }))
    .min(1)
    .required(),
});

r.get("/", asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `select p.id, p.tanggal, p.sumber, sum(i.qty)::int as total_porsi, count(*)::int as jumlah_menu
       from penjualan p join penjualan_item i on i.penjualan_id = p.id
      group by p.id order by p.tanggal desc, p.dibuat_pada desc limit 50`,
  );
  res.json({ data: rows });
}));

r.post("/", validate(buat), asyncHandler(async (req, res) => {
  const { tanggal: tgl, items } = req.body;
  const hasil = await tx(async (c) => {
    const p = (await c.query("insert into penjualan (tanggal) values ($1) returning id", [tgl])).rows[0];
    for (const it of items) {
      await c.query("insert into penjualan_item (penjualan_id, menu_id, qty) values ($1,$2,$3)", [p.id, it.menu_id, it.qty]);
    }
    const resep = (
      await c.query("select menu_id, bahan_id, jumlah from resep where menu_id = any($1::uuid[])", [
        [...new Set(items.map((i) => i.menu_id))],
      ])
    ).rows;
    const { pemakaian, menuTanpaResep } = pemakaianDariPenjualan(items, resep);
    for (const u of pemakaian) {
      await c.query(
        "insert into stok_movement (bahan_id, tipe, jumlah, tanggal, referensi_id) values ($1,'penjualan',$2,$3,$4)",
        [u.bahan_id, -u.jumlah, tgl, p.id],
      );
    }
    return { penjualan_id: p.id, bahan_terpotong: pemakaian.length, menu_tanpa_resep: menuTanpaResep };
  });
  res.status(201).json({ data: hasil });
}));

export default r;
