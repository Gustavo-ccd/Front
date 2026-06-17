import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { getAll } from '../../js.src/api/courses'

function UserApp() {
  const [courses, setCourses] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    getAll().then(({ data }) => setCourses(data || []))
  }, [])

  const topics = [...new Set(courses.map(c => c.topic))]

  const filtered = courses.filter(c => {
    const matchesTopic = activeFilter === 'all' || c.topic.toLowerCase() === activeFilter.toLowerCase()
    const matchesSearch = !searchQuery ||
      c.name.toLowerCase().includes(searchQuery) ||
      c.topic.toLowerCase().includes(searchQuery)
    return matchesTopic && matchesSearch
  })

  return (
    <>
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
          <button className={activeFilter === 'all' ? 'active' : ''} onClick={() => setActiveFilter('all')}>Todos</button>
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
              <p>{courses.length ? 'Nenhum curso encontrado para essa busca.' : 'Nenhum curso disponível no momento.'}</p>
            </div>
          ) : (
            filtered.map(c => (
              <article className="course-card" key={c.id}>
                {c.photoUrl ? (
                  <img
                    src={c.photoUrl}
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
                  <a href={`/font/pages/html.pages/courseView.html?courseId=${c.id}`}>Ver curso</a>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  )
}

createRoot(document.getElementById('user-app')).render(<UserApp />)


