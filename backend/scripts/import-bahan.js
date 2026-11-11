import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../src/db.js";

const csvPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "database", "bahanMakanan.normalized.csv");

function parseLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = parseLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line, index) => {
    const values = parseLine(line);
    const row = Object.fromEntries(headers.map((header, column) => [header, values[column]?.trim() ?? ""]));
    const ukuran = Number(row.ukuran_kemasan);
    if (!row.nama || !row.satuan || !row.pemasok || !Number.isFinite(ukuran) || ukuran <= 0) {
      throw new Error(`Baris ${index + 2} tidak valid.`);
    }
    return {
      nama: row.nama,
      kategori: row.pemasok,
      satuan: row.satuan,
      ukuran_kemasan: ukuran,
    };
  });
}

if (!fs.existsSync(csvPath)) {
  throw new Error(`File CSV tidak ditemukan: ${csvPath}`);
}

const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
const client = await pool.connect();
try {
  await client.query("begin");
  for (const row of rows) {
    await client.query(
      `insert into bahan (nama, satuan, kategori, stok_minimum, stok_target, ukuran_kemasan)
       values ($1, $2, $3, 0, 0, $4)
       on conflict (nama) do update set
         satuan = excluded.satuan,
         kategori = excluded.kategori,
         ukuran_kemasan = excluded.ukuran_kemasan`,
      [row.nama, row.satuan, row.kategori, row.ukuran_kemasan],
    );
  }
  await client.query("commit");
  console.log(`${rows.length} bahan berhasil diimpor dari ${csvPath}.`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
