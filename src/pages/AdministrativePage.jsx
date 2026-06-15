import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../css/administrative.css'
import CoursesDB from '../lib/CoursesDB'
import Session from '../lib/Session'

export default function AdministrativePage() {
  const [courses, setCourses] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setCourses(CoursesDB.load())
  }, [])

  function handleLogout() {
    Session.clear()
    navigate('/')
  }

  const totalLessons = courses.reduce((acc, c) => acc + c.lessonCount, 0)

  return (
    <div className="page">
      <div className="admin-dashboard">
        <aside className="sidebar educacional">
          <div className="sidebar-profile">
            <div className="avatar-column">
              <div className="avatar">A</div>
              <span className="profile-plan">Plano educacional</span>
            </div>
            <div className="profile-info">
              <strong>Escola</strong>
              <span className="profile-role">Administrador</span>
            </div>
          </div>

          <div className="sidebar-body">
            <nav className="sidebar-nav">
              <Link to="/admin" className="active">
                <span className="nav-icon nav-icon-dashboard"></span>Dashboard
              </Link>
              <Link to="/admin/courses">
                <span className="nav-icon nav-icon-courses"></span>Meu cursos
              </Link>
            </nav>
            <div className="sidebar-bottom">
              <a href="#" className="logout-link" onClick={e => { e.preventDefault(); handleLogout() }}>
                <span className="nav-icon nav-icon-logout"></span>Sair
              </a>
            </div>
          </div>
        </aside>

        <main className="admin-main">
          <section className="admin-header">
            <h1>Dashboard</h1>
            <p>Visão geral dos cursos e conteúdos cadastrados na plataforma.</p>
          </section>

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

          <section className="top-courses">
            <div className="top-courses-header">
              <h2>Cursos cadastrados</h2>
              <Link to="/admin/courses" className="dash-link">Gerenciar cursos</Link>
            </div>
            <div className="top-courses-list">
              {courses.length === 0 ? (
                <p className="dash-empty">
                  Nenhum curso cadastrado ainda.{' '}
                  <Link to="/admin/courses">Adicionar curso</Link>
                </p>
              ) : (
                courses.map((c, i) => (
                  <div className="top-course-item" key={c.id}>
                    <span>{i + 1}. {c.name}</span>
                    <span>{c.topic}</span>
                    <span>{c.lessonCount} aula{c.lessonCount !== 1 ? 's' : ''}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
