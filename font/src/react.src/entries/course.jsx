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
      {courses.length === 0 ? (
        <div className="manage-empty">Nenhum curso adicionado ainda.</div>
      ) : (
        <div className="courses-grid-manage">
          {courses.map(c => (
            <div className="course-manage-card" key={c.id}>
              <div className="dash-course-card">
                {c.photoUrl
                  ? <img src={c.photoUrl} alt={c.name} />
                  : <div className="dash-course-placeholder">{c.topicInitial}</div>
                }
                <div className="dash-course-name">{c.name}</div>
                <div className="course-card-icon-actions">
                  <button className="course-icon-btn course-icon-edit" type="button" title="Editar" onClick={() => window.openManageCourseModal?.(c.id)}><span>✏</span></button>
                  <button className="course-icon-btn course-icon-delete" type="button" title="Deletar" onClick={() => window.deleteCourse?.(c.id)}>🗑</button>
                </div>
              </div>
              <div className="course-manage-footer">
                <span className="course-manage-name">{c.name}</span>
                <div className="course-manage-info">
                  <span className="course-manage-topic">{c.topic}</span>
                  <span className="course-manage-lessons">{c.lessonCount} aula{c.lessonCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="course-manage-actions">
                  <button className="secondary-button" type="button" onClick={() => window.openManageCourseModal?.(c.id)}>Editar</button>
                  <button className="remove-button" type="button" onClick={() => window.deleteCourse?.(c.id)}>Deletar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

createRoot(document.getElementById('courses-app')).render(<CourseList />)
