import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /api/incidents - Listar todas as ocorrências
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT 
        i.id,
        i.point_id,
        i.user_id,
        i.title,
        i.description,
        i.status,
        i.created_at,
        p.name AS point_name,
        u.name AS user_name
      FROM incidents i
      LEFT JOIN points p ON i.point_id = p.id
      LEFT JOIN users u ON i.user_id = u.id
      ORDER BY i.id DESC;
    `;
    const { rows } = await pool.query(query);
    return res.json(rows);
  } catch (error) {
    console.error("ERRO AO BUSCAR OCORRÊNCIAS:", error);
    return res.status(500).json({ error: "Erro ao carregar lista de ocorrências." });
  }
});

// POST /api/incidents - Criar uma nova ocorrência
router.post("/", async (req, res) => {
  try {
    const { point_id, user_id, title, description } = req.body;

    if (!point_id || !title || !description) {
      return res.status(400).json({ error: "Informe o ponto, título e descrição da ocorrência." });
    }

    const query = `
      INSERT INTO incidents (point_id, user_id, title, description, status)
      VALUES ($1, $2, $3, $4, 'aberta')
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [point_id, user_id || null, title, description]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("ERRO AO REGISTRAR OCORRÊNCIA:", error);
    return res.status(500).json({ error: "Erro interno ao registrar ocorrência." });
  }
});

// PATCH /api/incidents/:id/status - Atualizar o status (ex: de 'aberta' para 'resolvida')
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'aberta', 'em_analise', 'resolvida'

    if (!status) {
      return res.status(400).json({ error: "Status não informado." });
    }

    const query = `
      UPDATE incidents
      SET status = $1
      WHERE id = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [status, id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Ocorrência não encontrada." });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error("ERRO AO ATUALIZAR STATUS DA OCORRÊNCIA:", error);
    return res.status(500).json({ error: "Erro ao atualizar ocorrência." });
  }
});

// DELETE /api/incidents/:id - Excluir ocorrência
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `DELETE FROM incidents WHERE id = $1 RETURNING id;`;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Ocorrência não encontrada." });
    }

    return res.json({ message: "Ocorrência excluída com sucesso." });
  } catch (error) {
    console.error("ERRO AO DELETAR OCORRÊNCIA:", error);
    return res.status(500).json({ error: "Erro ao excluir ocorrência." });
  }
});

export default router;