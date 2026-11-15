// src/routes/supplies.routes.js
import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// LISTAR ÚLTIMOS ABASTECIMENTOS (HISTÓRICO)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.point_id,
        s.user_id,
        s.supplied_water,
        s.supplied_food,
        s.notes,
        s.supplied_at,
        p.name AS point_name,
        u.name AS user_name
      FROM supplies s
      LEFT JOIN points p ON s.point_id = p.id
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.supplied_at DESC
      LIMIT 20
    `);
    return res.json(result.rows);
  } catch (error) {
    console.error("ERRO AO BUSCAR ABASTECIMENTOS:", error);
    return res.status(500).json({ error: "Erro ao buscar histórico de abastecimentos." });
  }
});

// REGISTRAR / ALTERAR ABASTECIMENTO E STATUS
router.post("/", async (req, res) => {
  const point_id = Number(req.body.point_id ?? req.body.pointId);
  const rawUserId = req.body.user_id ?? req.body.userId ?? req.get("x-user-id");
  const { item_type, target_status, notes } = req.body;

  if (!Number.isSafeInteger(point_id) || point_id <= 0) {
    return res.status(400).json({ error: "O ponto (point_id) é obrigatório." });
  }

  const user_id = rawUserId === undefined || rawUserId === null || rawUserId === ""
    ? null
    : Number(rawUserId);

  if (user_id !== null && (!Number.isSafeInteger(user_id) || user_id <= 0)) {
    return res.status(400).json({ error: "O identificador do utilizador é inválido." });
  }

  // 1. Determina se água e ração estão sendo atualizadas
  let supplied_water = false;
  let supplied_food = false;

  if (req.body.supplied_water !== undefined) {
    supplied_water = Boolean(req.body.supplied_water);
  } else if (item_type === "water" || item_type === "both") {
    supplied_water = true;
  }

  if (req.body.supplied_food !== undefined) {
    supplied_food = Boolean(req.body.supplied_food);
  } else if (item_type === "food" || item_type === "both") {
    supplied_food = true;
  }

  // Fallback para payloads com quantity ou supply_type legados
  if (!supplied_water && !supplied_food && req.body.quantity !== undefined) {
    supplied_water = req.body.supply_type === "water" || String(req.body.quantity) !== "0";
    supplied_food = req.body.supply_type === "food" || String(req.body.quantity) !== "0";
  }

  // 2. Determina e valida os status independentes
  const water_status = req.body.water_status || target_status || "cheio";
  const food_status = req.body.food_status || target_status || "cheio";

  if (supplied_water && !["cheio", "vazio"].includes(water_status)) {
    return res.status(400).json({ error: "Status da água inválido." });
  }
  if (supplied_food && !["cheio", "vazio"].includes(food_status)) {
    return res.status(400).json({ error: "Status da ração inválido." });
  }

  let client;
  let transactionStarted = false;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const pointResult = await client.query(
      "SELECT name FROM points WHERE id = $1",
      [point_id]
    );
    if (pointResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(404).json({ error: "Ponto não encontrado." });
    }

    const pointName = pointResult.rows[0].name || `Ponto #${point_id}`;
    const supplyResult = await client.query(
      `INSERT INTO supplies (point_id, user_id, supplied_water, supplied_food, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        point_id,
        user_id,
        supplied_water,
        supplied_food,
        notes || null
      ]
    );

    await client.query(
      `INSERT INTO notifications (point_id, message, type)
       VALUES ($1, $2, 'success')`,
      [point_id, `Abastecimento registrado no ponto ${pointName}.`]
    );

    const updateFields = [];
    const values = [point_id];

    if (supplied_water) {
      updateFields.push(`water_status = $${values.length + 1}`);
      values.push(water_status);
    }
    if (supplied_food) {
      updateFields.push(`food_status = $${values.length + 1}`);
      values.push(food_status);
    }

    if (updateFields.length > 0) {
      updateFields.push("last_supplied_at = NOW()");

      await client.query(
        `UPDATE points SET ${updateFields.join(", ")} WHERE id = $1`,
        values
      );

      if (supplied_water && water_status === "vazio") {
        await client.query(
          `INSERT INTO notifications (point_id, message, type)
           VALUES ($1, $2, 'warning')`,
          [point_id, `O ponto ${pointName} está com falta de água.`]
        );
      }

      if (supplied_food && food_status === "vazio") {
        await client.query(
          `INSERT INTO notifications (point_id, message, type)
           VALUES ($1, $2, 'warning')`,
          [point_id, `O ponto ${pointName} está com falta de ração.`]
        );
      }
    }

    await client.query("COMMIT");
    transactionStarted = false;
    return res.status(201).json(supplyResult.rows[0]);
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("ERRO AO REVERTER ABASTECIMENTO:", rollbackError);
      }
    }
    console.error("ERRO AO REGISTRAR ABASTECIMENTO:", error);
    return res.status(500).json({ error: "Erro interno ao registrar abastecimento." });
  } finally {
    client?.release();
  }
});

export default router;