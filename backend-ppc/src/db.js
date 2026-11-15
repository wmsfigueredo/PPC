import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      point_id INTEGER NOT NULL REFERENCES points(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      type VARCHAR(30) NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      dedupe_key TEXT
    )
  `);
  await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS dedupe_key TEXT");
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedupe_key_unique
    ON notifications (dedupe_key)
    WHERE dedupe_key IS NOT NULL
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS notifications_created_at_idx
    ON notifications (created_at DESC)
  `);
}