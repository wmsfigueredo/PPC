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

// CRIAR UM PONTO (Corresponde à tela "Cadastro de Ponto")
router.post("/", async (req, res) => {
  try {
    const { name, address, neighborhood, x, y, description, responsible } = req.body;

    if (!name || !address || !neighborhood || x === undefined || y === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    const query = `
      INSERT INTO points (name, address, neighborhood, x, y, description, responsible)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [name, address, neighborhood, x, y, description || "", responsible || "Sem responsável"];

    const { rows } = await pool.query(query, values);
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao cadastrar ponto" });
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