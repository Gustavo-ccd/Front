import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/landing.css'
import CoursesDB from '../lib/CoursesDB'
import Session from '../lib/Session'

function LoginModal({ onLogin }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const result = onLogin(email.trim(), senha.trim())
    if (!result) setError('E-mail ou senha inválidos.')
  }

  return (
    <>
      <h2 id="modalTitulo">Entrar</h2>
      <div id="modalCorpo">
        <div style={{ background: '#21262d', border: '1px solid #30363d', padding: '15px', borderRadius: '10px', marginBottom: '20px', color: '#e6edf3' }}>
          <h4 style={{ color: '#00c8a0', marginBottom: '10px' }}>Usuários para teste</h4>
          <p>Cliente:</p>
          <small>cliente@pascal.com | 123</small>
          <br /><br />
          <p>Educacional:</p>
          <small>educacional@pascal.com | 123</small>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-campo">
            <label>E-mail</label>
            <input type="email" placeholder="Digite seu e-mail" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="modal-campo">
            <label>Senha</label>
            <input type="password" placeholder="Digite sua senha" value={senha} onChange={e => setSenha(e.target.value)} />
          </div>
          {error && <p style={{ color: '#e06c6c', marginBottom: '12px', fontSize: '.9rem' }}>{error}</p>}
          <button className="modal-botao" type="submit">Entrar</button>
        </form>
      </div>
    </>
  )
}

function RegisterModal() {
  return (
    <>
      <h2 id="modalTitulo">Cadastro Desativado</h2>
      <div id="modalCorpo">
        <p>Esta versão utiliza apenas usuários de demonstração.</p>
        <br />
        <p>Utilize um dos acessos disponíveis na tela de login.</p>
      </div>
    </>
  )
}

