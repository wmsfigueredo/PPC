import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// LISTAR TODAS AS OCORRÊNCIAS (com filtro opcional por status via query params: ?status=Resolvida)
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    let query = "SELECT * FROM incidents";
    const values = [];

    if (status) {
      query += " WHERE status = $1";
      values.push(status);
    }

    query += " ORDER BY created_at DESC";

    const { rows } = await pool.query(query, values);
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar ocorrências" });
  }
});

// CRIAR UMA OCORRÊNCIA
router.post("/", async (req, res) => {
  try {
    const { point_id, title, point_name, icon, type } = req.body;

    if (!title) {
      return res.status(400).json({ error: "O título da ocorrência é obrigatório" });
    }

    const query = `
      INSERT INTO incidents (point_id, type, icon, title, point_name, status, badge_color)
      VALUES ($1, $2, $3, $4, $5, 'Em andamento', 'orange')
      RETURNING *;
    `;
    const values = [
      point_id || null,
      type || "damage",
      icon || "⚠",
      title,
      point_name || "Ponto Comunitário"
    ];

    const { rows } = await pool.query(query, values);
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao abrir ocorrência" });
  }
});

// RESOLVER / ATUALIZAR STATUS DA OCORRÊNCIA
router.patch("/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE incidents 
      SET status = 'Resolvida',
          badge_color = 'green'
      WHERE id = $1
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Ocorrência não encontrada" });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao resolver ocorrência" });
  }
});

export default router;