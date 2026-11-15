// backend-ppc/src/routes/points.routes.js
import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// LISTAR TODOS OS PONTOS (Com cálculo dinâmico de 12h / 24h)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM points ORDER BY id DESC");
    const updatedPoints = [];

    for (const point of result.rows) {
      const binaryStatusPoint = {
        ...point,
        water_status:
          point.water_status === "vazio" ||
          (point.water_status == null && point.water === false)
            ? "vazio"
            : "cheio",
        food_status:
          point.food_status === "vazio" ||
          (point.food_status == null && point.food === false)
            ? "vazio"
            : "cheio",
      };
      const expiryReference = point.last_supplied_at || point.created_at;
      if (!expiryReference) {
        updatedPoints.push({ ...point, food_status: "vazio", water_status: "vazio" });
        continue;
      }

      const expiryDate = new Date(expiryReference);
      if (Number.isNaN(expiryDate.getTime())) {
        updatedPoints.push(binaryStatusPoint);
        continue;
      }

      const hoursPassed = (Date.now() - expiryDate.getTime()) / (1000 * 60 * 60);

      if (hoursPassed >= 24) {
        const pointName = point.name || `Ponto #${point.id}`;
        const expiringSupplies = [
          {
            key: "water",
            label: "água",
            alreadyEmpty: point.water_status === "vazio" ||
              (point.water_status == null && point.water === false),
          },
          {
            key: "food",
            label: "ração",
            alreadyEmpty: point.food_status === "vazio" ||
              (point.food_status == null && point.food === false),
          },
        ];

        for (const supply of expiringSupplies) {
          if (supply.alreadyEmpty) continue;

          await pool.query(
            `INSERT INTO notifications (point_id, message, type, dedupe_key)
             VALUES ($1, $2, 'warning', $3)
             ON CONFLICT DO NOTHING`,
            [
              point.id,
              `O ponto ${pointName} está há mais de 24 horas sem reposição de ${supply.label}.`,
              `expiry:${point.id}:${supply.key}:${expiryDate.toISOString()}`,
            ]
          );
        }

        updatedPoints.push({ ...point, food_status: "vazio", water_status: "vazio" });
      } else {
        updatedPoints.push(binaryStatusPoint);
      }
    }

    return res.json(updatedPoints);
  } catch (error) {
    console.error("Erro ao listar pontos:", error);
    return res.status(500).json({ error: "Erro ao listar pontos." });
  }
});

// BUSCAR UM PONTO POR ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM points WHERE id = $1", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Ponto não encontrado" });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar ponto" });
  }
});

// CRIAR UM PONTO (Apenas Admin)
router.post("/", async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'admin') {
      return res.status(403).json({ error: "Apenas administradores podem cadastrar novos pontos." });
    }

    const { name, address, neighborhood, lat, lng, description, responsible } = req.body;

    if (!name || !address || !neighborhood || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios faltando (nome, endereço, bairro, lat, lng)." });
    }

    const query = `
      INSERT INTO points (name, address, neighborhood, lat, lng, description, responsible, status, status_text, water, food, x, y)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'green', 'Abastecido', true, true, 0, 0)
      RETURNING *;
    `;
    const values = [
      name,
      address,
      neighborhood,
      lat,
      lng,
      description || "",
      responsible || "Sem responsável"
    ];

    const { rows } = await pool.query(query, values);
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao cadastrar ponto" });
  }
});

