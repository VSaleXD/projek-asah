import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../src/db.js";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");

const client = await pool.connect();
try {
  await client.query("create table if not exists _migrasi (nama text primary key, dijalankan_pada timestamptz not null default now())");
  const sudah = new Set((await client.query("select nama from _migrasi")).rows.map((r) => r.nama));
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (sudah.has(file)) continue;
    console.log("Menjalankan", file);
    await client.query("begin");
    try {
      await client.query(fs.readFileSync(path.join(dir, file), "utf8"));
      await client.query("insert into _migrasi (nama) values ($1)", [file]);
      await client.query("commit");
    } catch (e) {
      await client.query("rollback");
      throw e;
    }
  }
  console.log("Migrasi selesai.");
} finally {
  client.release();
  await pool.end();
}
