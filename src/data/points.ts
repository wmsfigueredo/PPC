import type { PetPoint } from '../types'

export const initialPoints: PetPoint[] = [
  { id: 1, name: 'Ponto Esperança', address: 'Rua das Flores, 123', neighborhood: 'Vila Nova - Franca/SP', status: 'green', statusText: 'Abastecido', responsible: 'Ana Paula', lastSupply: 'Hoje, 08:30', water: true, food: true, x: 58, y: 45, description: 'Comedouro e bebedouro instalados na calçada, em área de fácil acesso para os animais.' },
  { id: 2, name: 'Ponto Amizade', address: 'Av. Brasil, 456', neighborhood: 'Centro - Franca/SP', status: 'orange', statusText: 'Em atenção', responsible: 'João Carlos', lastSupply: 'Ontem, 18:45', water: true, food: false, x: 72, y: 51, description: 'Ponto comunitário próximo à praça do bairro.' },
  { id: 3, name: 'Ponto Bom-Estar', address: 'Rua das Palmeiras, 789', neighborhood: 'Estação - Franca/SP', status: 'green', statusText: 'Abastecido', responsible: 'Marcos', lastSupply: '24/05/2025, 09:15', water: true, food: true, x: 48, y: 66, description: 'Ponto acompanhado pela comunidade local.' },
  { id: 4, name: 'Ponto União', address: 'Rua Central, 88', neighborhood: 'Jardim Brasil', status: 'red', statusText: 'Vazio', responsible: 'Sem responsável', lastSupply: 'Há 2 dias', water: false, food: false, x: 34, y: 37, description: 'Necessita reposição de água e ração.' },
  { id: 5, name: 'Ponto Amigo', address: 'Rua das Acácias, 51', neighborhood: 'São José', status: 'green', statusText: 'Abastecido', responsible: 'Carla', lastSupply: 'Hoje, 07:10', water: true, food: true, x: 77, y: 69, description: 'Ponto em área residencial.' },
]
