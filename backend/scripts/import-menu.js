import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../src/db.js";

const csvPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "database", "menu_rows.csv");

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
    return Object.fromEntries(headers.map((header, column) => [header, values[column] ?? ""]));
  }).map((row, index) => {
    const nama = row.nama?.trim();
    const harga = row.harga?.trim();
    if (!nama || (harga && !/^\d+(\.\d+)?$/.test(harga))) {
      throw new Error(`Baris ${index + 2} tidak valid: nama atau harga salah.`);
    }
    return { nama, harga: harga ? Number(harga) : null };
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
      `insert into menu (nama, harga) values ($1, $2)
       on conflict (nama) do update set harga = excluded.harga`,
      [row.nama, row.harga],
    );
  }
  await client.query("commit");
  console.log(`${rows.length} menu berhasil diimpor dari ${csvPath}.`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
