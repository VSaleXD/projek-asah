import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.resolve(process.argv[2] ?? path.join(scriptDirectory, "..", "database", "bahanMakanan.csv"));
const outputPath = path.resolve(process.argv[3] ?? path.join(scriptDirectory, "..", "database", "bahanMakanan.normalized.csv"));
const errorPath = path.resolve(process.argv[4] ?? path.join(scriptDirectory, "..", "database", "bahanMakanan.errors.csv"));
const outputHeaders = ["pemasok", "nama", "harga", "ukuran_kemasan", "satuan", "harga_satuan"];

function parseCsv(content) {
  const records = [];
  let record = [];
  let cell = "";
  let quoted = false;
  let recordLine = 1;
  let line = 1;

  const pushRecord = () => {
    records.push({ values: record.concat(cell), line: recordLine });
    record = [];
    cell = "";
    recordLine = line;
  };

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === '"') {
      if (quoted && content[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      record.push(cell);
      cell = "";
    } else if (character === "\n" && !quoted) {
      pushRecord();
      line += 1;
    } else if (character === "\r" && !quoted) {
      if (content[index + 1] !== "\n") pushRecord();
      if (content[index + 1] !== "\n") line += 1;
    } else {
      cell += character;
      if (character === "\n") line += 1;
    }
  }
  if (record.length || cell) pushRecord();
  if (quoted) throw new Error("CSV memiliki tanda kutip yang tidak berpasangan.");
  return records;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeHeader(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizeName(value) {
  return cleanText(value).toLowerCase().replace(/\S+/g, (word) => `${word[0].toUpperCase()}${word.slice(1)}`);
}

function parseNumber(value) {
  const text = cleanText(value);
  if (!text) return null;
  if (!/^\d+(?:[.,]\d+)*$/.test(text)) return { error: `Angka tidak valid: "${text}"` };
  const normalized = text.replaceAll(".", "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : { error: `Angka tidak valid: "${text}"` };
}

function formatNumber(value) {
  if (value === null || value === "") return "";
  return String(value);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(headers, rows) {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
}

if (!fs.existsSync(inputPath)) {
  throw new Error(`File CSV tidak ditemukan: ${inputPath}`);
}

const records = parseCsv(fs.readFileSync(inputPath, "utf8"));
const validRows = [];
const errorRows = [];
const suppliers = new Set();
const names = new Map();
let currentSupplier = "";
let currentColumns = null;
let inputRows = 0;

for (const record of records) {
  const values = record.values.map(cleanText);
  if (values.every((value) => !value)) continue;
  inputRows += 1;

  const first = normalizeHeader(values[0]);
  const second = normalizeHeader(values[1]);
  const isHeader = first === "no" || first === "nomor";
  if (values[0] === "" && values[1]) {
    currentSupplier = cleanText(values[1]);
    currentColumns = null;
    suppliers.add(currentSupplier);
    continue;
  }
  if (isHeader) {
    const supplierInHeader = second && !["bahan", "nama", "nama bahan"].includes(second);
    if (supplierInHeader) {
      currentSupplier = cleanText(values[1]);
      suppliers.add(currentSupplier);
    } else if (!second) {
      currentSupplier = "";
    }
    const columns = values.map(normalizeHeader);
    currentColumns = supplierInHeader
      ? { name: 1, price: 2, packageSize: 3, unit: 4, unitPrice: 5 }
      : {
          name: columns.findIndex((column) => ["bahan", "nama", "nama bahan"].includes(column)),
          price: columns.findIndex((column) => column === "harga"),
          packageSize: columns.findIndex((column) => ["kemasan", "quantity", "kuantitas"].includes(column)),
          unit: columns.findIndex((column) => ["satuan", "unit"].includes(column)),
          unitPrice: columns.findIndex((column) => ["harga satuan", "harga per satuan"].includes(column)),
        };
    continue;
  }

  const rowError = (message) => errorRows.push({
    baris: record.line,
    pemasok: currentSupplier,
    data: values.join(" | "),
    error: message,
  });

  if (!currentColumns) {
    rowError("Baris data berada di luar tabel atau pemasok tidak dapat ditentukan.");
    continue;
  }
  if (!currentSupplier) {
    rowError("Nama pemasok tidak dapat ditentukan.");
    continue;
  }
  const missingColumn = Object.entries(currentColumns).find(([, index]) => index < 0);
  if (missingColumn) {
    rowError(`Kolom wajib tidak ditemukan: ${missingColumn[0]}.`);
    continue;
  }

  const name = normalizeName(values[currentColumns.name]);
  const unit = cleanText(values[currentColumns.unit]).toLowerCase();
  const price = parseNumber(values[currentColumns.price]);
  const packageSize = parseNumber(values[currentColumns.packageSize]);
  const unitPriceValue = parseNumber(values[currentColumns.unitPrice]);
  const problems = [];
  if (!name) problems.push("Nama bahan kosong.");
  if (price?.error) problems.push(price.error);
  if (packageSize?.error) problems.push(packageSize.error);
  if (unitPriceValue?.error) problems.push(unitPriceValue.error);
  if (!unit) problems.push("Satuan kosong.");
  if (price !== null && price !== undefined && !price.error && price < 0) problems.push("Harga tidak boleh negatif.");
  if (packageSize !== null && packageSize !== undefined && !packageSize.error && packageSize <= 0) problems.push("Ukuran kemasan harus lebih besar dari nol.");
  if (problems.length) {
    rowError(problems.join(" "));
    continue;
  }

  let unitPrice = unitPriceValue;
  if (unitPrice === null && price !== null && packageSize !== null) {
    unitPrice = Math.round((price / packageSize) * 1000) / 1000;
  } else if (unitPrice === null) {
    rowError("Harga satuan kosong dan tidak dapat dihitung karena harga atau ukuran kemasan kosong.");
    continue;
  }
  const row = {
    pemasok: currentSupplier,
    nama: name,
    harga: formatNumber(price),
    ukuran_kemasan: formatNumber(packageSize),
    satuan: unit,
    harga_satuan: formatNumber(unitPrice),
  };
  validRows.push(row);
  suppliers.add(currentSupplier);
  const key = name.toLowerCase();
  names.set(key, (names.get(key) ?? 0) + 1);
}

const duplicateNames = [...names.entries()].filter(([, count]) => count > 1).map(([name, count]) => `${name} (${count})`);
fs.writeFileSync(outputPath, toCsv(outputHeaders, validRows.map((row) => outputHeaders.map((header) => row[header]))), "utf8");
fs.writeFileSync(
  errorPath,
  toCsv(["baris", "pemasok", "data", "error"], errorRows.map((row) => [row.baris, row.pemasok, row.data, row.error])),
  "utf8",
);

console.log(`Baris input (non-kosong): ${inputRows}`);
console.log(`Baris berhasil: ${validRows.length}`);
console.log(`Baris error: ${errorRows.length}`);
console.log(`Pemasok ditemukan: ${[...suppliers].join(", ") || "(tidak ada)"}`);
console.log(`Duplikasi nama bahan: ${duplicateNames.length ? duplicateNames.join(", ") : "tidak ada"}`);
console.log(`File bersih: ${outputPath}`);
console.log(`File error: ${errorPath}`);
