import Session from '../lib/Session'

export async function login(email, senha) {
  try {
    const user = Session.authenticate(email, senha)
    if (!user) return { data: null, error: 'E-mail ou senha inválidos' }
    Session.set(user)
    return { data: user, error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export async function logout() {
  try {
    Session.clear()
    return { data: true, error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export async function me() {
  try {
    return { data: Session.get(), error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}
