import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pointsRoutes from "./routes/points.routes.js";
import suppliesRoutes from "./routes/supplies.routes.js";
import incidentsRoutes from "./routes/incidents.routes.js"; // <- importe aqui
import authRoutes from "./routes/auth.routes.js";
import { ensureSchema } from "./db.js";



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

// Registro das rotas
app.use("/api/points", pointsRoutes);
app.use("/api/supplies", suppliesRoutes);
app.use("/api/incidents", incidentsRoutes); // <- registre aqui
app.use("/api/auth", authRoutes);
app.use("/api/supplies", suppliesRoutes);

ensureSchema()
  .then(() => app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`)))
  .catch((error) => {
    console.error("Não foi possível inicializar o banco de dados", error);
    process.exitCode = 1;
  });