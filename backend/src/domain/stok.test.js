import { describe, expect, it } from "vitest";
import { hitungKemasan, pemakaianDariPenjualan, rekomendasiBelanja, statusStok } from "./stok.js";

const bahan = (o = {}) => ({
  id: "a", nama: "Beras", satuan: "kg",
  stok_minimum: 5, stok_target: 20, ukuran_kemasan: 5, aktif: true, ...o,
});

describe("statusStok", () => {
  it("menipis hanya jika di bawah minimum", () => {
    expect(statusStok(4.9, 5)).toBe("menipis");
    expect(statusStok(5, 5)).toBe("aman");
  });
});

describe("hitungKemasan", () => {
  it("membulatkan ke atas", () => expect(hitungKemasan(17, 5)).toBe(4));
  it("0 bila tidak ada kekurangan", () => expect(hitungKemasan(0, 5)).toBe(0));
  it("tahan galat floating point", () => expect(hitungKemasan(0.3, 0.1)).toBe(3));
});

describe("pemakaianDariPenjualan", () => {
  const resep = [
    { menu_id: "m1", bahan_id: "beras", jumlah: 0.2 },
    { menu_id: "m1", bahan_id: "ayam", jumlah: 0.15 },
    { menu_id: "m2", bahan_id: "beras", jumlah: 0.1 },
  ];
  it("menjumlahkan pemakaian antar menu", () => {
    const { pemakaian, menuTanpaResep } = pemakaianDariPenjualan(
      [{ menu_id: "m1", qty: 3 }, { menu_id: "m2", qty: 2 }, { menu_id: "m3", qty: 1 }],
      resep,
    );
    expect(pemakaian.find((p) => p.bahan_id === "beras").jumlah).toBe(0.8);
    expect(pemakaian.find((p) => p.bahan_id === "ayam").jumlah).toBe(0.45);
    expect(menuTanpaResep).toEqual(["m3"]);
  });
});

describe("rekomendasiBelanja", () => {
  it("menandai bahan di bawah minimum", () => {
    const [r] = rekomendasiBelanja([{ bahan: bahan(), stok: 3 }]);
    expect(r).toMatchObject({ jumlah_kemasan: 4, jumlah_beli: 20, alasan: "di_bawah_minimum" });
  });
  it("tidak merekomendasikan bahan yang aman", () => {
    expect(rekomendasiBelanja([{ bahan: bahan(), stok: 12 }])).toEqual([]);
  });
  it("memakai prediksi pemakaian besok bila ada", () => {
    const [r] = rekomendasiBelanja([{ bahan: bahan(), stok: 12, prediksi: 8 }]);
    expect(r).toMatchObject({ alasan: "prediksi_pemakaian", jumlah_kemasan: 2, jumlah_beli: 10 });
  });
  it("target naik bila prediksi melebihi stok_target", () => {
    const [r] = rekomendasiBelanja([{ bahan: bahan({ stok_target: 10 }), stok: 6, prediksi: 30 }]);
    expect(r.jumlah_beli).toBe(30); // target 35, kurang 29 -> 6 kemasan @5
  });
  it("mengabaikan bahan nonaktif dan mengurutkan paling mendesak dulu", () => {
    const hasil = rekomendasiBelanja([
      { bahan: bahan({ id: "x", nama: "X" }), stok: 4 },
      { bahan: bahan({ id: "y", nama: "Y" }), stok: 1 },
      { bahan: bahan({ id: "z", nama: "Z", aktif: false }), stok: 0 },
    ]);
    expect(hasil.map((h) => h.bahan_id)).toEqual(["y", "x"]);
  });
});
