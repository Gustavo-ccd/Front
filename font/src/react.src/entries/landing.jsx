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
      <div className="dash-courses-grid">
        {courses.map(c => (
          <div className="dash-course-card" key={c.id}>
            {c.photoUrl
              ? <img src={c.photoUrl} alt={c.name} />
              : <div className="dash-course-placeholder">{c.topicInitial}</div>
            }
            <div className="dash-course-name">{c.name}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

const catalogEl = document.getElementById('courses-catalog')
if (catalogEl) createRoot(catalogEl).render(<CourseCatalog />)
