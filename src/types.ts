export interface Point {
  id: number;
  name: string;
  address: string;
  neighborhood: string;
  status: 'green' | 'orange' | 'red';
  status_text: string;
  responsible: string;
  last_supply: string;
  water: boolean;
  food: boolean;
  x: number;
  y: number;
  description: string;
  created_at?: string;
}

export type PetPoint = Point;

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Incident {
  id: number;
  point_id: number | null;
  type: string;
  icon: string;
  title: string;
  point_name: string;
  status: 'Em andamento' | 'Resolvida';
  badge_color: string;
  created_at?: string;
}

export interface SupplyPayload {
  point_id: number;
  supplied_water: boolean;
  supplied_food: boolean;
  notes?: string;
  supplied_at?: string;
}