import "dotenv/config";
import pg from "pg";

// date -> "YYYY-MM-DD" (bukan objek Date), numeric/bigint -> number
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1700, (v) => parseFloat(v));
pg.types.setTypeParser(20, (v) => parseInt(v, 10));

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

export const query = (text, params) => pool.query(text, params);

/** Jalankan fungsi di dalam satu transaksi. */
export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const hasil = await fn(client);
    await client.query("commit");
    return hasil;
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}
