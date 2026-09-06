import { useState } from 'react'
import './Auth.css'

type AuthMode = 'login' | 'signup'

export function Auth() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (mode === 'login') {
      // Validação de login
      if (!email || !password) {
        setError('Por favor, preencha todos os campos')
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Email inválido')
        return
      }
      if (password.length < 6) {
        setError('Senha deve ter no mínimo 6 caracteres')
        return
      }
      // Simular login bem-sucedido
      setSuccess(`Bem-vindo, ${email}!`)
      setEmail('')
      setPassword('')
    } else {
      // Validação de registro
      if (!name || !email || !password) {
        setError('Por favor, preencha todos os campos')
        return
      }
      if (name.length < 3) {
        setError('Nome deve ter no mínimo 3 caracteres')
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Email inválido')
        return
      }
      if (password.length < 6) {
        setError('Senha deve ter no mínimo 6 caracteres')
        return
      }
      // Simular registro bem-sucedido
      setSuccess(`Conta criada com sucesso! Bem-vindo, ${name}!`)
      setName('')
      setEmail('')
      setPassword('')
      // Trocar para modo login após registro bem-sucedido
      setTimeout(() => setMode('login'), 2000)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Autenticação</h1>
          <p>Bem-vindo ao nosso sistema</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login')
              setError('')
              setSuccess('')
              setName('')
            }}
          >
            Entrar
          </button>
          <button
            className={`tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup')
              setError('')
              setSuccess('')
            }}
          >
            Registrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="name">Nome Completo</label>
              <input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="message error">{error}</div>}
          {success && <div className="message success">{success}</div>}

          <button type="submit" className="submit-btn">
            {mode === 'login' ? 'Entrar' : 'Registrar'}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'login' ? (
            <p>
              Não tem conta?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => setMode('signup')}
              >
                Crie uma
              </button>
            </p>
          ) : (
            <p>
              Já tem conta?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => setMode('login')}
              >
                Faça login
              </button>
            </p>
          )}
        </div>

        <div className="auth-social">
          <p>Ou continue com:</p>
          <div className="social-buttons">
            <button type="button" className="social-btn google">
              Google
            </button>
            <button type="button" className="social-btn github">
              GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
