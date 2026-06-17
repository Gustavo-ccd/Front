import { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { getAll } from '../../js.src/api/courses'

function CourseList() {
  const [courses, setCourses] = useState([])

  const loadCourses = useCallback(() => {
    getAll().then(({ data }) => setCourses(data || []))
  }, [])

  useEffect(() => {
    loadCourses()
    window.__refreshCourseList = loadCourses
    return () => { delete window.__refreshCourseList }
  }, [loadCourses])

  return (
    <section className="courses-panel">
      <div className="courses-actions">
        <button className="primary-button" type="button" onClick={() => window.openAddCourseModal?.()}>
          Adicionar novo curso
        </button>
      </div>
      <div className="courses-box">
        <div className="courses-table">
          <div className="courses-table-header">
            <span>Curso</span>
            <span>Tópico</span>
            <span>Aulas</span>
            <span>Ações</span>
          </div>
          {courses.length === 0 ? (
            <div className="manage-empty" style={{ padding: '20px 0' }}>Nenhum curso adicionado ainda.</div>
          ) : (
            courses.map(c => (
              <div className="courses-row" key={c.id}>
                <span>{c.name}</span>
                <span>{c.topic}</span>
                <span>{c.lessonCount}</span>
                <div className="courses-row-actions">
                  <button className="secondary-button" type="button" onClick={() => window.openManageCourseModal?.(c.id)}>Editar</button>
                  <button className="remove-button" type="button" onClick={() => window.deleteCourse?.(c.id)}>Deletar</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

createRoot(document.getElementById('courses-app')).render(<CourseList />)
