import type {
  CreateIncidentInput,
  CreatePointInput,
  Incident,
  IncidentStatus,
  AppNotification,
  Point,
  SupplyHistoryItem,
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

function getStoredUser(): Partial<User> | null {
  try {
    const saved = localStorage.getItem("ppc-user");
    if (!saved) return null;

    const parsed: unknown = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? (parsed as Partial<User>) : null;
  } catch {
    return null;
  }
}

function isValidUserId(userId: unknown): userId is number {
  return typeof userId === "number" && Number.isSafeInteger(userId) && userId > 0;
}

function getHeaders(): HeadersInit {
  const user = getStoredUser();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-user-role": user?.role || "user",
  };

  if (isValidUserId(user?.id)) {
    headers["x-user-id"] = String(user.id);
  }

  return headers;
}

export interface SupplyData {
  point_id: number;
  user_id?: number;
  supplied_water: boolean;
  supplied_food: boolean;
  water_status?: "cheio" | "vazio";
  food_status?: "cheio" | "vazio";
  notes?: string;
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
  async registerSupply(data: SupplyData) {
    const userId = getStoredUser()?.id;
    const payload = {
      ...data,
      ...(isValidUserId(userId) ? { user_id: userId } : {}),
    };

    const response = await fetch(`${BASE_URL}/supplies`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(response);
  },

  async getSupplies(): Promise<SupplyHistoryItem[]> {
    const response = await fetch(`${BASE_URL}/supplies`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<SupplyHistoryItem[]>(response);
  },

  async getNotifications(): Promise<AppNotification[]> {
    const response = await fetch(`${BASE_URL}/notifications`, {
      headers: getHeaders(),
    });
    return handleResponse<AppNotification[]>(response);
  },

  async markNotificationRead(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/notifications/${id}/read`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    await handleResponse<{ id: number; is_read: boolean }>(response);
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