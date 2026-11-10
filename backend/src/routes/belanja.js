import { Router } from "express";
import Joi from "joi";
import { query, tx } from "../db.js";
import { AppError, asyncHandler, validate } from "../http.js";

const r = Router();

const skemaQuery = Joi.object({ tanggal: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/) });
const skemaUbah = Joi.object({ sudah_dibeli: Joi.boolean().required() });

// Daftar belanja dari cek stok pada tanggal tertentu (default: cek stok terakhir)
r.get("/", validate(skemaQuery, "query"), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `select bi.id, o.tanggal as tanggal_cek, b.id as bahan_id, b.nama, b.satuan,
            bi.jumlah_kemasan, bi.jumlah_beli, bi.alasan, bi.sudah_dibeli
       from belanja_item bi
       join opname o on o.id = bi.opname_id
       join bahan b on b.id = bi.bahan_id
      where o.tanggal = coalesce($1::date, (select max(tanggal) from opname))
      order by bi.sudah_dibeli, b.nama`,
    [req.query.tanggal ?? null],
  );
  res.json({ data: rows });
}));

// Tandai sudah dibeli -> stok bertambah (pergerakan 'pembelian'); batalkan -> stok dikembalikan
r.patch("/:id", validate(skemaUbah), asyncHandler(async (req, res) => {
  const hasil = await tx(async (c) => {
    const { rows } = await c.query("select * from belanja_item where id = $1 for update", [req.params.id]);
    const item = rows[0];
    if (!item) throw new AppError(404, "TIDAK_DITEMUKAN", "Item belanja tidak ditemukan.");
    const { sudah_dibeli } = req.body;
    if (item.sudah_dibeli !== sudah_dibeli) {
      await c.query("update belanja_item set sudah_dibeli = $2 where id = $1", [item.id, sudah_dibeli]);
      if (sudah_dibeli) {
        await c.query(
          `insert into stok_movement (bahan_id, tipe, jumlah, tanggal, referensi_id, catatan)
           values ($1,'pembelian',$2,(now() at time zone 'Asia/Jakarta')::date,$3,'Belanja')`,
          [item.bahan_id, item.jumlah_beli, item.id],
        );
      } else {
        await c.query("delete from stok_movement where referensi_id = $1 and tipe = 'pembelian'", [item.id]);
      }
    }
    return { id: item.id, sudah_dibeli };
  });
  res.json({ data: hasil });
}));

export default r;
