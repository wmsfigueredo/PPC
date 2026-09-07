import { useState } from 'react'
import type { PetPoint, User } from '../types'
import InteractiveMap from '../components/InteractiveMap'

type PageProps = {
  points: PetPoint[]
  currentPoint: PetPoint
  onSelectPoint: (point: PetPoint) => void
  onNavigate: (page: 'mapa' | 'cadastro' | 'abastecimento') => void
  notify: (message: string) => void
}

const Badge = ({ point }: { point: PetPoint }) => (
  <span className={`badge ${point.status}`}>● {point.statusText}</span>
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

// --- TELA DE MAPA COM OPENSTREETMAP ---
export function MapPage({
  points,
  currentPoint,
  onSelectPoint,
  onNavigate,
  notify,
  onDeletePoint,
  user,
}: PageProps & { onDeletePoint?: (id: number) => void; user?: User | null }) {
  // DECLARE ESTA LINHA AQUI:
  const [searchTerm, setSearchTerm] = useState('')

  // Filtra os pontos com base no texto digitado
  const filteredPoints = points.filter((point) => {
    const term = searchTerm.toLowerCase()
    return (
      point.name.toLowerCase().includes(term) ||
      point.neighborhood.toLowerCase().includes(term) ||
      point.address.toLowerCase().includes(term)
    )
  })

  return (
    <>
      <Title
        title="Mapa"
        subtitle="Encontre pontos comunitários de alimentação perto de você."
        action={
          user?.role === 'admin' ? (
            <button className="primary" onClick={() => onNavigate('cadastro')}>
              ＋ Novo ponto
            </button>
          ) : undefined
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
              ☷ Filtros
            </button>
          </div>

          <div className="map" style={{ height: '480px', position: 'relative' }}>
            <InteractiveMap
              points={filteredPoints as any}
              currentPoint={currentPoint as any}
              onSelectPoint={(pt) => onSelectPoint(pt as any)}
            />
            <div className="map-legend">
              🟢 Abastecido 🟠 Em atenção 🔴 Vazio
            </div>
          </div>
        </section>

        <PointPanel
          point={currentPoint}
          onSupply={() => onNavigate('abastecimento')}
          notify={notify}
          onDelete={user?.role === 'admin' ? onDeletePoint : undefined}
        />
      </div>
    </>
  )
}

function PointPanel({
  point,
  onSupply,
  notify,
  onDelete,
}: {
  point?: PetPoint | null
  onSupply: () => void
  notify: (message: string) => void
  onDelete?: (id: number) => void
}) {
  if (!point || !point.name) {
    return (
      <aside className="card point-panel">
        <div className="point-photo">🐾</div>
        <h2>Nenhum ponto selecionado</h2>
        <p className="muted" style={{ marginTop: '8px' }}>
          Selecione um ponto no mapa ou cadastre um novo para visualizar os detalhes.
        </p>
      </aside>
    )
  }

  const lastSupplyText =
    point.lastSupply || point.last_supply || 'Não informado'

  return (
    <aside className="card point-panel">
      <div className="point-photo">🐕</div>

      <div className="row">
        <h2>{point.name}</h2>
        <Badge point={point} />
      </div>

      <p className="muted">
        ⌖ {point.address}
        <br />
        {point.neighborhood}
      </p>

      <div className="divider" />

      <div className="muted">Responsável</div>
      <strong>{point.responsible || 'Comunidade'}</strong>

      <p className="muted supply-info">
        Último abastecimento
        <br />
        <strong>{lastSupplyText}</strong>
      </p>

      <div className="mini-grid">
        <Mini
          icon="💧"
          value={point.water ? 'Abastecida' : 'Necessita'}
          label="Água"
        />
        <Mini
          icon="🥣"
          value={point.food ? 'Abastecida' : 'Necessita'}
          label="Ração"
        />
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
        onClick={() =>
          notify('Ocorrência enviada ao responsável e ao administrador/ONG.')
        }
      >
        ⚠ Reportar ocorrência
      </button>

      {/* Botão de Excluir Ponto (Apenas Admin) */}
      {onDelete && (
        <button
          className="secondary full"
          style={{
            color: 'var(--red, #ef4444)',
            borderColor: 'var(--red, #ef4444)',
            marginTop: '4px',
          }}
          onClick={() => onDelete(point.id)}
        >
          🗑 Excluir ponto
        </button>
      )}
    </aside>
  )
}


const Mini = ({
  icon,
  value,
  label,
}: {
  icon: string
  value: string
  label: string
}) => (
  <div className="mini">
    {icon}
    <strong>{value}</strong>
    <span>{label}</span>
  </div>
)

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
            ＋ Cadastrar ponto
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
              <div className="thumb">🐾</div>
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

// --- ABASTECIMENTO ---
export function SupplyPage({
  point,
  notify,
  onConfirm,
}: {
  point: PetPoint
  notify: (message: string) => void
  onConfirm: (water: boolean, food: boolean, notes: string) => Promise<void>
}) {
  const confirm = () => onConfirm(true, true, '')
  return (
    <>
      <Title
        title="Registrar abastecimento"
        subtitle="Atualize o status do ponto sem precisar de cadastro."
      />
      <section className="card form">
        <div className="highlight">
          <b>{point.name}</b>
          <p className="muted">
            ⌖ {point.address} — {point.neighborhood}
          </p>
        </div>
        <label className="section-label">O que foi abastecido?</label>
        <Toggle label="Água" icon="💧" />
        <Toggle label="Ração" icon="🥣" />
        <div className="field">
          <label>Observações (opcional)</label>
          <textarea
            className="textarea"
            placeholder="Ex.: Coloquei 3kg de ração e 10L de água."
          />
        </div>
        <div className="field">
          <label>Data e hora</label>
          <input type="datetime-local" />
        </div>
        <div className="actions">
          <button
            className="secondary"
            onClick={() => notify('Alterações descartadas.')}
          >
            Cancelar
          </button>
          <button className="primary" onClick={confirm}>
            Confirmar abastecimento
          </button>
        </div>
      </section>
    </>
  )
}

function Toggle({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="toggle-row">
      <div>
        {icon} <b>{label}</b>
        <div className="muted">
          Atualizar disponibilidade de {label.toLowerCase()}
        </div>
      </div>
      <span className="toggle on">
        <i />
      </span>
    </div>
  )
}

// --- CADASTRO DE PONTO ---
export function RegisterPage({
  notify,
  onCreate,
}: {
  notify: (message: string) => void
  onCreate?: (point: Omit<PetPoint, 'id'>) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [description, setDescription] = useState('')
  // Estado para armazenar as coordenadas clicadas no mapa
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async () => {
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
      if (onCreate) {
        await onCreate({
          name,
          address,
          neighborhood,
          description,
          lat: coords.lat,
          lng: coords.lng,
          x: 0,
          y: 0,
          status: 'green',
          statusText: 'Abastecido',
          responsible: 'Sem responsável',
          lastSupply: 'Recém cadastrado',
          water: true,
          food: true,
        } as any)
      }
    } catch {
      notify('Erro ao registrar novo ponto.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Title
        title="Cadastro de ponto"
        subtitle="Clique no mapa para posicionar o comedouro e preencha as informações."
      />
      
      <div className="map-layout">
        {/* Formulário de dados */}
        <section className="card form">
          <div className="field">
            <label>Nome do ponto</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Ponto Esperança"
            />
          </div>

          <div className="field">
            <label>Endereço</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex.: Rua das Flores, 123"
            />
          </div>

          <div className="field">
            <label>Bairro</label>
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Ex.: Centro"
            />
          </div>

          <div className="field">
            <label>Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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

        {/* Mapa interativo para o clique */}
        <section className="card" style={{ height: '450px', padding: 12 }}>
          <InteractiveMap
            points={[]} // Sem pontos antigos para focar no novo
            selectedCoords={coords}
            onMapClick={(clickedCoords) => setCoords(clickedCoords)}
          />
        </section>
      </div>
    </>
  )
}

// --- OCORRÊNCIAS ---
export function OccurrencesPage({
  notify,
}: {
  notify: (message: string) => void
}) {
  return (
    <>
      <Title
        title="Ocorrências"
        subtitle="Acompanhe problemas reportados nos pontos comunitários."
        action={
          <button
            className="primary"
            onClick={() => notify('Formulário de nova ocorrência aberto.')}
          >
            ＋ Nova ocorrência
          </button>
        }
      />
      <section className="card">
        <div className="tabs">
          <button className="tab active">Todas</button>
          <button className="tab">Em andamento</button>
          <button className="tab">Resolvidas</button>
        </div>
        <div className="list">
          {[
            ['⚠', 'Ponto danificado', 'Ponto Esperança', 'Em andamento', 'orange'],
            ['🐾', 'Animal em situação de risco', 'Ponto Amizade', 'Em andamento', 'orange'],
            ['ⓘ', 'Falta de água', 'Ponto Bom-Estar', 'Resolvida', 'green'],
          ].map((item) => (
            <div className="list-item" key={item[1]}>
              <div className="thumb">{item[0]}</div>
              <div className="grow">
                <h3>{item[1]}</h3>
                <p>{item[2]} · Aberta em 27/05/2025</p>
              </div>
              <span className={`badge ${item[4]}`}>{item[3]}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

// --- PERFIL ---
export function ProfilePage({ user }: { user: User }) {
  const isAdmin = user.role === 'admin';

  return (
    <>
      <Title
        title="Perfil"
        subtitle="Seu histórico de participação na comunidade."
      />
      <div className="grid grid-2">
        <section className="card profile-hero">
          <div className="big-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{user.name}</h2>
            <p className="muted">{user.email}</p>
            <span className={`title-chip ${isAdmin ? 'admin' : ''}`}>
              {isAdmin ? '🛡 Administrador do Sistema' : '🐾 Cuidador do Bairro'}
            </span>          </div>
        </section>
        <section className="card">
          <h3>Resumo da contribuição</h3>
          <div className="mini-grid profile-stats">
            <Mini icon="🔄" value="6" label="Status atualizados" />
            <Mini icon="⚠" value="2" label="Ocorrências reportadas" />
            <Mini icon="📍" value="2" label="Pontos cadastrados" />
            <Mini icon="♡" value="3" label="Pontos acompanhados" />
          </div>
        </section>
      </div>
      <section className="card contribution">
        <h3>Como ganhar pontos?</h3>
        <p className="muted">
          Atualize pontos, reporte ocorrências válidas e ajude a comunidade a
          cuidar melhor dos animais.
        </p>
      </section>
    </>
  )
}