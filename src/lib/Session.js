const USERS = [
  { id: 1, nome: 'Ana Lima',        email: 'cliente@pascal.com',      senha: '123', tipo: 'cliente'     },
  { id: 2, nome: 'Carlos Ferreira', email: 'profissional@pascal.com', senha: '123', tipo: 'professor'   },
  { id: 3, nome: 'Escola Pascal',   email: 'educacional@pascal.com',  senha: '123', tipo: 'educacional' },
]

const KEY = 'usuarioLogado'

const Session = {
  get() {
    try { return JSON.parse(localStorage.getItem(KEY)) }
    catch { return null }
  },
  set(user) { localStorage.setItem(KEY, JSON.stringify(user)) },
  clear() { localStorage.removeItem(KEY) },
  authenticate(email, senha) {
    return USERS.find(u => u.email === email && u.senha === senha) || null
  },
}

export default Session
