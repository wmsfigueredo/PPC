import type { Point, Incident, SupplyPayload, User } from '../types';

const BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:3333"}/api`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || "Falha ao conectar com o servidor");
  return body as T;
}

export const api = {
  async login(email: string, password: string): Promise<User> {
    return request<User>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  },
  async register(name: string, email: string, password: string): Promise<User> {
    return request<User>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
  },
  // --- PONTOS ---
  async getPoints(): Promise<Point[]> {
    return request<Point[]>("/points");
  },

  async createPoint(pointData: Omit<Point, "id">): Promise<Point> {
    return request<Point>("/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pointData),
    });
  },

  // --- ABASTECIMENTO ---
  async registerSupply(supplyData: SupplyPayload): Promise<void> {
    await request("/supplies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supplyData),
    });
  },

  // --- OCORRÊNCIAS ---
  async getIncidents(): Promise<Incident[]> {
    return request<Incident[]>("/incidents");
  },

  async createIncident(incidentData: Partial<Incident>): Promise<Incident> {
    return request<Incident>("/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incidentData),
    });
  }
};