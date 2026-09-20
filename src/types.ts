export type Page = 'mapa' | 'meus' | 'cadastro' | 'ocorrencias' | 'abastecimento' | 'perfil';
export type UserRole = 'admin' | 'user';
export type PointStatus = 'green' | 'orange' | 'red';

export interface User {
  id?: number;
  name: string;
  email: string;
  role?: UserRole;
}

export interface Point {
  id: number;
  name: string;
  address: string;
  neighborhood: string;
  status: PointStatus;
  status_text?: string;
  statusText?: string;
  responsible: string;
  last_supply?: string;
  lastSupply?: string;
  water: boolean;
  food: boolean;
  lat?: number;
  lng?: number;
  x?: number;
  y?: number;
  description: string;
  created_at?: string;
}

export type CreatePointInput = Pick<
  Point,
  'name' | 'address' | 'neighborhood' | 'description' | 'lat' | 'lng'
> & {
  responsible?: string;
};

// Compatibilidade de nomenclatura para componentes antigos
export type PetPoint = Point;

export interface Incident {
  id: number;
  point_id: number;
  user_id?: number;
  title: string;
  description: string;
  status: 'aberta' | 'em_analise' | 'resolvida';
  created_at: string;
  point_name?: string;
  user_name?: string;
}

export type CreateIncidentInput = Pick<Incident, 'point_id' | 'title' | 'description'> & {
  user_id?: number;
};

export type IncidentStatus = Incident['status'];

export interface SupplyItem {
  id: number;
  point_id: number;
  user_id?: number;
  supply_type: string;
  quantity?: string;
  created_at: string;
  point_name?: string;
  user_name?: string;
}

export interface CreateSupplyInput {
  point_id: number;
  user_id?: number;
  supply_type: string;
  quantity?: string;
}

export interface SupplyPayload {
  point_id: number;
  supplied_water: boolean;
  supplied_food: boolean;
  notes?: string;
  supplied_at?: string;
}

export const SUPPLY_TYPES = [
  'Ração e Água',
  'Apenas Ração',
  'Apenas Água',
  'Limpeza / Manutenção',
] as const;

export const SUPPLY_QUANTITIES = ['100%', '75%', '50%'] as const;

export type SupplyType = (typeof SUPPLY_TYPES)[number];
export type SupplyQuantity = (typeof SUPPLY_QUANTITIES)[number];