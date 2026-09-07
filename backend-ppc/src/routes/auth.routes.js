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
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, key] = storedHash.split(":");
  const derivedKey = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nome, email e senha são obrigatórios." });
    }

    const userRole = role === "admin" ? "admin" : "user";
    const hashedPassword = await hashPassword(password);

    // Salva na coluna password_hash esperada pelo banco
    const query = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role;
    `;
    const { rows } = await pool.query(query, [name, email, hashedPassword, userRole]);

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("ERRO NO CADASTRO:", error);
    if (error.code === "23505") {
      return res.status(409).json({ error: "Este e-mail já está cadastrado." });
    }
    return res.status(500).json({ error: "Erro ao cadastrar usuário." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    // Busca pelo password_hash
    const query = `SELECT id, name, email, role, password_hash FROM users WHERE email = $1;`;
    const { rows } = await pool.query(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const isValid = await verifyPassword(password, rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const user = {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      role: rows[0].role || "user",
    };

    return res.json(user);
  } catch (error) {
    console.error("ERRO NO LOGIN:", error);
    return res.status(500).json({ error: "Erro ao autenticar usuário." });
  }
});

export default router;