export default function LandingPage() {
  const [modalType, setModalType] = useState(null)
  const [courses, setCourses] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setCourses(CoursesDB.load())
  }, [])

  function handleLogin(email, senha) {
    const user = Session.authenticate(email, senha)
    if (!user) return false
    Session.set(user)
    navigate(user.tipo === 'cliente' ? '/user' : '/admin')
    return true
  }

  function closeModal() { setModalType(null) }

  return (
    <div className="page">
      <header className="topo">
        <h1 className="logo">EducaInclui PASCAL</h1>
        <nav className="menu-topo">
          <a href="#" onClick={e => { e.preventDefault(); setModalType('login') }}>Entrar</a>
          <a href="#" onClick={e => { e.preventDefault(); setModalType('register') }}>Registre-se</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-texto">
            {[
              ['P', 'Plataforma completa para cursos online.'],
              ['A', 'Aprendizado interativo com recursos modernos.'],
              ['S', 'Suporte e comunidade para se desenvolver.'],
              ['C', 'Conteúdo personalizável para cada perfil.'],
              ['A', 'Acesso a qualquer hora em qualquer dispositivo.'],
              ['L', 'Licença escalável para equipes e instituições.'],
            ].map(([letter, desc], i) => (
              <div className="hero-letter-row" key={i}>
                <p className="hero-letter">{letter}</p>
                <p className="hero-desc">{desc}</p>
              </div>
            ))}
          </div>
          <img id="ft1" src="/assets/fotos/womanNotebook.jpg" alt="Pessoa estudando usando um notebook" />
        </section>

        <section className="planos">
          <article className="card-plano card-plano-disabled">
            <div className="plano-badge-off">Não disponível</div>
            <h3>Profissional</h3>
            <p>Plano focado para profissionais que buscam vender seus cursos e treinamentos.</p>
            <span className="plano-btn-off">Recurso não implementado para essa apresentação</span>
          </article>
          <article className="card-plano card-plano-disabled">
            <div className="plano-badge-off">Não disponível</div>
            <h3>Empresarial</h3>
            <p>Plano focado para empresas que buscam ter um ambiente de treinamento e desenvolvimento para seus colaboradores.</p>
            <span className="plano-btn-off">Recurso não implementado para essa apresentação</span>
          </article>
          <article className="card-plano card-plano-disabled">
            <div className="plano-badge-off">Não disponível</div>
            <h3>Educacional</h3>
            <p>Plano focado para instituições de ensino que desejam melhorar seu ambiente de ensino e aprendizagem, oferecendo uma plataforma completa para seus alunos e professores.</p>
            <span className="plano-btn-off">Recurso não implementado para essa apresentação</span>
          </article>
        </section>

        {courses.length > 0 && (
          <section className="cursos-catalogo">
            <div className="cursos-catalogo-header">
              <h2>Cursos disponíveis</h2>
              <p>Explore o catálogo de cursos da plataforma.</p>
            </div>
            <div className="cursos-grid">
              {courses.map(c => (
                <div className="curso-card-landing" key={c.id}>
                  <div className="curso-card-placeholder-landing">
                    <span>{c.topicInitial}</span>
                  </div>
                  <h3>{c.name}</h3>
                  <p>{c.topic}</p>
                  <span className="curso-card-meta">{c.lessonCount} aula{c.lessonCount !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="apresentacao">
          <div className="apresentacao-fotos">
            <div className="apresentacao-foto">
              <img src="/assets/fotos/c1.jpg" alt="Curso 1" />
            </div>
            <div className="apresentacao-foto apresentacao-foto-center">
              <img src="/assets/fotos/c2.jpg" alt="Curso 2" />
            </div>
            <div className="apresentacao-foto">
              <img src="/assets/fotos/c3.jpg" alt="Curso 3" />
            </div>
          </div>
          <div className="apres-label">Projeto Acadêmico · Apresentação</div>
          <h2>Site fictício com intuito educacional sobre o projeto EducaInclui Pascal, utilizado como base para apresentação das disciplinas AEP, FrontEnd, APOO e Mentalidade Criativa</h2>
          <p>
            Em nossa plataforma, os usuários podem criar e compartilhar seus próprios cursos, além de acessar uma ampla variedade de conteúdos educacionais em diversas áreas do conhecimento. Com uma interface intuitiva e recursos interativos, nosso site oferece uma experiência de aprendizado envolvente e personalizada para cada usuário.
          </p>
          <div className="apres-tech-grid">
            <div className="apres-tech-card">
              <span className="apres-tech-icon">{'{ }'}</span>
              <h4>Linguagens</h4>
              <div className="apres-tags">
                <span>HTML5</span><span>CSS3</span><span>JavaScript ES2022+</span>
              </div>
            </div>
            <div className="apres-tech-card">
              <span className="apres-tech-icon">⬡</span>
              <h4>APIs do Navegador</h4>
              <div className="apres-tags">
                <span>localStorage</span><span>IndexedDB</span><span>Blob URL API</span><span>File API</span>
              </div>
            </div>
            <div className="apres-tech-card">
              <span className="apres-tech-icon">▣</span>
              <h4>Estrutura de Dados</h4>
              <div className="apres-tags"><span>Fila (Queue — FIFO)</span></div>
              <p className="apres-tech-desc">Usada para controlar a ordem de liberação das perguntas conforme o vídeo avança.</p>
            </div>
            <div className="apres-tech-card">
              <span className="apres-tech-icon">◈</span>
              <h4>Arquitetura</h4>
              <div className="apres-tags">
                <span>React SPA</span><span>Sem backend</span><span>Persistência Local</span>
              </div>
              <p className="apres-tech-desc">Funciona 100% no navegador com persistência via localStorage e IndexedDB.</p>
            </div>
            <div className="apres-tech-card">
              <span className="apres-tech-icon">◻</span>
              <h4>Layout &amp; Estilo</h4>
              <div className="apres-tags">
                <span>CSS Grid</span><span>CSS Flexbox</span><span>CSS Custom Properties</span><span>Responsivo</span>
              </div>
            </div>
            <div className="apres-tech-card apres-tech-card-highlight">
              <span className="apres-tech-icon">✦</span>
              <h4>Disciplinas Relacionadas</h4>
              <div className="apres-tags">
                <span>AEP</span><span>FrontEnd</span><span>APOO</span><span>Mentalidade Criativa</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {modalType && (
        <div
          className="modal ativo"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="modal-conteudo">
            <button className="modal-fechar" onClick={closeModal}>X</button>
            {modalType === 'login' && <LoginModal onLogin={handleLogin} />}
            {modalType === 'register' && <RegisterModal />}
          </div>
        </div>
      )}
    </div>
  )
}
