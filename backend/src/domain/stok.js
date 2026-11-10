const EPS = 1e-9;
const bulatkan = (n) => Math.round(n * 1000) / 1000;

export function statusStok(stok, minimum) {
  return stok < minimum ? "menipis" : "aman";
}

export function hitungKemasan(kekurangan, ukuranKemasan) {
  if (kekurangan <= 0 || ukuranKemasan <= 0) return 0;
  return Math.ceil(kekurangan / ukuranKemasan - EPS);
}

export function pemakaianDariPenjualan(items, resep) {
  const perMenu = new Map();
  for (const r of resep) {
    const daftar = perMenu.get(r.menu_id) ?? [];
    daftar.push(r);
    perMenu.set(r.menu_id, daftar);
  }
  const total = new Map();
  const tanpaResep = new Set();
  for (const { menu_id, qty } of items) {
    const bahanMenu = perMenu.get(menu_id);
    if (!bahanMenu) {
      tanpaResep.add(menu_id);
      continue;
    }
    for (const { bahan_id, jumlah } of bahanMenu) {
      total.set(bahan_id, (total.get(bahan_id) ?? 0) + jumlah * qty);
    }
  }
  return {
    pemakaian: [...total].map(([bahan_id, jumlah]) => ({ bahan_id, jumlah: bulatkan(jumlah) })),
    menuTanpaResep: [...tanpaResep],
  };
}

export function rekomendasiBelanja(daftar) {
  const hasil = [];
  for (const { bahan, stok, prediksi = 0 } of daftar) {
    if (!bahan.aktif) continue;
    const sisaBesok = stok - prediksi;
    const dibawahMinimum = stok < bahan.stok_minimum;
    if (!dibawahMinimum && sisaBesok >= bahan.stok_minimum) continue;

    const target = Math.max(bahan.stok_target, prediksi + bahan.stok_minimum);
    const kemasan = hitungKemasan(target - stok, bahan.ukuran_kemasan);
    if (kemasan <= 0) continue;

    hasil.push({
      bahan_id: bahan.id,
      nama: bahan.nama,
      satuan: bahan.satuan,
      stok,
      stok_minimum: bahan.stok_minimum,
      prediksi,
      jumlah_kemasan: kemasan,
      jumlah_beli: bulatkan(kemasan * bahan.ukuran_kemasan),
      alasan: dibawahMinimum ? "di_bawah_minimum" : "prediksi_pemakaian",
      _urgensi: bahan.stok_minimum > 0 ? sisaBesok / bahan.stok_minimum : 0,
    });
  }
  return hasil
    .sort((a, b) => a._urgensi - b._urgensi)
    .map(({ _urgensi, ...baris }) => baris);
}
