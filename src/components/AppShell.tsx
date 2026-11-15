import React, { useCallback, useEffect, useState } from 'react'
import type { AppNotification, Page, User } from '../types'
import { Brand } from './Brand'
import { api } from '../services/api'

const navigation: { page: Page; label: string }[] = [
  { page: 'mapa', label: 'Mapa' },
  { page: 'meus', label: 'Meus pontos' },
  { page: 'cadastro', label: 'Cadastro de ponto' },
  { page: 'ocorrencias', label: 'Ocorrências' },
  { page: 'abastecimento', label: 'Abastecimentos' },
  { page: 'perfil', label: 'Perfil' },
]

type AppShellProps = {
  children?: React.ReactNode
  page: Page
  onNavigate: (page: Page) => void
  onLogout: () => void
  user?: User | null
}

function formatNotificationDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'

  const formatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)

  return formatted.replace(',', ' às')
}

export function AppShell({
  children,
  page,
  onNavigate,
  onLogout,
  user,
}: AppShellProps) {
  const isAdmin = user?.role === 'admin'
  const firstName = user?.name ? user.name.trim().split(' ')[0] : 'Visitante'
  const avatarLetter = user?.name ? user.name.trim().charAt(0).toUpperCase() : '?'
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(true)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [markingNotificationId, setMarkingNotificationId] = useState<number | null>(null)

  const loadNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setLoadingNotifications(true)

    try {
      setNotifications(await api.getNotifications())
      setNotificationError(null)
    } catch (error) {
      setNotificationError(
        error instanceof Error ? error.message : 'Não foi possível carregar as notificações.'
      )
    } finally {
      if (showLoading) setLoadingNotifications(false)
    }
  }, [])

  useEffect(() => {
    void loadNotifications(true)
    const intervalId = window.setInterval(() => {
      void loadNotifications()
    }, 30_000)

    return () => window.clearInterval(intervalId)
  }, [loadNotifications])

  const handleNotificationRead = async (id: number) => {
    setMarkingNotificationId(id)
    try {
      await api.markNotificationRead(id)
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      )
    } catch (error) {
      setNotificationError(
        error instanceof Error ? error.message : 'Não foi possível atualizar a notificação.'
      )
    } finally {
      setMarkingNotificationId(null)
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.is_read).length

  // Filtra as abas permitidas de acordo com o perfil
  const accessibleNav = navigation.filter((item) => {
    if (item.page === 'cadastro' && !isAdmin) return false
    return true
  })

  return (
    <div className="app">
      {/* 1. TOPO ÚNICO */}
      <header className="topbar">
        <Brand />

        <div className="userbox">
          <div className="notification-control">
            <button
              type="button"
              className="icon-btn"
              aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ''}`}
              title="Notificações"
              aria-expanded={notificationsOpen}
              aria-controls="notification-dropdown"
              onClick={() => {
                const nextOpen = !notificationsOpen
                setNotificationsOpen(nextOpen)
                if (nextOpen) void loadNotifications(true)
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
              </svg>
              {unreadCount > 0 && (
                <span className="notification-count" aria-hidden="true">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <section
                className="notification-dropdown"
                id="notification-dropdown"
                aria-label="Notificações"
              >
                <header className="notification-dropdown-header">
                  <h2>Notificações</h2>
                  <button
                    type="button"
                    className="notification-close"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    Fechar
                  </button>
                </header>

                {loadingNotifications ? (
                  <p className="notification-state" role="status">Carregando notificações...</p>
                ) : notificationError ? (
                  <p className="notification-state notification-error" role="alert">
                    {notificationError}
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="notification-state">Não há notificações.</p>
                ) : (
                  <ul className="notification-list">
                    {notifications.map((notification) => (
                      <li
                        key={notification.id}
                        className={[
                          'notification-item',
                          notification.is_read ? 'is-read' : 'is-unread',
                          notification.type === 'warning' ? 'is-warning' : '',
                          notification.type === 'success' ? 'is-success' : '',
                        ].filter(Boolean).join(' ')}
                      >
                        <div className="notification-item-heading">
                          <strong>
                            {notification.point_name || `Ponto #${notification.point_id}`}
                          </strong>
                          <time dateTime={notification.created_at}>
                            {formatNotificationDate(notification.created_at)}
                          </time>
                        </div>
                        <p>{notification.message}</p>
                        {!notification.is_read && (
                          <button
                            type="button"
                            className="notification-mark-read"
                            disabled={markingNotificationId === notification.id}
                            onClick={() => void handleNotificationRead(notification.id)}
                          >
                            {markingNotificationId === notification.id
                              ? 'Atualizando...'
                              : 'Marcar como lida'}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          <div className="avatar">{avatarLetter}</div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span>Olá, {firstName}</span>
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
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 17l5-5-5-5M15 12H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
            </svg>
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
  label,
  active,
  onClick,
}: {
  page: Page
  label: string
  active: boolean
  onClick: (page: Page) => void
}) {
  return (
    <button
      className={`nav ${active ? 'active' : ''}`}
      onClick={() => onClick(page)}
    >
      <span>{label}</span>
    </button>
  )
}
