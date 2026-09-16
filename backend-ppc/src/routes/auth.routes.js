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
  const keyBuffer = Buffer.from(key, "hex");
  
  if (keyBuffer.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Preencha nome, e-mail e senha." });
    }

    const userRole = role === "admin" ? "admin" : "user";
    const hashedPassword = await hashPassword(password);

    const query = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role;
    `;
    const { rows } = await pool.query(query, [name.trim(), email.trim().toLowerCase(), hashedPassword, userRole]);

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("ERRO NO CADASTRO:", error);
    if (error.code === "23505") {
      return res.status(409).json({ error: "Este e-mail já está cadastrado. Tente fazer login." });
    }
    return res.status(500).json({ error: "Erro interno no servidor ao cadastrar." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Informe e-mail e senha para entrar." });
    }

    const query = `SELECT id, name, email, role, password_hash FROM users WHERE LOWER(email) = $1;`;
    const { rows } = await pool.query(query, [email.trim().toLowerCase()]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "E-mail não cadastrado no sistema." });
    }

    const user = rows[0];
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: "Senha incorreta. Verifique e tente novamente." });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
    });
  } catch (error) {
    console.error("ERRO NO LOGIN:", error);
    return res.status(500).json({ error: "Erro interno no servidor ao autenticar." });
  }
});

// GET /api/auth/users - Listar todos os usuários cadastrados
router.get("/users", async (req, res) => {
  try {
    const query = `
      SELECT id, name, email, role, created_at 
      FROM users 
      ORDER BY id ASC;
    `;
    const { rows } = await pool.query(query);
    return res.json(rows);
  } catch (error) {
    console.error("ERRO AO BUSCAR USUÁRIOS:", error);
    return res.status(500).json({ error: "Erro ao buscar perfis cadastrados." });
  }
});

// DELETE /api/auth/users/:id - Excluir um perfil de usuário
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Remove o usuário do banco
    const query = `DELETE FROM users WHERE id = $1 RETURNING id, name;`;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.json({ message: "Perfil excluído com sucesso.", user: rows[0] });
  } catch (error) {
    console.error("ERRO AO EXCLUIR USUÁRIO:", error);
    return res.status(500).json({ error: "Erro ao excluir o perfil do banco." });
  }
});

export default router;