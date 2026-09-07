import type { Point, Incident, SupplyPayload, User } from "../types";
const BASE_URL = "http://localhost:3333/api";

const getHeaders = () => {
  let role = "user";
  try {
    const saved = localStorage.getItem("ppc-user");
    if (saved) {
      const parsed = JSON.parse(saved) as User;
      if (parsed.role) role = parsed.role;
    }
  } catch {
    // fallback se falhar parse
  }

  return {
    "Content-Type": "application/json",
    "x-user-role": role,
  };
};

export const api = {
  // --- AUTENTICAÇÃO ---
  async login(email: string, password: string): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Falha ao realizar login");
    }
    return res.json();
  },

  async register(name: string, email: string, password: string, role: "admin" | "user" = "user"): Promise<User> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Falha ao realizar cadastro");
  }
  return res.json();
},
  // --- PONTOS ---
  async getPoints(): Promise<Point[]> {
    const res = await fetch(`${BASE_URL}/points`);
    if (!res.ok) throw new Error("Falha ao buscar pontos");
    return res.json();
  },

  async createPoint(pointData: Omit<Point, "id">): Promise<Point> {
    const res = await fetch(`${BASE_URL}/points`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(pointData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Falha ao criar ponto");
    }
    return res.json();
  },

  async deletePoint(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/points/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Falha ao excluir ponto");
    }
  },

  // --- ABASTECIMENTO ---
  async registerSupply(supplyData: SupplyPayload): Promise<void> {
    const res = await fetch(`${BASE_URL}/supplies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supplyData),
    });
    if (!res.ok) throw new Error("Falha ao registrar abastecimento");
  },

  // --- OCORRÊNCIAS ---
  async getIncidents(): Promise<Incident[]> {
    const res = await fetch(`${BASE_URL}/incidents`);
    if (!res.ok) throw new Error("Falha ao buscar ocorrências");
    return res.json();
  },

  async createIncident(incidentData: Partial<Incident>): Promise<Incident> {
    const res = await fetch(`${BASE_URL}/incidents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incidentData),
    });
    if (!res.ok) throw new Error("Falha ao registrar ocorrência");
    return res.json();
  },
};