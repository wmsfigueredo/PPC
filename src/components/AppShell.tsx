import React from 'react'
import type { Page, User } from '../types'
import { Brand } from './Brand'

const navigation: { page: Page; icon: string; label: string }[] = [
  { page: 'mapa', icon: '🗺️', label: 'Mapa' },
  { page: 'meus', icon: '♡', label: 'Meus pontos' },
  { page: 'cadastro', icon: '⊕', label: 'Cadastro de ponto' },
  { page: 'ocorrencias', icon: '⚠', label: 'Ocorrências' },
  { page: 'abastecimento', icon: '💧', label: 'Abastecimentos' },
  { page: 'perfil', icon: '👤', label: 'Perfil' },
]

type AppShellProps = {
  children?: React.ReactNode
  page: Page
  onNavigate: (page: Page) => void
  onLogout: () => void
  user?: User | null
  notify?: (message: string) => void
}

export function AppShell({
  children,
  page,
  onNavigate,
  onLogout,
  user,
  notify,
}: AppShellProps) {
  const isAdmin = user?.role === 'admin'
  const firstName = user?.name ? user.name.trim().split(' ')[0] : 'Visitante'
  const avatarLetter = user?.name ? user.name.trim().charAt(0).toUpperCase() : '?'

  // Filtra as abas permitidas de acordo com o perfil
  const accessibleNav = navigation.filter((item) => {
    if (item.page === 'cadastro' && !isAdmin) return false
    return true
  })

  const handleNotificationClick = () => {
    if (notify) {
      notify('Você não possui notificações novas no momento.')
    } else {
      alert('Você não possui notificações novas no momento.')
    }
  }

  return (
    <div className="app">
      {/* 1. TOPO ÚNICO */}
      <header className="topbar">
        <Brand />

        <div className="userbox">
          <button
            type="button"
            className="icon-btn"
            aria-label="Notificações"
            title="Notificações"
            onClick={handleNotificationClick}
          >
            🔔
          </button>

          <div className="avatar">{avatarLetter}</div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span>Olá, {firstName}⌄</span>
            <small
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: isAdmin ? '#2563eb' : '#64748b',
                background: isAdmin ? '#dbeafe' : '#f1f5f9',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              {isAdmin ? 'Administrador' : 'Colaborador'}
            </small>
          </div>

          <button
            type="button"
            className="icon-btn"
            aria-label="Sair"
            title="Sair"
            onClick={onLogout}
            style={{ marginLeft: '0.5rem' }}
          >
            ↩
          </button>
        </div>
      </header>

      {/* 2. CORPO (SIDEBAR + CONTEÚDO ÚNICO) */}
      <div className="layout">
        <aside className="sidebar">
          {accessibleNav.map((item) => (
            <button
              key={item.page}
              className={`nav-btn ${page === item.page ? 'active' : ''}`}
              onClick={() => onNavigate(item.page)}
            >
              <span style={{ marginRight: '8px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        <main className="main">{children}</main>
      </div>

      {/* 3. BARRA INFERIOR (APENAS TELAS PEQUENAS/MOBILE) */}
      <nav className="mobile-nav">
        {accessibleNav
          .filter((item) =>
            ['mapa', 'meus', 'cadastro', 'ocorrencias', 'perfil'].includes(item.page)
          )
          .map((item) => (
            <NavButton
              key={item.page}
              {...item}
              active={page === item.page}
              onClick={onNavigate}
            />
          ))}
      </nav>
    </div>
  )
}

function NavButton({
  page,
  icon,
  label,
  active,
  onClick,
}: {
  page: Page
  icon: string
  label: string
  active: boolean
  onClick: (page: Page) => void
}) {
  return (
    <button
      className={`nav ${active ? 'active' : ''}`}
      onClick={() => onClick(page)}
    >
      <span className="ico">{icon}</span>
      <span>{label}</span>
    </button>
  )
}