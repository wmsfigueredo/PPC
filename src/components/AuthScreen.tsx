import React, { useState } from 'react'
import { Brand } from './Brand'
import type { User } from '../types'

type AuthScreenProps = {
  onAuthenticated: (user: User) => void
  authenticate: (
    mode: 'login' | 'register',
    data: { name?: string; email: string; password: string; role?: 'user' | 'admin' }
  ) => Promise<User>
}

export function AuthScreen({ onAuthenticated, authenticate }: AuthScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Estado para o Popup Modal de Mensagens/Erros
  const [modalMessage, setModalMessage] = useState<string | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email || !password || (isRegistering && !name)) {
      setModalMessage('Preencha todos os campos para continuar.')
      return
    }

    if (!email.includes('@') || password.length < 6) {
      setModalMessage('Informe um e-mail válido e uma senha com no mínimo 6 caracteres.')
      return
    }

    setSubmitting(true)
    try {
      const mode = isRegistering ? 'register' : 'login'
      const payload = isRegistering
        ? { name: name.trim(), email: email.trim(), password, role }
        : { email: email.trim(), password }

      const authenticatedUser = await authenticate(mode, payload)
      onAuthenticated(authenticatedUser)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Não foi possível concluir a autenticação.'
      setModalMessage(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login">
      {/* POPUP MODAL DE ERRO / AVISO */}
      {modalMessage && (
        <div className="modal-overlay" onClick={() => setModalMessage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">⚠️</div>
            <h3>Atenção</h3>
            <p>{modalMessage}</p>
            <button
              type="button"
              className="primary full"
              style={{ marginTop: '16px' }}
              onClick={() => setModalMessage(null)}
              autoFocus
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <div className="login-shell">
        <section className="login-hero">
          <Brand />
          <h1>
            Juntos por eles,
            <br />
            <span>cuidados por todos.</span>
          </h1>
          <p>
            Localize, cadastre e monitore pontos comunitários de alimentação para animais em situação de rua.
          </p>
          <div className="pet-art">🐕 🐈</div>
        </section>

        <section className="login-form">
          <h2>{isRegistering ? 'Crie sua conta' : 'Bem-vindo!'}</h2>
          <p>{isRegistering ? 'Cadastre-se para participar da comunidade' : 'Faça login para continuar'}</p>

          <form onSubmit={submit}>
            {isRegistering && (
              <div className="field">
                <label>Tipo de Perfil</label>
                <select value={role} onChange={(e) => setRole(e.target.value as 'user' | 'admin')}>
                  <option value="user">Colaborador Comum (Visualizar e Abastecer)</option>
                  <option value="admin">Administrador (Gerenciar e Criar Pontos)</option>
                </select>
              </div>
            )}

            {isRegistering && (
              <div className="field">
                <label htmlFor="name">Nome completo</label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>

            {!isRegistering && (
              <div className="row check-row">
                <label className="check">
                  <input type="checkbox" /> Lembrar-me
                </label>
                <button
                  type="button"
                  className="link"
                  onClick={() => setModalMessage('O fluxo de recuperação de senha será disponibilizado em breve.')}
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            <button className="primary full" type="submit" disabled={submitting}>
              {submitting ? 'Aguarde...' : isRegistering ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          <p className="auth-switch">
            {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}{' '}
            <button
              className="link"
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering)
                setModalMessage(null)
              }}
            >
              {isRegistering ? 'Faça login' : 'Cadastre-se'}
            </button>
          </p>
          <p className="prototype-note">Protótipo navegável • PPC</p>
        </section>
      </div>
    </main>
  )
}