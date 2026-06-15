import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../css/administrative.css'
import { getAll, create, remove, addLesson, updateLesson, removeLesson } from '../api/courses'
import { logout } from '../api/auth'
import Question from '../models/Question'

// ── Question item inside lesson form ──────────────────────────────────────────
function QuestionItem({ num, q, onChange, onRemove }) {
  return (
    <div className="question-item">
      <div className="question-header-row">
        <span className="question-label">{num}ª pergunta</span>
        <button className="question-remove" type="button" aria-label="Remover" onClick={onRemove}>×</button>
      </div>
      <div className="question-row">
        <input
          className="question-input"
          type="text"
          value={q.text}
          placeholder="Digite a pergunta"
          onChange={e => onChange({ text: e.target.value })}
        />
      </div>
      <div className="question-type-row">
        <button
          type="button"
          className={`qtype-btn${q.type === 'aberta' ? ' active' : ''}`}
          onClick={() => onChange({ type: 'aberta' })}
        >Aberta</button>
        <button
          type="button"
          className={`qtype-btn${q.type === 'fechada' ? ' active' : ''}`}
          onClick={() => onChange({ type: 'fechada' })}
        >Fechada</button>
      </div>

      {q.type === 'aberta' && (
        <div className="question-gabarito-block">
          <span className="gabarito-field-label">Resposta esperada (gabarito)</span>
          <textarea
            className="gabarito-input"
            placeholder="Digite a resposta que será exibida ao aluno como referência..."
            value={q.gabarito}
            onChange={e => onChange({ gabarito: e.target.value })}
          />
        </div>
      )}

      {q.type === 'fechada' && (
        <div className="question-options-block" style={{ display: 'flex' }}>
          {['A', 'B', 'C', 'D'].map((letter, i) => (
            <label className="question-option-row" key={i}>
              <input
                type="radio"
                name={`qcorreta_${q._id}`}
                value={i}
                checked={q.correta === i}
                onChange={() => onChange({ correta: i })}
                title="Marcar como correta"
                style={{ accentColor: 'var(--accent)', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }}
              />
              <span className="option-letter">{letter}</span>
              <input
                type="text"
                className="option-input"
                value={q.options[i] || ''}
                placeholder={`Opção ${letter}`}
                onChange={e => {
                  const opts = [...q.options]
                  opts[i] = e.target.value
                  onChange({ options: opts })
                }}
              />
            </label>
          ))}
          <p className="option-hint">Selecione o marcador para indicar a resposta correta.</p>
        </div>
      )}
    </div>
  )
}

