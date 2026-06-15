import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../css/user.css'
import { getAll } from '../api/courses'
import { getVideo } from '../api/videos'
import { logout } from '../api/auth'

function ProfileModal({ onClose, onLogout }) {
  return (
    <div className="modal ativo" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-conteudo">
        <button className="modal-fechar" onClick={onClose}>X</button>
        <h2 id="modalTitulo">Meu Perfil</h2>
        <div id="modalCorpo">
          <div className="modal-campo">
            <label>Nome:</label>
            <p>Usuário Pascal</p>
          </div>
          <div className="modal-campo">
            <label>E-mail:</label>
            <p>usuario@pascal.com</p>
          </div>
          <button className="modal-botao" onClick={onLogout}>Sair</button>
        </div>
      </div>
    </div>
  )
}

export default function UserPage() {
  const [courses, setCourses] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [courseImages, setCourseImages] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    getAll().then(({ data }) => {
      const list = data || []
      setCourses(list)
      loadCourseImages(list)
    })
  }, [])

  async function loadCourseImages(list) {
    const images = {}
    for (const c of list) {
      const { data: blob } = await getVideo(`course_img_${c.id}`)
      if (blob) images[c.id] = URL.createObjectURL(blob)
    }
    setCourseImages(images)
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const topics = [...new Set(courses.map(c => c.topic))]

  const filtered = courses.filter(c => {
    const matchesTopic = activeFilter === 'all' || c.topic.toLowerCase() === activeFilter.toLowerCase()
    const matchesSearch = !searchQuery ||
      c.name.toLowerCase().includes(searchQuery) ||
      c.topic.toLowerCase().includes(searchQuery)
    return matchesTopic && matchesSearch
  })

  return (
    <div className="page">
      <div className="user-dashboard">
        <aside className="sidebar">
          <div className="sidebar-profile">
            <div className="avatar-column">
              <div className="avatar">U</div>
              <button className="sidebar-profile-button" onClick={() => setShowProfile(true)}>Meu Perfil</button>
            </div>
            <div className="profile-info">
              <strong>Usuário EducaInclui Pascal</strong>
              <span>Olá, bem-vindo</span>
            </div>
          </div>

          <div className="sidebar-body">
            <nav className="sidebar-nav">
              <a href="#" className="active">
                <span className="nav-icon nav-icon-home"></span>Início
              </a>
            </nav>
          </div>
        </aside>

        <main className="search-page">
          <section className="search-panel">
            <div className="search-header">
              <h1>Buscar cursos para sua próxima jornada</h1>
              <p>Explore aulas, trilhas e temas mais procurados na plataforma. Use os filtros abaixo para encontrar rapidamente o que você precisa.</p>
            </div>

            <div className="search-box">
              <div className="search-field">
                <input
                  type="search"
                  placeholder="Pesquisar cursos, habilidades ou tópicos"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value.toLowerCase().trim())}
                />
                <button className="search-button" aria-label="Pesquisar">
                  <span className="search-icon"></span>
                </button>
              </div>
            </div>

            <div className="filter-buttons">
              <button
                className={activeFilter === 'all' ? 'active' : ''}
                onClick={() => setActiveFilter('all')}
              >Todos</button>
              {topics.map(topic => (
                <button
                  key={topic}
                  className={activeFilter === topic ? 'active' : ''}
                  onClick={() => setActiveFilter(topic)}
                >{topic}</button>
              ))}
            </div>
          </section>

          <section className="course-main">
            <div className="course-list">
              {filtered.length === 0 ? (
                <div className="user-empty-state">
                  <p>{courses.length
                    ? 'Nenhum curso encontrado para essa busca.'
                    : 'Nenhum curso disponível no momento.'
                  }</p>
                </div>
              ) : (
                filtered.map(c => (
                  <article className="course-card" key={c.id}>
                    {courseImages[c.id] ? (
                      <img
                        src={courseImages[c.id]}
                        alt={c.name}
                        style={{ width: '100%', height: '144px', objectFit: 'cover', borderRadius: '18px', marginBottom: '20px', border: '1px solid var(--border)', display: 'block' }}
                      />
                    ) : (
                      <div className="course-card-placeholder">
                        <span>{c.topicInitial}</span>
                      </div>
                    )}
                    <h3>{c.name}</h3>
                    <p>{c.topic}</p>
                    <div className="course-meta">
                      <span>{c.lessonCount} aula{c.lessonCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="course-card-footer">
                      <Link to={`/course/${c.id}`}>Ver curso</Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}
