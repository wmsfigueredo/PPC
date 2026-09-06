import { useState } from 'react'
import { Brand } from './Brand'

type AuthUser = { id: number; name: string; email: string }
type AuthScreenProps = { onAuthenticated: (user: AuthUser) => void; authenticate: (mode: 'login' | 'register', data: { name?: string; email: string; password: string }) => Promise<AuthUser> }

export function AuthScreen({ onAuthenticated, authenticate }: AuthScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email || !password || (isRegistering && !name)) {
      setMessage('Preencha todos os campos para continuar.')
      return
    }
    if (!email.includes('@') || password.length < 6) {
      setMessage('Informe um e-mail válido e uma senha com 6 caracteres.')
      return
    }
    setSubmitting(true)
    try {
      const authenticatedUser = await authenticate(isRegistering ? 'register' : 'login', { name, email, password })
      onAuthenticated(authenticatedUser)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a autenticação.')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="login"><div className="login-shell">
    <section className="login-hero"><Brand /><h1>Juntos por eles,<br /><span>cuidados por todos.</span></h1><p>Localize, cadastre e monitore pontos comunitários de alimentação para animais em situação de rua.</p><div className="pet-art">🐕 🐈</div></section>
    <section className="login-form"><h2>{isRegistering ? 'Crie sua conta' : 'Bem-vindo!'}</h2><p>{isRegistering ? 'Cadastre-se para participar da comunidade' : 'Faça login para continuar'}</p>
      <form onSubmit={submit}>
        {isRegistering && <div className="field"><label htmlFor="name">Nome completo</label><input id="name" value={name} onChange={event => setName(event.target.value)} placeholder="Seu nome completo" /></div>}
        <div className="field"><label htmlFor="email">E-mail</label><input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="seu@email.com" /></div>
        <div className="field"><label htmlFor="password">Senha</label><input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="••••••••" /></div>
        {!isRegistering && <div className="row check-row"><label className="check"><input type="checkbox" /> Lembrar-me</label><button type="button" className="link" onClick={() => setMessage('O fluxo de recuperação será disponibilizado em breve.')}>Esqueceu sua senha?</button></div>}
        {message && <p className="form-message">{message}</p>}
          <button className="primary full" type="submit" disabled={submitting}>{submitting ? 'Aguarde...' : isRegistering ? 'Criar conta' : 'Entrar'}</button>
      </form>
      <p className="auth-switch">{isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'} <button className="link" onClick={() => { setIsRegistering(!isRegistering); setMessage('') }}>{isRegistering ? 'Faça login' : 'Cadastre-se'}</button></p>
      <p className="prototype-note">Protótipo navegável • PPC</p>
    </section>
  </div></main>
}
