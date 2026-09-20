import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// LISTAR HISTÓRICO DE ABASTECIMENTOS DE UM PONTO
router.get("/point/:pointId", async (req, res) => {
  try {
    const { pointId } = req.params;
    const { rows } = await pool.query(
      "SELECT * FROM supplies WHERE point_id = $1 ORDER BY supplied_at DESC",
      [pointId]
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar histórico de abastecimentos" });
  }
});

// REGISTRAR NOVO ABASTECIMENTO
router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const { point_id, supplied_water, supplied_food, notes, supplied_at } = req.body;

    if (!point_id) {
      return res.status(400).json({ error: "O ID do ponto é obrigatório" });
    }

    await client.query("BEGIN");

    // 1. Grava no histórico de abastecimento
    const insertSupplyQuery = `
      INSERT INTO supplies (point_id, supplied_water, supplied_food, notes, supplied_at)
      VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_TIMESTAMP))
      RETURNING *;
    `;
    const supplyValues = [point_id, !!supplied_water, !!supplied_food, notes || "", supplied_at || null];
    const supplyResult = await client.query(insertSupplyQuery, supplyValues);

    // 2. Atualiza os dados de status no ponto correspondente
    const updatePointQuery = `
      UPDATE points 
      SET water = CASE WHEN $1 = true THEN true ELSE water END,
          food = CASE WHEN $2 = true THEN true ELSE food END,
          status = 'green',
          status_text = 'Abastecido',
          last_supply = 'Agora mesmo'
      WHERE id = $3
      RETURNING *;
    `;
    await client.query(updatePointQuery, [!!supplied_water, !!supplied_food, point_id]);

    await client.query("COMMIT");
    return res.status(201).json(supplyResult.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return res.status(500).json({ error: "Erro ao registrar abastecimento" });
  } finally {
    client.release();
  }
});

// LISTAR todos os abastecimentos (com nome do ponto e do usuário)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.point_id,
        s.user_id,
        s.supply_type,
        s.quantity,
        s.created_at,
        p.name AS point_name,
        u.name AS user_name
      FROM supplies s
      LEFT JOIN pet_points p ON s.point_id = p.id
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);
    return res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar abastecimentos:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// REGISTRAR novo abastecimento
router.post("/", async (req, res) => {
  const { point_id, user_id, supply_type, quantity } = req.body;

  if (!point_id || !supply_type) {
    return res.status(400).json({ error: "Ponto e tipo de abastecimento são obrigatórios." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO supplies (point_id, user_id, supply_type, quantity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [point_id, user_id || null, supply_type, quantity || "100%"]
    );

    // Opcional: Atualizar a data do último abastecimento no ponto
    await pool.query(
      `UPDATE pet_points SET last_supplied_at = NOW() WHERE id = $1`,
      [point_id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao registrar abastecimento:", error);
    return res.status(500).json({ error: "Erro ao registrar abastecimento." });
  }
});

export default router;