import type { Page } from '../types'
import { Brand } from './Brand'

const navigation: { page: Page; icon: string; label: string }[] = [
  { page: 'mapa', icon: '🗺️', label: 'Mapa' }, { page: 'meus', icon: '♡', label: 'Meus pontos' },
  { page: 'cadastro', icon: '⊕', label: 'Cadastro de ponto' }, { page: 'ocorrencias', icon: '⚠', label: 'Ocorrências' },
  { page: 'abastecimento', icon: '💧', label: 'Abastecimentos' }, { page: 'perfil', icon: '♙', label: 'Perfil' },
]

type AppShellProps = { page: Page; onNavigate: (page: Page) => void; onLogout: () => void; children: React.ReactNode }

export function AppShell({ page, onNavigate, onLogout, children }: AppShellProps) {
  return <div className="app"><header className="topbar"><Brand /><div className="userbox"><button className="icon-btn" aria-label="Notificações">🔔</button><div className="avatar">M</div><span>Olá, Marcos⌄</span></div></header>
    <div className="layout"><aside className="sidebar">{navigation.map(item => <NavButton key={item.page} {...item} active={page === item.page} onClick={onNavigate} />)}<div className="side-spacer" /><button className="nav" onClick={onLogout}><span className="ico">↪</span>Sair</button></aside><main className="main">{children}</main></div>
    <nav className="mobile-nav">{navigation.filter(item => ['mapa', 'meus', 'cadastro', 'ocorrencias', 'perfil'].includes(item.page)).map(item => <NavButton key={item.page} {...item} active={page === item.page} onClick={onNavigate} />)}</nav>
  </div>
}

function NavButton(
        { page, icon, label, active, onClick }:
        { page: Page; icon: string; label: string; active: boolean; onClick: (page: Page) => void }) 
        {
  return <button className={`nav ${active ? 'active' : ''}`} onClick={() => onClick(page)}><span className="ico">{icon}</span><span>{label}</span></button>
}
