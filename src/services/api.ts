import type {
  CreateIncidentInput,
  CreatePointInput,
  CreateSupplyInput,
  Incident,
  IncidentStatus,
  Point,
  SupplyItem,
  SupplyPayload,
  User,
} from "../types";

const BASE_URL = "http://localhost:3333/api";

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((data as { error?: string }).error || "Ocorreu um erro na requisição.");
  }

  return data as T;
}

function getHeaders(): HeadersInit {
  let role = "user";

  try {
    const saved = localStorage.getItem("ppc-user");
    if (saved) {
      const parsed = JSON.parse(saved) as User;
      if (parsed.role) role = parsed.role;
    }
  } catch {
    // fallback when parsing fails
  }

  return {
    "Content-Type": "application/json",
    "x-user-role": role,
  };
}

export const api = {
  // --- AUTENTICAÇÃO ---
  async login(email: string, password: string): Promise<User> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    return handleResponse<User>(response);
  },

  async register(
    name: string,
    email: string,
    password: string,
    role: "admin" | "user" = "user"
  ): Promise<User> {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    return handleResponse<User>(response);
  },

  async getUsers(): Promise<User[]> {
    const response = await fetch(`${BASE_URL}/auth/users`);
    return handleResponse<User[]>(response);
  },

  async deleteUser(id: number) {
    const response = await fetch(`${BASE_URL}/auth/users/${id}`, {
      method: "DELETE",
    });
    return handleResponse<{ message: string }>(response);
  },

  // --- PONTOS ---
  async getPoints(): Promise<Point[]> {
    const response = await fetch(`${BASE_URL}/points`);
    return handleResponse<Point[]>(response);
  },

  async createPoint(pointData: CreatePointInput): Promise<Point> {
    const response = await fetch(`${BASE_URL}/points`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(pointData),
    });

    return handleResponse<Point>(response);
  },

  async deletePoint(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/points/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    await handleResponse<void>(response);
  },

  // --- ABASTECIMENTO ---
  async registerSupply(supplyData: SupplyPayload): Promise<void> {
    const response = await fetch(`${BASE_URL}/supplies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supplyData),
    });

    await handleResponse<void>(response);
  },

  async getSupplies(): Promise<SupplyItem[]> {
    const response = await fetch(`${BASE_URL}/supplies`);
    return handleResponse<SupplyItem[]>(response);
  },

  async createSupply(data: CreateSupplyInput): Promise<SupplyItem> {
    const response = await fetch(`${BASE_URL}/supplies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return handleResponse<SupplyItem>(response);
  },

  // --- OCORRÊNCIAS ---
  async getIncidents(): Promise<Incident[]> {
    const response = await fetch(`${BASE_URL}/incidents`);
    return handleResponse<Incident[]>(response);
  },

  async createIncident(data: CreateIncidentInput): Promise<Incident> {
    const response = await fetch(`${BASE_URL}/incidents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Incident>(response);
  },

  async updateIncidentStatus(id: number, status: IncidentStatus): Promise<Incident> {
    const response = await fetch(`${BASE_URL}/incidents/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Incident>(response);
  },

  async deleteIncident(id: number) {
    const response = await fetch(`${BASE_URL}/incidents/${id}`, {
      method: "DELETE",
    });
    return handleResponse<{ message: string }>(response);
  },
};