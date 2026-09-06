import { Router } from "express";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { pool } from "../db.js";

const router = Router();
const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derivedKey = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ error: "Nome, e-mail e senha com no mínimo 6 caracteres são obrigatórios" });
  }
  try {
    const passwordHash = await hashPassword(password);
    const { rows } = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, LOWER($2), $3) RETURNING id, name, email",
      [name.trim(), email.trim(), passwordHash],
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "Este e-mail já está cadastrado" });
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar conta" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "E-mail e senha são obrigatórios" });
  try {
    const { rows } = await pool.query("SELECT id, name, email, password_hash FROM users WHERE email = LOWER($1)", [email.trim()]);
    if (!rows[0] || !(await verifyPassword(password, rows[0].password_hash))) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }
    const { password_hash: _, ...user } = rows[0];
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao fazer login" });
  }
});

export default router;