// ATUALIZAR UM PONTO
router.put("/:id", async (req, res) => {
  const pointId = Number(req.params.id);
  if (!Number.isSafeInteger(pointId) || pointId <= 0) {
    return res.status(400).json({ error: "Identificador de ponto inválido." });
  }

  const {
    name,
    address,
    neighborhood,
    status,
    status_text,
    water,
    food,
    water_status,
    food_status,
    responsible,
    description,
  } = req.body;

  for (const supplyStatus of [water_status, food_status]) {
    if (supplyStatus !== undefined && !["cheio", "vazio"].includes(supplyStatus)) {
      return res.status(400).json({ error: "Status de insumo inválido." });
    }
  }

  let client;
  let transactionStarted = false;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const previousResult = await client.query(
      `SELECT id, name, status, status_text, water, food, water_status, food_status
       FROM points WHERE id = $1`,
      [pointId]
    );
    if (previousResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(404).json({ error: "Ponto não encontrado" });
    }

    const previous = previousResult.rows[0];
    const updateResult = await client.query(
      `UPDATE points
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           neighborhood = COALESCE($3, neighborhood),
           status = COALESCE($4, status),
           status_text = COALESCE($5, status_text),
           water = COALESCE($6, water),
           food = COALESCE($7, food),
           responsible = COALESCE($8, responsible),
           description = COALESCE($9, description),
           water_status = COALESCE(
             $10,
             CASE WHEN $6 IS NULL THEN water_status WHEN $6 THEN 'cheio' ELSE 'vazio' END
           ),
           food_status = COALESCE(
             $11,
             CASE WHEN $7 IS NULL THEN food_status WHEN $7 THEN 'cheio' ELSE 'vazio' END
           )
       WHERE id = $12
       RETURNING *`,
      [
        name,
        address,
        neighborhood,
        status,
        status_text,
        water,
        food,
        responsible,
        description,
        water_status,
        food_status,
        pointId,
      ]
    );
    const updated = updateResult.rows[0];
    const hasOperationalChange = [
      ["status", status],
      ["status_text", status_text],
      ["water", water],
      ["food", food],
      ["water_status", water_status],
      ["food_status", food_status],
    ].some(([field, value]) => value !== undefined && value !== previous[field]);

    if (hasOperationalChange) {
      await client.query(
        `INSERT INTO notifications (point_id, message, type)
         VALUES ($1, $2, 'success')`,
        [pointId, `O status do ponto ${updated.name} foi atualizado.`]
      );
    }

    const previousWaterEmpty =
      previous.water_status === "vazio" ||
      (previous.water_status == null && previous.water === false);
    const previousFoodEmpty =
      previous.food_status === "vazio" ||
      (previous.food_status == null && previous.food === false);
    const waterBecameEmpty =
      water_status === "vazio" || (water_status === undefined && water === false);
    const foodBecameEmpty =
      food_status === "vazio" || (food_status === undefined && food === false);

    if (waterBecameEmpty && !previousWaterEmpty) {
      await client.query(
        `INSERT INTO notifications (point_id, message, type)
         VALUES ($1, $2, 'warning')`,
        [pointId, `O ponto ${updated.name} está com falta de água.`]
      );
    }
    if (foodBecameEmpty && !previousFoodEmpty) {
      await client.query(
        `INSERT INTO notifications (point_id, message, type)
         VALUES ($1, $2, 'warning')`,
        [pointId, `O ponto ${updated.name} está com falta de ração.`]
      );
    }

    const statusTextIsEmpty =
      typeof status_text === "string" && status_text.trim().toLowerCase() === "vazio";
    const previousStatusTextIsEmpty =
      typeof previous.status_text === "string" &&
      previous.status_text.trim().toLowerCase() === "vazio";
    const overallStatusBecameEmpty =
      (status === "red" || statusTextIsEmpty) &&
      previous.status !== "red" &&
      !previousStatusTextIsEmpty;
    if (overallStatusBecameEmpty) {
      await client.query(
        `INSERT INTO notifications (point_id, message, type)
         VALUES ($1, $2, 'warning')`,
        [pointId, `O ponto ${updated.name} está com status vazio.`]
      );
    }

    await client.query("COMMIT");
    transactionStarted = false;
    return res.json(updated);
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("ERRO AO REVERTER ATUALIZAÇÃO DO PONTO:", rollbackError);
      }
    }
    console.error(error);
    return res.status(500).json({ error: "Erro ao atualizar ponto" });
  } finally {
    client?.release();
  }
});

// EXCLUIR UM PONTO (Apenas Admin)
router.delete("/:id", async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'admin') {
      return res.status(403).json({ error: "Apenas administradores podem remover pontos." });
    }

    const { id } = req.params;
    const { rowCount } = await pool.query("DELETE FROM points WHERE id = $1", [id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: "Ponto não encontrado" });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao excluir ponto" });
  }
});

export default router;