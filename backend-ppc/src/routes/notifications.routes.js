import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        n.id,
        n.point_id,
        n.message,
        n.type,
        n.is_read,
        n.created_at,
        p.name AS point_name
      FROM notifications n
      LEFT JOIN points p ON p.id = n.point_id
      ORDER BY n.created_at DESC
      LIMIT 50
    `);

    return res.json(rows);
  } catch (error) {
    console.error("ERRO AO BUSCAR NOTIFICAÇÕES:", error);
    return res.status(500).json({ error: "Erro ao buscar notificações." });
  }
});

router.patch("/:id/read", async (req, res) => {
  const notificationId = Number(req.params.id);
  if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
    return res.status(400).json({ error: "Identificador de notificação inválido." });
  }

  try {
    const { rows } = await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING id, is_read",
      [notificationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Notificação não encontrada." });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error("ERRO AO MARCAR NOTIFICAÇÃO COMO LIDA:", error);
    return res.status(500).json({ error: "Erro ao atualizar notificação." });
  }
});

export default router;
