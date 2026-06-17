import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { getAll } from '../../js.src/api/courses'

function CourseCatalog() {
  const [courses, setCourses] = useState([])

  useEffect(() => {
    getAll().then(({ data }) => setCourses(data || []))
  }, [])

  if (!courses.length) return null

  return (
    <section className="cursos-catalogo">
      <div className="cursos-catalogo-header">
        <h2>Cursos disponíveis</h2>
        <p>Explore o catálogo de cursos da plataforma.</p>
      </div>
      <div className="cursos-grid">
        {courses.map(c => (
          <div className="curso-card-landing" key={c.id}>
            {c.photoUrl ? (
              <img src={c.photoUrl} alt={c.name} className="curso-card-img-landing" />
            ) : (
              <div className="curso-card-placeholder-landing">
                <span>{c.topicInitial}</span>
              </div>
            )}
            <h3>{c.name}</h3>
            <p>{c.topic}</p>
            <span className="curso-card-meta">{c.lessonCount} aula{c.lessonCount !== 1 ? 's' : ''}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

const catalogEl = document.getElementById('courses-catalog')
if (catalogEl) createRoot(catalogEl).render(<CourseCatalog />)

