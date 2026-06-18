import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { getAll } from '../../js.src/api/courses'

function AdminApp() {
  const [courses, setCourses] = useState([])

  useEffect(() => {
    getAll().then(({ data }) => setCourses(data || []))
  }, [])

  const totalLessons = courses.reduce((acc, c) => acc + c.lessonCount, 0)

  return (
    <>
      <section className="dashboard-summary">
        <div className="dashboard-card">
          <span className="card-label">Total de cursos</span>
          <strong>{courses.length}</strong>
        </div>
        <div className="dashboard-card">
          <span className="card-label">Total de aulas</span>
          <strong>{totalLessons}</strong>
        </div>
      </section>

      <div className="courses-section-container">
        <section className="top-courses">
          <div className="top-courses-header">
            <h2>Cursos cadastrados</h2>
            <a href="/font/pages/html.pages/course.html" className="dash-link">Gerenciar cursos</a>
          </div>
          <div className="dash-courses-grid">
            {courses.length === 0 ? (
              <p className="dash-empty">
                Nenhum curso cadastrado ainda.{' '}
                <a href="/font/pages/html.pages/course.html">Adicionar curso</a>
              </p>
            ) : (
              courses.map(c => (
                <div className="dash-course-card" key={c.id}>
                  {c.photoUrl
                    ? <img src={c.photoUrl} alt={c.name} />
                    : <div className="dash-course-placeholder">{c.topicInitial}</div>
                  }
                  <div className="dash-course-name">{c.name}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  )
}

createRoot(document.getElementById('admin-app')).render(<AdminApp />)


