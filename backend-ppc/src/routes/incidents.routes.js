import { Router } from "express";
import { pool } from "../db.js"; // Confirme se o caminho do seu banco está correto

const router = Router();

// LISTAR OCORRÊNCIAS
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.id,
        i.point_id,
        i.user_id,
        i.title,
        COALESCE(i.type, 'Geral') AS type,
        i.icon,
        i.point_name,
        COALESCE(i.status, 'aberta') AS status,
        i.badge_color,
        i.created_at,
        u.name AS user_name
      FROM incidents i
      LEFT JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC
    `);

    // Mapeamos para que a propriedade 'description' não quebre o frontend
    const formatted = result.rows.map(item => ({
      ...item,
      description: item.type || item.title // Fallback para não quebrar a tela
    }));

    return res.json(formatted);
  } catch (error) {
    console.error("DETALHE DO ERRO NO GET /incidents:", error);
    return res.status(500).json({ error: "Erro ao buscar ocorrências no banco." });
  }
});

// REGISTRAR OCORRÊNCIA
router.post("/", async (req, res) => {
  const { point_id, user_id, title, description, point_name } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO incidents (point_id, user_id, title, type, point_name, status)
       VALUES ($1, $2, $3, $4, $5, 'aberta')
       RETURNING *`,
      [
        point_id,
        user_id || null,
        title,
        description || "Geral", // Grava no campo 'type' do banco caso description seja enviado
        point_name || null
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("DETALHE DO ERRO NO POST /incidents:", error);
    return res.status(500).json({ error: "Erro ao gravar ocorrência no banco." });
  }
});

// EXCLUIR OCORRÊNCIA
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM incidents WHERE id = $1", [id]);
    return res.status(204).send();
  } catch (error) {
    console.error("DETALHE DO ERRO NO DELETE /incidents:", error);
    return res.status(500).json({ error: "Erro ao excluir ocorrência." });
  }
});

// ATUALIZAR STATUS
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query("UPDATE incidents SET status = $1 WHERE id = $2", [status, id]);
    return res.status(200).json({ message: "Status atualizado com sucesso" });
  } catch (error) {
    console.error("DETALHE DO ERRO NO PATCH /incidents:", error);
    return res.status(500).json({ error: "Erro ao atualizar status." });
  }
});

export default router;