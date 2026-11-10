export class AppError extends Error {
  constructor(status, kode, pesan, detail) {
    super(pesan);
    this.status = status;
    this.kode = kode;
    this.detail = detail;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const validate = (schema, sumber = "body") => (req, _res, next) => {
  const { value, error } = schema.validate(req[sumber], { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(new AppError(400, "VALIDASI", "Data yang dikirim belum valid.", error.details.map((d) => d.message)));
  }
  req[sumber] = value;
  next();
};

/** Terjemahkan galat PostgreSQL menjadi pesan yang jelas untuk pengguna. */
export function errorHandler(err, _req, res, _next) {
  let { status, kode, message: pesan, detail } = err;
  if (!status) {
    const peta = {
      "23505": [409, "DUPLIKAT", "Data dengan nama atau tanggal yang sama sudah ada."],
      "23503": [422, "RELASI_TIDAK_VALID", "Data yang dirujuk tidak ditemukan."],
      "23514": [422, "ATURAN_DATA", "Data melanggar aturan (mis. stok target lebih kecil dari stok minimum)."],
      "22P02": [400, "FORMAT_SALAH", "Format ID atau angka tidak valid."],
    };
    const cocok = peta[err.code];
    if (cocok) [status, kode, pesan] = cocok;
    else {
      console.error(err);
      [status, kode, pesan] = [500, "SERVER", "Terjadi kesalahan di server. Coba lagi sebentar lagi."];
    }
  }
  res.status(status).json({ error: { kode, pesan, detail } });
}
