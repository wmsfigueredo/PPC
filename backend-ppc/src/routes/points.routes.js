import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// LISTAR TODOS OS PONTOS
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM points ORDER BY id ASC"
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar pontos" });
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

// CRIAR UM PONTO ADM

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

// EXCLUIR UM PONTO (Apenas Admin)
router.delete("/:id", async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'admin') {
      return res.status(403).json({ error: "Apenas administradores podem remover pontos." });
    }

    const { id } = req.params;
    await pool.query("DELETE FROM points WHERE id = $1", [id]);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao excluir ponto" });
  }
});

// ATUALIZAR UM PONTO
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, neighborhood, description, responsible } = req.body;

    const query = `
      UPDATE points
      SET name = COALESCE($1, name),
          address = COALESCE($2, address),
          neighborhood = COALESCE($3, neighborhood),
          description = COALESCE($4, description),
          responsible = COALESCE($5, responsible)
      WHERE id = $6
      RETURNING *;
    `;
    const values = [name, address, neighborhood, description, responsible, id];

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Ponto não encontrado." });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao atualizar ponto." });
  }
});
// ATUALIZAR UM PONTO
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, neighborhood, status, status_text, water, food, responsible, description } = req.body;

    const query = `
      UPDATE points 
      SET name = COALESCE($1, name),
          address = COALESCE($2, address),
          neighborhood = COALESCE($3, neighborhood),
          status = COALESCE($4, status),
          status_text = COALESCE($5, status_text),
          water = COALESCE($6, water),
          food = COALESCE($7, food),
          responsible = COALESCE($8, responsible),
          description = COALESCE($9, description)
      WHERE id = $10
      RETURNING *;
    `;
    const values = [name, address, neighborhood, status, status_text, water, food, responsible, description, id];

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Ponto não encontrado" });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao atualizar ponto" });
  }
});

// DELETAR PONTO
router.delete("/:id", async (req, res) => {
  try {
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