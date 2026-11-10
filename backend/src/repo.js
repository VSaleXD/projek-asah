// Query yang dipakai bersama beberapa route.

/** Semua bahan + stok saat ini (SUM pergerakan) + prediksi untuk tanggal tertentu (opsional). */
export async function daftarBahanStok(db, tanggalPrediksi = null) {
  const { rows } = await db.query(
    `select b.id, b.nama, b.satuan, b.kategori, b.stok_minimum, b.stok_target, b.ukuran_kemasan, b.aktif,
            coalesce(s.stok, 0) as stok,
            coalesce(p.jumlah_prediksi, 0) as prediksi
       from bahan b
       left join (select bahan_id, sum(jumlah) as stok from stok_movement group by bahan_id) s on s.bahan_id = b.id
       left join prediksi_pemakaian p on p.bahan_id = b.id and p.tanggal = $1::date
      order by b.nama`,
    [tanggalPrediksi],
  );
  return rows;
}
