import { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  SUPPLY_QUANTITIES,
  SUPPLY_TYPES,
  type Point,
  type SupplyItem,
  type SupplyQuantity,
  type SupplyType,
} from "../types";

interface SuppliesPageProps {
  user: { id: number; name: string } | null;
  points: Point[];
  notify?: (msg: string) => void;
}

const getInitialPointId = (points: Point[]) => points[0]?.id ?? 0;

const formatDate = (value: string) => new Date(value).toLocaleString("pt-BR");

export function SuppliesPage({ user, points = [], notify }: SuppliesPageProps) {
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPointId, setSelectedPointId] = useState<number>(() => getInitialPointId(points));
  const [supplyType, setSupplyType] = useState<SupplyType>(SUPPLY_TYPES[0]);
  const [quantity, setQuantity] = useState<SupplyQuantity>(SUPPLY_QUANTITIES[0]);

  useEffect(() => {
    setSelectedPointId((current) => {
      if (current && points.some((point) => point.id === current)) {
        return current;
      }

      return getInitialPointId(points);
    });
  }, [points]);

  const fetchSupplies = async () => {
    setLoading(true);

    try {
      const data = await api.getSupplies();
      setSupplies(data);
    } catch (error) {
      console.error("Erro ao carregar abastecimentos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSupplies();
  }, []);

  const handleCreateSupply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPointId) {
      notify?.("Selecione um ponto válido.");
      return;
    }

    setSubmitting(true);

    try {
      await api.createSupply({
        point_id: Number(selectedPointId),
        user_id: user?.id,
        supply_type: supplyType,
        quantity,
      });

      notify?.("Abastecimento registrado com sucesso! 🐾");
      await fetchSupplies();
    } catch {
      notify?.("Erro ao registrar abastecimento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        maxWidth: 900,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div className="card" style={{ padding: 24 }}>
        <h3>🥣 Registrar Abastecimento</h3>

        <form
          onSubmit={handleCreateSupply}
          style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}
        >
          <div className="field">
            <label>Ponto Pet</label>
            <select
              value={selectedPointId}
              onChange={(event) => setSelectedPointId(Number(event.target.value))}
            >
              {points.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.name} - {point.neighborhood}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Item Abastecido</label>
            <select
              value={supplyType}
              onChange={(event) => setSupplyType(event.target.value as SupplyType)}
            >
              {SUPPLY_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Nível do Recipiente</label>
            <select
              value={quantity}
              onChange={(event) => setQuantity(event.target.value as SupplyQuantity)}
            >
              {SUPPLY_QUANTITIES.map((option) => (
                <option key={option} value={option}>
                  {option} {option === "100%" ? "(Cheio)" : option === "75%" ? "75%" : "50% (Metade)"}
                </option>
              ))}
            </select>
          </div>

          <button
            className="primary"
            type="submit"
            disabled={submitting || points.length === 0}
            style={{ marginTop: 8 }}
          >
            {submitting ? "Gravando..." : "Confirmar Abastecimento"}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h3>📜 Histórico Recente de Abastecimentos</h3>

        {loading ? (
          <p className="muted">Carregando histórico...</p>
        ) : supplies.length === 0 ? (
          <p className="muted">Nenhum abastecimento registrado ainda.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
            {supplies.map((item) => (
              <div
                key={item.id}
                style={{ border: "1px solid #e2e8f0", padding: 12, borderRadius: 8 }}
              >
                <strong>📍 {item.point_name || `Ponto #${item.point_id}`}</strong> — {item.supply_type} ({item.quantity})
                <br />
                <small className="muted">
                  Por: {item.user_name || "Voluntário"} em {formatDate(item.created_at)}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}