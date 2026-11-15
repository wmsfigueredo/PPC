
import { useEffect, useState } from 'react'
import type {
  CreatePointInput,
  Incident,
  IncidentStatus,
  Page,
  PetPoint,
  SupplyHistoryItem,
  User,
} from '../types'
import InteractiveMap from '../components/InteractiveMap'
import { api } from '../services/api'

type PageProps = {
  points: PetPoint[]
  currentPoint?: PetPoint | null
  onSelectPoint: (point: PetPoint) => void
  onNavigate: (page: Extract<Page, 'mapa' | 'cadastro' | 'abastecimento' | 'ocorrencias'>) => void
  notify: (message: string) => void
}

const Badge = ({ point }: { point: PetPoint }) => (
  <span className={`badge ${point.status}`}>
    <span className="badge-status-dot" aria-hidden="true" />
    {point.statusText}
  </span>
)

const Title = ({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle: string
  action?: React.ReactNode
}) => (
  <div className="page-title">
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
    {action}
  </div>
)

// --- MAPA ---
export function MapPage({
  points,
  currentPoint,
  onSelectPoint,
  onNavigate,
  notify,
  onDeletePoint,
  user,
}: PageProps & {
  onDeletePoint?: (id: number) => void
  user?: User | null
}) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPoints = points.filter((point) => {
    const term = searchTerm.toLowerCase()
    return [point.name, point.neighborhood, point.address]
      .some((value) => value.toLowerCase().includes(term))
  })

  return (
    <>
      <Title
        title="Mapa"
        subtitle="Encontre pontos comunitários de alimentação perto de você."
        action={
          user?.role === 'admin' && (
            <button className="primary" onClick={() => onNavigate('cadastro')}>
              Novo ponto
            </button>
          )
        }
      />

      <div className="map-layout">
        <section className="card map-card">
          <div className="map-toolbar">
            <input
              className="search-input"
              placeholder="Buscar endereço ou bairro"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <button
              className="secondary"
              onClick={() =>
                notify('Filtros: status, distância e tipo de abastecimento.')
              }
            >
              Filtros
            </button>
          </div>

          <div className="map" style={{ height: '480px', position: 'relative' }}>
            <InteractiveMap
              points={filteredPoints}
              currentPoint={currentPoint}
              onSelectPoint={onSelectPoint}
            />

            <div className="map-legend">
              <span><span className="map-legend-dot is-full" />Abastecido</span>
              <span><span className="map-legend-dot is-warning" />Em atenção</span>
              <span><span className="map-legend-dot is-empty" />Vazio</span>
            </div>
          </div>
        </section>

        <PointPanel
          point={currentPoint}
          onSupply={() => onNavigate('abastecimento')}
          onReportOccurrence={() => onNavigate('ocorrencias')}
          notify={notify}
          onDelete={user?.role === 'admin' ? onDeletePoint : undefined}
        />
      </div>
    </>
  )
}

// --- PAINEL DO PONTO ---
function PointPanel({
  point,
  onSupply,
  onReportOccurrence,
  notify,
  onDelete,
}: {
  point?: PetPoint | null
  onSupply: () => void
  onReportOccurrence: () => void
  notify: (message: string) => void
  onDelete?: (id: number) => void
}) {
  if (!point?.name) {
    return (
      <aside className="card point-panel">
        <div className="point-photo point-photo-placeholder">PPC</div>
        <h2>Nenhum ponto selecionado</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Selecione um ponto no mapa ou cadastre um novo para visualizar os detalhes.
        </p>
      </aside>
    )
  }

  const lastSupply = point.lastSupply || point.last_supply || 'Não informado'

  return (
    <aside className="card point-panel">
      <div className="point-photo point-photo-placeholder">Ponto comunitário</div>

      <div className="row">
        <h2>{point.name}</h2>
        <Badge point={point} />
      </div>

      <p className="muted">
        Endereço: {point.address}
        <br />
        {point.neighborhood}
      </p>

      <div className="divider" />

      <div className="muted">Responsável</div>
      <strong>{point.responsible || 'Comunidade'}</strong>

      <p className="muted supply-info">
        Último abastecimento
        <br />
        <strong>{lastSupply}</strong>
      </p>

      <div className="mini-grid">
        <Mini status={point.water_status} label="Água" />
        <Mini status={point.food_status} label="Ração" />
      </div>

      <button className="primary full" onClick={onSupply}>
        Registrar abastecimento
      </button>

      <button
        className="secondary full"
        onClick={() => notify(point.description || 'Sem descrição cadastrada.')}
      >
        Ver detalhes
      </button>

      <button
        className="secondary full"
        onClick={onReportOccurrence}
      >
        Reportar ocorrência
      </button>

      {onDelete && (
        <button
          className="secondary full"
          style={{
            color: 'var(--red, #ef4444)',
            borderColor: 'var(--red, #ef4444)',
            marginTop: 4,
          }}
          onClick={() => onDelete(point.id)}
        >
          Excluir ponto
        </button>
      )}
    </aside>
  )
}

