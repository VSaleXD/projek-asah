import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";

const url = process.env.DATABASE_URL_TEST;

describe.skipIf(!url)("API (integrasi)", () => {
  let app, pool;
  const id = {};

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.KODE_AKSES = "";
    ({ pool } = await import("./db.js"));
    const { buatApp } = await import("./app.js");
    app = buatApp();
    const sql = (await import("node:fs")).readFileSync(new URL("../migrations/0001_init.sql", import.meta.url), "utf8");
    await pool.query("drop schema public cascade; create schema public;");
    await pool.query(sql);
  });
  afterAll(async () => pool?.end());

  const api = () => request(app);

  it("menolak data tidak valid dengan pesan jelas", async () => {
    const r = await api().post("/api/v1/bahan").send({ nama: "X" });
    expect(r.status).toBe(400);
    expect(r.body.error.kode).toBe("VALIDASI");
    const r2 = await api().post("/api/v1/bahan").send({ nama: "X", satuan: "kg", stok_minimum: 10, stok_target: 5 });
    expect(r2.status).toBe(422);
    expect(r2.body.error.kode).toBe("ATURAN_DATA");
  });

  it("menyiapkan bahan, menu, dan resep", async () => {
    id.beras = (await api().post("/api/v1/bahan").send({ nama: "Beras", satuan: "kg", stok_minimum: 10, stok_target: 40, ukuran_kemasan: 5 })).body.data.id;
    id.ayam = (await api().post("/api/v1/bahan").send({ nama: "Ayam", satuan: "kg", stok_minimum: 4, stok_target: 12, ukuran_kemasan: 1 })).body.data.id;
    const dup = await api().post("/api/v1/bahan").send({ nama: "Beras", satuan: "kg", stok_minimum: 1, stok_target: 2 });
    expect(dup.status).toBe(409);
    id.menu = (await api().post("/api/v1/menu").send({ nama: "Katsu Don", harga: 35000 })).body.data.id;
    const resep = await api().put(`/api/v1/menu/${id.menu}/resep`).send({ resep: [{ bahan_id: id.beras, jumlah: 0.2 }, { bahan_id: id.ayam, jumlah: 0.15 }] });
    expect(resep.status).toBe(200);
  });

  const stok = async (bahanId) => (await api().get("/api/v1/bahan")).body.data.find((b) => b.id === bahanId);

  it("cek stok pertama menetapkan stok awal lewat koreksi", async () => {
    const r = await api().post("/api/v1/opname").send({ tanggal: "2026-11-03", items: [{ bahan_id: id.beras, jumlah_aktual: 50 }, { bahan_id: id.ayam, jumlah_aktual: 10 }] });
    expect(r.status).toBe(201);
    expect(r.body.data.belanja).toEqual([]);
    expect((await stok(id.beras)).stok).toBe(50);
  });

  it("penjualan memotong stok sesuai resep", async () => {
    const r = await api().post("/api/v1/penjualan").send({ tanggal: "2026-11-04", items: [{ menu_id: id.menu, qty: 40 }] });
    expect(r.status).toBe(201);
    expect((await stok(id.beras)).stok).toBe(42);
    expect((await stok(id.ayam)).stok).toBe(4);
  });

  it("cek stok malam menandai bahan menipis dan membuat daftar belanja", async () => {
    const r = await api().post("/api/v1/opname").send({ tanggal: "2026-11-04", items: [{ bahan_id: id.beras, jumlah_aktual: 40 }, { bahan_id: id.ayam, jumlah_aktual: 3 }] });
    expect(r.status).toBe(201);
    expect(r.body.data.tanggal_belanja).toBe("2026-11-05");
    expect(r.body.data.belanja).toHaveLength(1);
    expect(r.body.data.belanja[0]).toMatchObject({ nama: "Ayam", jumlah_beli: 9, alasan: "di_bawah_minimum" });
    expect((await stok(id.beras)).stok).toBe(40); // selisih -2 tercatat sebagai koreksi
    const status = (await stok(id.ayam)).status;
    expect(status).toBe("menipis");
  });

  it("menandai sudah dibeli menambah stok, dan aman dipanggil dua kali", async () => {
    const daftar = (await api().get("/api/v1/belanja")).body.data;
    const item = daftar[0];
    await api().patch(`/api/v1/belanja/${item.id}`).send({ sudah_dibeli: true });
    await api().patch(`/api/v1/belanja/${item.id}`).send({ sudah_dibeli: true });
    expect((await stok(id.ayam)).stok).toBe(12);
    await api().patch(`/api/v1/belanja/${item.id}`).send({ sudah_dibeli: false });
    expect((await stok(id.ayam)).stok).toBe(3);
  });

  it("prediksi dari tim Data Science ikut menentukan rekomendasi", async () => {
    const p = await api().post("/api/v1/prediksi").send({ model_versi: "dummy-v1", data: [{ tanggal: "2026-11-05", bahan_id: id.beras, jumlah_prediksi: 35 }] });
    expect(p.status).toBe(201);
    const r = await api().post("/api/v1/opname").send({ tanggal: "2026-11-04", items: [{ bahan_id: id.beras, jumlah_aktual: 40 }, { bahan_id: id.ayam, jumlah_aktual: 3 }] });
    expect(r.body.data.memakai_prediksi).toBe(true);
    const beras = r.body.data.belanja.find((b) => b.nama === "Beras");
    expect(beras).toMatchObject({ alasan: "prediksi_pemakaian", jumlah_beli: 5 });
    expect((await stok(id.beras)).stok).toBe(40); // simpan ulang tidak menggandakan koreksi
  });

  it("riwayat pergerakan tersedia", async () => {
    const r = await api().get(`/api/v1/stok/pergerakan?bahan_id=${id.ayam}`);
    expect(r.status).toBe(200);
    expect(r.body.data.length).toBeGreaterThan(0);
  });

  it("kode akses melindungi API bila diatur", async () => {
    process.env.KODE_AKSES = "rahasia";
    expect((await api().get("/api/v1/bahan")).status).toBe(401);
    expect((await api().get("/api/v1/bahan").set("x-kode-akses", "rahasia")).status).toBe(200);
    process.env.KODE_AKSES = "";
  });
});