// ── Add Course Modal ──────────────────────────────────────────────────────────
function AddCourseModal({ onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [topic, setTopic] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const imageInputRef = useRef(null)

  function handleImageChange(e) {
    const file = e.target.files[0] || null
    setImageFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !topic.trim()) return
    await onSubmit(name.trim(), topic.trim(), imageFile)
  }

  return (
    <div className="modal modal-active" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content" role="dialog" aria-modal="true">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar">&times;</button>
        <h2>Adicionar novo curso</h2>
        <form className="course-form" onSubmit={handleSubmit} noValidate>
          <label>
            Nome do curso
            <input type="text" placeholder="Digite o nome do curso" value={name} onChange={e => setName(e.target.value)} />
          </label>
          <label>
            Tópico
            <input type="text" placeholder="Ex: Web, Design, Marketing" value={topic} onChange={e => setTopic(e.target.value)} />
          </label>
          <div className="file-input-field">
            <span className="file-input-label">Foto do curso (opcional)</span>
            <div className="file-input-wrap">
              <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageChange} />
              <button type="button" className="file-btn" onClick={() => imageInputRef.current?.click()}>Escolher arquivo</button>
              <span className="file-name-display">{imageFile ? imageFile.name : 'Nenhum arquivo escolhido'}</span>
            </div>
          </div>
          {previewUrl && (
            <div className="course-image-preview" style={{ display: 'flex' }}>
              <img src={previewUrl} alt="Preview" />
            </div>
          )}
          <div className="form-actions">
            <button className="primary-button" type="submit">Adicionar curso</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Manage Course Modal ───────────────────────────────────────────────────────
function ManageCourseModal({ course, onClose, onAddLesson, onEditLesson, onDeleteLesson }) {
  return (
    <div className="modal modal-active" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content modal-content-lg" role="dialog" aria-modal="true">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar">&times;</button>
        <h2>{course.name}</h2>
        <div className="manage-course-body">
          <div className="manage-section-header">
            <span className="manage-section-label">Aulas</span>
            <button className="primary-button" type="button" onClick={onAddLesson}>Adicionar aula</button>
          </div>
          <div className="manage-lessons-list">
            {course.lessons.length === 0 ? (
              <p className="manage-empty">Nenhuma aula adicionada ainda.</p>
            ) : (
              course.lessons.map((l, i) => (
                <div className="lesson-item" key={l.id}>
                  <div className="lesson-item-info">
                    <span className="lesson-number">{i + 1}.</span>
                    <div>
                      <span>{l.name}</span>
                      {l.hasVideo && (
                        <span className="lesson-video-badge">{l.videoName}</span>
                      )}
                    </div>
                  </div>
                  <div className="lesson-item-actions">
                    <button className="secondary-button" type="button" onClick={() => onEditLesson(l.id)}>Editar</button>
                    <button className="remove-button" type="button" onClick={() => onDeleteLesson(l.id)}>Remover</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Lesson Modal ──────────────────────────────────────────────────────────────
function LessonModal({ lesson, onClose, onSubmit }) {
  const isEditing = Boolean(lesson)
  const [name, setName] = useState(lesson ? lesson.name : '')
  const [desc, setDesc] = useState(lesson ? lesson.desc : '')
  const [videoFile, setVideoFile] = useState(null)
  const [questions, setQuestions] = useState(() => {
    if (!lesson?.questions.length) return []
    return lesson.questions.map((q, i) => ({
      _id: i + 1,
      text: q.text,
      type: q.type,
      options: q.options.length ? [...q.options] : ['', '', '', ''],
      correta: q.correta,
      gabarito: q.gabarito || '',
    }))
  })
  const qCounterRef = useRef(lesson?.questions.length || 0)
  const videoInputRef = useRef(null)

  function addQuestion() {
    const id = ++qCounterRef.current
    setQuestions(prev => [...prev, { _id: id, text: '', type: 'aberta', options: ['', '', '', ''], correta: 0, gabarito: '' }])
  }

  function removeQuestion(id) {
    setQuestions(prev => prev.filter(q => q._id !== id))
  }

  function updateQuestion(id, updates) {
    setQuestions(prev => prev.map(q => q._id === id ? { ...q, ...updates } : q))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const collectedQuestions = questions
      .filter(q => q.text.trim())
      .map(q => new Question({
        text: q.text,
        type: q.type,
        options: q.type === 'fechada' ? q.options : [],
        correta: q.type === 'fechada' ? q.correta : -1,
        gabarito: q.type === 'aberta' ? q.gabarito : '',
      }))
    await onSubmit({ name: name.trim(), desc: desc.trim(), videoFile, questions: collectedQuestions })
  }

  return (
    <div className="modal modal-top modal-active" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content modal-content-lg" role="dialog" aria-modal="true">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar">&times;</button>
        <h2>{isEditing ? 'Editar aula' : 'Adicionar aula'}</h2>
        <form className="course-form" onSubmit={handleSubmit} noValidate>
          <label>
            Nome da aula
            <input type="text" placeholder="Digite o nome da aula" value={name} onChange={e => setName(e.target.value)} />
          </label>
          <label>
            Descrição
            <textarea placeholder="Descreva o conteúdo desta aula" value={desc} onChange={e => setDesc(e.target.value)} />
          </label>
          <div className="file-input-field">
            <span className="file-input-label">Vídeo da aula (.mp4)</span>
            <div className="file-input-wrap">
              <input type="file" ref={videoInputRef} accept=".mp4,video/mp4" onChange={e => setVideoFile(e.target.files[0] || null)} />
              <button type="button" className="file-btn" onClick={() => videoInputRef.current?.click()}>Escolher arquivo</button>
              <span className="file-name-display">{videoFile ? videoFile.name : 'Nenhum arquivo escolhido'}</span>
            </div>
          </div>
          {isEditing && lesson.hasVideo && !videoFile && (
            <p className="video-current-hint">Vídeo atual: {lesson.videoName}</p>
          )}

          <div className="questions-section">
            <div className="manage-section-header">
              <span className="manage-section-label">Perguntas</span>
              <button className="add-question-btn" type="button" title="Adicionar pergunta" onClick={addQuestion}>+</button>
            </div>
            <div className="questions-list">
              {questions.length === 0
                ? <p className="manage-empty">Nenhuma pergunta adicionada.</p>
                : questions.map((q, i) => (
                  <QuestionItem
                    key={q._id}
                    num={i + 1}
                    q={q}
                    onRemove={() => removeQuestion(q._id)}
                    onChange={updates => updateQuestion(q._id, updates)}
                  />
                ))
              }
            </div>
          </div>

          <div className="form-actions">
            <button className="primary-button" type="submit">Salvar aula</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main CoursesPage ──────────────────────────────────────────────────────────
export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [managingCourseId, setManagingCourseId] = useState(null)
  const [editingLessonId, setEditingLessonId] = useState(null)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getAll().then(({ data }) => setCourses(data || []))
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  // ── Course CRUD ──────────────────────────────────────────────────────────────
  async function handleAddCourse(name, topic, imageFile) {
    const { data: newCourse } = await create(name, topic, imageFile)
    if (newCourse) setCourses(prev => [...prev, newCourse])
    setShowAddCourse(false)
  }

  async function handleDeleteCourse(courseId) {
    await remove(courseId)
    setCourses(prev => prev.filter(c => c.id !== courseId))
  }

  // ── Lesson CRUD ──────────────────────────────────────────────────────────────
  async function handleSaveLesson({ name, desc, videoFile, questions }) {
    const payload = { name, desc, videoFile, questions }
    const { data: updatedCourse } = editingLessonId
      ? await updateLesson(managingCourseId, editingLessonId, payload)
      : await addLesson(managingCourseId, payload)
    if (updatedCourse) setCourses(prev => prev.map(c => c.id === managingCourseId ? updatedCourse : c))
    setShowLessonModal(false)
    setEditingLessonId(null)
  }

  async function handleDeleteLesson(lessonId) {
    const { data: updatedCourse } = await removeLesson(managingCourseId, lessonId)
    if (updatedCourse) setCourses(prev => prev.map(c => c.id === managingCourseId ? updatedCourse : c))
  }

  const managingCourse = courses.find(c => Number(c.id) === Number(managingCourseId)) || null
  const editingLesson = managingCourse?.lessons.find(l => Number(l.id) === Number(editingLessonId)) || null

  return (
    <div className="page">
      <div className="admin-dashboard">
        <aside className="sidebar profissional">
          <div className="sidebar-profile">
            <div className="avatar-column">
              <div className="avatar">A</div>
            </div>
            <div className="profile-info">
              <strong>Escola</strong>
              <span className="profile-role">Administrador</span>
            </div>
          </div>

          <div className="sidebar-body">
            <nav className="sidebar-nav">
              <Link to="/admin"><span className="nav-icon nav-icon-dashboard"></span>Dashboard</Link>
              <Link to="/admin/courses" className="active"><span className="nav-icon nav-icon-courses"></span>Meu cursos</Link>
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
            <h1>Meus cursos</h1>
            <p>Gerencie os cursos disponíveis para os alunos e atualize as informações ou conteúdo sempre que precisar.</p>
          </section>

          <section className="courses-panel">
            <div className="courses-actions">
              <button className="primary-button" type="button" onClick={() => setShowAddCourse(true)}>
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
                        <button className="secondary-button" type="button" onClick={() => setManagingCourseId(Number(c.id))}>Editar</button>
                        <button className="remove-button" type="button" onClick={() => handleDeleteCourse(Number(c.id))}>Deletar</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </main>
      </div>

      {showAddCourse && (
        <AddCourseModal
          onClose={() => setShowAddCourse(false)}
          onSubmit={handleAddCourse}
        />
      )}

      {managingCourse && !showLessonModal && (
        <ManageCourseModal
          course={managingCourse}
          onClose={() => setManagingCourseId(null)}
          onAddLesson={() => { setEditingLessonId(null); setShowLessonModal(true) }}
          onEditLesson={id => { setEditingLessonId(id); setShowLessonModal(true) }}
          onDeleteLesson={handleDeleteLesson}
        />
      )}

      {showLessonModal && (
        <LessonModal
          lesson={editingLesson}
          onClose={() => { setShowLessonModal(false); setEditingLessonId(null) }}
          onSubmit={handleSaveLesson}
        />
      )}
    </div>
  )
}
