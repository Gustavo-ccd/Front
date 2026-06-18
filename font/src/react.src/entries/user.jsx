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
    const q = searchQuery.trim()
    const matchesSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      c.topic.toLowerCase().includes(q)
    return matchesTopic && matchesSearch
  })

  return (
    <>
      <section className="search-panel">
        <div className="search-header">
          <h1>Buscar cursos</h1>
          <p>Explore aulas e temas disponíveis na plataforma.</p>
        </div>
        <div className="search-box">
          <div className="search-field">
            <input
              type="search"
              placeholder="Pesquisar cursos, habilidades ou tópicos"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value.toLowerCase())}
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
              <article className="user-course-card" key={c.id}>
                <a href={`/font/pages/html.pages/courseView.html?courseId=${c.id}`} className="user-course-link">
                  <div className="dash-course-card">
                    {c.photoUrl
                      ? <img src={c.photoUrl} alt={c.name} />
                      : <div className="dash-course-placeholder">{c.topicInitial}</div>
                    }
                    <div className="dash-course-name">{c.name}</div>
                  </div>
                </a>
                <div className="user-course-footer">
                  <div className="user-course-meta">
                    <span className="user-course-topic">{c.topic}</span>
                    <span className="user-course-lessons">{c.lessonCount} aula{c.lessonCount !== 1 ? 's' : ''}</span>
                  </div>
                  <a href={`/font/pages/html.pages/courseView.html?courseId=${c.id}`} className="user-course-btn">Ver curso</a>
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
