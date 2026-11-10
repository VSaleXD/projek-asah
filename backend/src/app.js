import cors from "cors";
import express from "express";
import { AppError, errorHandler } from "./http.js";
import bahan from "./routes/bahan.js";
import belanja from "./routes/belanja.js";
import menu from "./routes/menu.js";
import opname from "./routes/opname.js";
import penjualan from "./routes/penjualan.js";
import prediksi from "./routes/prediksi.js";
import stok from "./routes/stok.js";

export function buatApp() {
  const app = express();
  const asal = (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",").map((s) => s.trim());
  app.use(cors({ origin: asal }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/v1/health", (_req, res) => res.json({ data: { status: "ok" } }));

  app.use("/api/v1", (req, _res, next) => {
    const kode = process.env.KODE_AKSES;
    if (kode && req.get("x-kode-akses") !== kode) {
      return next(new AppError(401, "TIDAK_BERHAK", "Kode akses salah atau belum diisi."));
    }
    next();
  });

  app.use("/api/v1/bahan", bahan);
  app.use("/api/v1/menu", menu);
  app.use("/api/v1/penjualan", penjualan);
  app.use("/api/v1/stok", stok);
  app.use("/api/v1/opname", opname);
  app.use("/api/v1/belanja", belanja);
  app.use("/api/v1/prediksi", prediksi);

  app.use((_req, _res, next) => next(new AppError(404, "TIDAK_DITEMUKAN", "Alamat API tidak ditemukan.")));
  app.use(errorHandler);
  return app;
}