const Mini = ({
  status,
  label,
}: {
  status: PetPoint['water_status']
  label: string
}) => {
  const statusLabel =
    status === 'cheio' ? 'Cheio' : status === 'vazio' ? 'Vazio' : 'Não informado'
  const statusClass =
    status === 'cheio' ? 'is-full' : status === 'vazio' ? 'is-empty' : 'is-unknown'

  return (
    <div className="mini mini-status">
      <span className="mini-status-label">{label}</span>
      <strong className="mini-status-value">
        <span className={`mini-status-dot ${statusClass}`} aria-hidden="true" />
        {statusLabel}
      </strong>
    </div>
  )
}

// --- MEUS PONTOS ---
export function ListPage({
  points,
  onNavigate,
}: Pick<PageProps, 'points' | 'onNavigate'>) {
  return (
    <>
      <Title
        title="Meus pontos"
        subtitle="Pontos pelos quais você é responsável ou que acompanha."
        action={
          <button className="primary" onClick={() => onNavigate('cadastro')}>
            Cadastrar ponto
          </button>
        }
      />

      <section className="card">
        <div className="tabs">
          <button className="tab active">Sou responsável</button>
          <button className="tab">Acompanhando</button>
        </div>

        <div className="list">
          {points.slice(0, 3).map((point) => (
            <div className="list-item" key={point.id}>
              <div className="thumb" aria-hidden="true">P</div>

              <div className="grow">
                <h3>
                  {point.name} <Badge point={point} />
                </h3>

                <p>
                  {point.address}
                  <br />
                  {point.neighborhood}
                </p>

                <p>Último abastecimento: {point.lastSupply}</p>
              </div>

              <span>›</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

interface Point {
  id: number;
  name: string;
}

interface Props {
  point: Point;
  notify?: (msg: string) => void;
  onCancel?: () => void;
  onConfirm?: (data: {
    point_id: number;
    supplied_water: boolean;
    supplied_food: boolean;
    water_status?: "cheio" | "vazio";
    food_status?: "cheio" | "vazio";
    notes: string;
  }) => Promise<void>;
}

const formatSupplyDate = (value: string | null) => {
  if (!value) return 'Data não disponível'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data não disponível'

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const formattedTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

  return `${formattedDate} às ${formattedTime}`
}

export const SupplyPage: React.FC<Props> = ({ point, notify, onCancel, onConfirm }) => {
  // Armazena o status selecionado de cada insumo (null = não alterado/não selecionado)
  const [waterStatus, setWaterStatus] = useState<"cheio" | "vazio" | null>(null);
  const [foodStatus, setFoodStatus] = useState<"cheio" | "vazio" | null>(null);

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [supplies, setSupplies] = useState<SupplyHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true

    const loadSupplies = async () => {
      setLoadingHistory(true)
      setHistoryError(null)

      try {
        const history = await api.getSupplies()
        if (isMounted) setSupplies(history)
      } catch (error) {
        if (isMounted) {
          setHistoryError(
            error instanceof Error ? error.message : 'Não foi possível carregar o histórico.'
          )
        }
      } finally {
        if (isMounted) setLoadingHistory(false)
      }
    }

    void loadSupplies()
    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação: garante que ao menos um insumo teve o status selecionado
    if (!waterStatus && !foodStatus) {
      if (notify) notify("Selecione ao menos um item para abastecer.");
      return;
    }

    setSubmitting(true);
    try {
      if (onConfirm) {
        await onConfirm({
          point_id: point.id,
          supplied_water: waterStatus !== null,
          supplied_food: foodStatus !== null,
          water_status: waterStatus || undefined,
          food_status: foodStatus || undefined,
          notes: notes.trim(),
        });
      }
    } catch (error) {
      console.error("Erro ao enviar abastecimento:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="supply-page">
      <header className="supply-page-heading">
        <h2>Registrar abastecimento</h2>
        <p>Atualize o status do ponto sem precisar de cadastro.</p>
      </header>

      <div className="supply-form-card">
        <h3 style={{ margin: "0 0 16px 0", color: "#0f172a" }}>{point.name}</h3>
        <p style={{ fontWeight: 600, color: "#334155", marginBottom: "16px" }}>O que foi abastecido?</p>

        {/* CONTROLE DE ÁGUA */}
        <div style={{ marginBottom: "16px", padding: "16px", borderRadius: "8px", border: "1px solid #f1f5f9", background: "#f8fafc" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontWeight: "bold", fontSize: "1.05rem", color: "#0f172a" }}>Água</span>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Atualizar disponibilidade de água</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="supply-status-button"
              type="button"
              onClick={() => setWaterStatus("cheio")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: waterStatus === "cheio" ? "2px solid #22c55e" : "1px solid #cbd5e1",
                backgroundColor: waterStatus === "cheio" ? "#dcfce7" : "#fff",
                color: waterStatus === "cheio" ? "#15803d" : "#475569",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <><span className="supply-status-dot is-full" aria-hidden="true" /> CHEIO</>
            </button>
            <button
              className="supply-status-button"
              type="button"
              onClick={() => setWaterStatus("vazio")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: waterStatus === "vazio" ? "2px solid #ef4444" : "1px solid #cbd5e1",
                backgroundColor: waterStatus === "vazio" ? "#fee2e2" : "#fff",
                color: waterStatus === "vazio" ? "#b91c1c" : "#475569",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <><span className="supply-status-dot is-empty" aria-hidden="true" /> VAZIO</>
            </button>
          </div>
        </div>

        {/* CONTROLE DE RAÇÃO */}
        <div style={{ marginBottom: "20px", padding: "16px", borderRadius: "8px", border: "1px solid #f1f5f9", background: "#f8fafc" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontWeight: "bold", fontSize: "1.05rem", color: "#0f172a" }}>Ração</span>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Atualizar disponibilidade de ração</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="supply-status-button"
              type="button"
              onClick={() => setFoodStatus("cheio")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: foodStatus === "cheio" ? "2px solid #22c55e" : "1px solid #cbd5e1",
                backgroundColor: foodStatus === "cheio" ? "#dcfce7" : "#fff",
                color: foodStatus === "cheio" ? "#15803d" : "#475569",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <><span className="supply-status-dot is-full" aria-hidden="true" /> CHEIO</>
            </button>
            <button
              className="supply-status-button"
              type="button"
              onClick={() => setFoodStatus("vazio")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: foodStatus === "vazio" ? "2px solid #ef4444" : "1px solid #cbd5e1",
                backgroundColor: foodStatus === "vazio" ? "#fee2e2" : "#fff",
                color: foodStatus === "vazio" ? "#b91c1c" : "#475569",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <><span className="supply-status-dot is-empty" aria-hidden="true" /> VAZIO</>
            </button>
          </div>
        </div>

        {/* OBSERVAÇÕES */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#334155" }}>
            Observações (opcional)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: Coloquei 3kg de ração e 10L de água."
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
          />
        </div>

        {/* BOTÕES */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              background: "#e2e8f0",
              color: "#334155",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {submitting ? "Salvando..." : "Confirmar abastecimento"}
          </button>
        </div>
      </div>

      <section className="card supply-history" aria-labelledby="supply-history-title">
        <h3 id="supply-history-title">Histórico dos Últimos Abastecimentos</h3>

        {loadingHistory ? (
          <p className="supply-history-message" role="status">Carregando histórico...</p>
        ) : historyError ? (
          <p className="supply-history-message supply-history-error" role="alert">
            Não foi possível carregar o histórico: {historyError}
          </p>
        ) : supplies.length === 0 ? (
          <p className="supply-history-message">Nenhum abastecimento registrado ainda.</p>
        ) : (
          <div className="supply-history-list">
            {supplies.map((supply) => (
              <article className="supply-history-item" key={supply.id}>
                <h4>{supply.point_name || 'Ponto não identificado'}</h4>
                <p className="supply-history-user">
                  Autor: {supply.user_name || 'Voluntário'}
                </p>
                <div className="supply-history-insumos">
                  {supply.supplied_water && <span>Água</span>}
                  {supply.supplied_food && <span>Ração</span>}
                  {!supply.supplied_water && !supply.supplied_food && (
                    <span>Insumos não informados</span>
                  )}
                </div>
                <time dateTime={supply.supplied_at || undefined}>
                  {formatSupplyDate(supply.supplied_at)}
                </time>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// --- CADASTRO ---
export function RegisterPage({
  notify,
  onCreate,
}: {
  notify: (message: string) => void
  onCreate?: (point: CreatePointInput) => Promise<void>
}) {
  const [form, setForm] = useState({
    name: '',
    address: '',
    neighborhood: '',
    description: '',
  })

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (
    field: keyof typeof form,
    value: string
  ) => setForm((prev) => ({ ...prev, [field]: value }))

  const submit = async () => {
    const { name, address, neighborhood, description } = form

    if (!name || !address || !neighborhood) {
      notify('Preencha nome, endereço e bairro.')
      return
    }

    if (!coords) {
      notify('Clique no mapa para marcar a localização exata do ponto.')
      return
    }

    try {
      setIsSubmitting(true)

      await onCreate?.({
        name,
        address,
        neighborhood,
        description,
        lat: coords.lat,
        lng: coords.lng,
        responsible: 'Sem responsável',
      })
    } catch {
      notify('Erro ao registrar novo ponto.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fields = [
    ['name', 'Nome do ponto', 'Ex.: Ponto Esperança'],
    ['address', 'Endereço', 'Ex.: Rua das Flores, 123'],
    ['neighborhood', 'Bairro', 'Ex.: Centro'],
  ] as const

  return (
    <>
      <Title
        title="Cadastro de ponto"
        subtitle="Clique no mapa para posicionar o comedouro e preencha as informações."
      />

      <div className="map-layout">
        <section className="card form">
          {fields.map(([field, label, placeholder]) => (
            <div className="field" key={field}>
              <label>{label}</label>
              <input
                value={form[field]}
                onChange={(e) => updateField(field, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}

          <div className="field">
            <label>Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="textarea"
              placeholder="Fale sobre o acesso, visibilidade do comedouro, etc."
            />
          </div>

          <div className="highlight">
            <b>Coordenadas Selecionadas:</b>
            <p className="muted" style={{ marginTop: 4 }}>
              {coords
                ? `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`
                : 'Nenhuma localização marcada. Clique no mapa ao lado!'}
            </p>
          </div>

          <div className="actions">
            <button
              className="primary full"
              disabled={isSubmitting}
              onClick={() => void submit()}
            >
              {isSubmitting ? 'Salvando...' : 'Confirmar e salvar ponto'}
            </button>
          </div>
        </section>

        <section className="card" style={{ height: 450, padding: 12 }}>
          <InteractiveMap
            points={[]}
            selectedCoords={coords}
            onMapClick={setCoords}
          />
        </section>
      </div>
    </>
  )
}

// --- OCORRÊNCIAS ---

interface OccurrencesPageProps {
  user: User | null
  points: PetPoint[]
  currentPoint?: PetPoint | null
  notify?: (msg: string) => void
}

const formatIncidentDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const formattedTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)

  return `${formattedDate} às ${formattedTime}`
}

export function OccurrencesPage({
  user,
  points = [],
  currentPoint,
  notify,
}: OccurrencesPageProps): import("react").JSX.Element {
  const [occurrences, setOccurrences] = useState<Incident[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [selectedPointId, setSelectedPointId] = useState<number>(() => {
    return currentPoint?.id ?? points[0]?.id ?? 0
  })
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const currentPointId = currentPoint?.id
  useEffect(() => {
    setSelectedPointId((selectedId) => {
      if (currentPointId && points.some((point) => point.id === currentPointId)) {
        return currentPointId
      }
      if (points.some((point) => point.id === selectedId)) return selectedId
      return points[0]?.id ?? 0
    })
  }, [currentPointId, points])

  const isAdmin = user?.role === "admin"

  const fetchOccurrences = async () => {
    setLoading(true)
    try {
      const data = await api.getIncidents();
      setOccurrences(data)
    } catch (error) {
      console.error("Erro ao carregar ocorrências:", error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchOccurrences()
  }, [])

  const handleCreateOccurrence = async (e: React.FormEvent) => {
    e.preventDefault()

    const selectedPoint = points.find((point) => point.id === selectedPointId)
    if (!selectedPoint || !title.trim() || !description.trim()) {
      if (notify) notify("Preencha todos os campos da ocorrência e selecione um ponto válido.")
      return
    }

    setSubmitting(true)
    try {
      await api.createIncident({
        point_id: selectedPoint.id,
        user_id: user?.id,
        point_name: selectedPoint.name,
        title: title.trim(),
        description: description.trim(),
      })

      if (notify) notify("Ocorrência registrada com sucesso!")
      setTitle("")
      setDescription("")
      await fetchOccurrences()
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao registrar ocorrência."
      if (notify) notify(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (id: number, newStatus: IncidentStatus) => {
    try {
      await api.updateIncidentStatus(id, newStatus)
      if (notify) notify("Status da ocorrência atualizado!")
      fetchOccurrences()
    } catch {
      if (notify) notify("Erro ao atualizar status.")
    }
  }

  const handleDeleteOccurrence = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta ocorrência?")) return
    try {
      await api.deleteIncident(id)
      if (notify) notify("Ocorrência excluída com sucesso.")
      fetchOccurrences()
    } catch {
      if (notify) notify("Erro ao excluir ocorrência.")
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900, margin: "0 auto", width: "100%" }}>
      {/* FORMULÁRIO DE NOVA OCORRÊNCIA */}
      <div className="card" style={{ padding: 24 }}>
        <h3>Reportar nova ocorrência</h3>
        <p className="muted" style={{ marginBottom: 16 }}>
          Informe danos no ponto, falta constante de alimento, vandalismo ou problemas com animais na região.
        </p>

        <form onSubmit={handleCreateOccurrence} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="field">
            <label>Ponto Pet Relacionado</label>
            <select
              value={selectedPointId}
              onChange={(e) => setSelectedPointId(Number(e.target.value))}
            >
              {points.length === 0 ? (
                <option value={0}>Nenhum ponto cadastrado</option>
              ) : (
                points.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.neighborhood}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="field">
            <label>Título da Ocorrência</label>
            <input
              type="text"
              placeholder="Ex: Comedouro quebrado ou Bebedouro sujo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Descrição detalhada</label>
            <textarea
              rows={3}
              placeholder="Descreva o que aconteceu para que o responsável ou a ONG tome providências..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontFamily: "inherit",
              }}
            />
          </div>

          <button className="primary" type="submit" disabled={submitting || points.length === 0} style={{ marginTop: 8 }}>
            {submitting ? "Enviando..." : "Enviar Ocorrência"}
          </button>
        </form>
      </div>

      {/* LISTA DE OCORRÊNCIAS REGISTRADAS */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Ocorrências Registradas ({occurrences.length})</h3>
          <button className="secondary" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={fetchOccurrences}>
            Atualizar
          </button>
        </div>

        {loading ? (
          <p className="muted">Carregando ocorrências...</p>
        ) : occurrences.length === 0 ? (
          <p className="muted">Nenhuma ocorrência registrada até o momento.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {occurrences.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: 16,
                  backgroundColor: item.status === "resolvida" ? "#f8fafc" : "#ffffff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", color: "#0f172a" }}>{item.title}</h4>
                    <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                      <strong>{item.point_name || `Ponto #${item.point_id}`}</strong> • Autor: {item.user_name || "Anônimo/Voluntário"}
                    </p>
                  </div>

                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      background:
                        item.status === "resolvida"
                          ? "#d1fae5"
                          : item.status === "em_analise"
                          ? "#fef3c7"
                          : "#fee2e2",
                      color:
                        item.status === "resolvida"
                          ? "#065f46"
                          : item.status === "em_analise"
                          ? "#92400e"
                          : "#991b1b",
                    }}
                  >
                    {item.status === "resolvida"
                      ? "Resolvida"
                      : item.status === "em_analise"
                      ? "Em Análise"
                      : "Aberta"}
                  </span>
                </div>

                <p style={{ marginTop: 12, marginBottom: 12, color: "#334155", fontSize: "0.95rem" }}>
                  {item.description}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: 8,
                  }}
                >
                  <small className="muted">
                    <time dateTime={item.created_at}>
                      {formatIncidentDate(item.created_at)}
                    </time>
                  </small>

                  <div style={{ display: "flex", gap: 8 }}>
                    {isAdmin && item.status !== "resolvida" && (
                      <button
                        className="secondary"
                        style={{ padding: "3px 8px", fontSize: "0.8rem" }}
                        onClick={() => handleStatusChange(item.id, "resolvida")}
                      >
                        Marcar resolvida
                      </button>
                    )}

                    {(isAdmin || user?.id === item.user_id) && (
                      <button
                        className="secondary"
                        style={{
                          color: "var(--red, #ef4444)",
                          borderColor: "var(--red, #ef4444)",
                          padding: "3px 8px",
                          fontSize: "0.8rem",
                        }}
                        onClick={() => handleDeleteOccurrence(item.id)}
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// --- PERFIL ---
interface ProfilePageProps {
  user: User | null
  onLogout?: () => void
  notify?: (msg: string) => void
}

export function ProfilePage({
  user,
  onLogout,
  notify,
}: ProfilePageProps) {
  const [usersList, setUsersList] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const isAdmin = user?.role === 'admin'

  const fetchUsers = async () => {
    setLoading(true)

    try {
      setUsersList(await api.getUsers())
    } catch (error) {
      console.error('Erro ao carregar lista de usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDeleteAccount = async (
    targetUserId: number,
    targetUserName: string
  ) => {
    const isSelf = targetUserId === user?.id

    const message = isSelf
      ? 'Tem certeza de que deseja excluir sua própria conta? Esta ação não pode ser desfeita.'
      : `Tem certeza de que deseja excluir o perfil de "${targetUserName}"?`

    if (!window.confirm(message)) return

    try {
      await api.deleteUser(targetUserId)

      notify?.(
        isSelf
          ? 'Sua conta foi excluída com sucesso.'
          : 'Perfil removido com sucesso.'
      )

      if (isSelf) onLogout?.()
      else fetchUsers()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao excluir perfil.'

      notify ? notify(message) : alert(message)
    }
  }

  if (!user) {
    return <div style={{ padding: 20 }}>Carregando dados do perfil...</div>
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        maxWidth: 800,
        margin: '0 auto',
      }}
    >
      <div className="card" style={{ padding: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: isAdmin ? '#2563eb' : '#059669',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 700,
            }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
          </div>

          <div>
            <h2 style={{ margin: 0 }}>{user.name}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {user.email}
            </p>

            <span
              style={{
                display: 'inline-block',
                marginTop: 4,
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: isAdmin ? '#2563eb' : '#059669',
                background: isAdmin ? '#dbeafe' : '#d1fae5',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              {isAdmin ? 'Administrador' : 'Colaborador'}
            </span>
          </div>
        </div>

        <div className="divider" style={{ margin: '16px 0' }} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>Excluir minha conta</strong>
            <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
              Remove permanentemente seus dados do sistema.
            </p>
          </div>

          <button
            className="secondary"
            style={{
              color: 'var(--red, #ef4444)',
              borderColor: 'var(--red, #ef4444)',
              padding: '8px 16px',
            }}
            onClick={() =>
              user.id !== undefined &&
              handleDeleteAccount(user.id, user.name)
            }
          >
            Excluir minha conta
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0 }}>
            Perfis Cadastrados ({usersList.length})
          </h3>

          <button
            className="secondary"
            style={{ padding: '4px 12px', fontSize: '0.85rem' }}
            onClick={fetchUsers}
          >
            Atualizar
          </button>
        </div>

        {loading ? (
          <p className="muted">Carregando perfis...</p>
        ) : usersList.length === 0 ? (
          <p className="muted">Nenhum perfil cadastrado além do seu.</p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {usersList.map((u) => (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor:
                    u.id === user.id ? '#f8fafc' : '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                }}
              >
                <div>
                  <strong>
                    {u.name} {u.id === user.id && '(Você)'}
                  </strong>

                  <div
                    className="muted"
                    style={{ fontSize: '0.85rem' }}
                  >
                    {u.email} •{' '}
                    <span style={{ textTransform: 'capitalize' }}>
                      {u.role || 'user'}
                    </span>
                  </div>
                </div>

                {(isAdmin || u.id === user.id) && (
                  <button
                    className="secondary"
                    style={{
                      color: 'var(--red, #ef4444)',
                      borderColor: 'var(--red, #ef4444)',
                      padding: '4px 10px',
                      fontSize: '0.8rem',
                    }}
                    onClick={() =>
                      u.id !== undefined &&
                      handleDeleteAccount(u.id, u.name)
                    }
                  >
                    Excluir
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
