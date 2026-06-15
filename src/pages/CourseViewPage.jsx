import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import '../css/course-view.css'
import { getAll } from '../api/courses'
import { getVideo } from '../api/videos'
import { getNote, saveNote } from '../api/notes'
import { getDone, markDone } from '../api/progress'
import Queue from '../lib/Queue'
import Question from '../models/Question'

// ── Gabarito panel ─────────────────────────────────────────────────────────────
function GabaritoPanel({ lesson, displayedCount }) {
  const [revealed, setRevealed] = useState({})

  useEffect(() => { setRevealed({}) }, [lesson])

  if (!lesson) return null
  const qs = lesson.questions

  if (!qs?.length) return <p className="cv-questions-hint">Nenhuma pergunta nesta aula.</p>

  return (
    <div className="cv-gabarito-list">
      {qs.map((raw, i) => {
        const q = raw instanceof Question ? raw : Question.fromRaw(raw)
        const shown = i < displayedCount
        let answerContent

        if (q.isFechada && q.options?.length) {
          const idx = q.correta
          answerContent = `${'ABCD'[idx] || '?'}) ${q.options[idx] || '—'}`
        } else if (q.gabarito) {
          answerContent = q.gabarito
        } else {
          answerContent = 'Gabarito não informado'
        }

        return (
          <div className="cv-gab-item" key={i}>
            <p className="cv-gab-q"><strong>{i + 1}.</strong> {q.text}</p>
            {shown ? (
              <>
                <button
                  className={`cv-gab-reveal-btn${revealed[i] ? ' active' : ''}`}
                  type="button"
                  onClick={() => setRevealed(r => ({ ...r, [i]: !r[i] }))}
                >
                  {revealed[i] ? 'Ocultar' : 'Ver resposta'}
                </button>
                {revealed[i] && <div className="cv-gab-answer">{answerContent}</div>}
              </>
            ) : (
              <span className="cv-gab-locked">Responda a pergunta no vídeo para desbloquear</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Question overlay ──────────────────────────────────────────────────────────
function QuestionOverlay({ q, num, onClose, onVideoPlay }) {
  const [selectedOption, setSelectedOption] = useState(-1)
  const [answered, setAnswered] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [gabarito, setGabarito] = useState(null)
  const [textAnswer, setTextAnswer] = useState('')

  function handleSubmit() {
    if (answered) { onClose(); return }
    setAnswered(true)

    if (q.isFechada) {
      const correct = selectedOption === q.correta
      setFeedback({
        text: correct
          ? '✓ Resposta correta!'
          : `✗ Incorreto. A resposta correta era: ${'ABCD'[q.correta]} — ${q.options[q.correta]}`,
        type: correct ? 'correct' : 'wrong',
      })
    } else {
      setFeedback({
        text: textAnswer.trim() ? 'Resposta registrada!' : 'Nenhuma resposta digitada.',
        type: 'neutral',
      })
      if (q.gabarito) setGabarito(q.gabarito)
    }
  }

  return (
    <div className="cv-q-overlay" style={{ display: 'flex' }}>
      <div className="cv-q-modal">
        <div className="cv-q-modal-header">
          <span className="cv-q-modal-badge">Pergunta {num}</span>
        </div>
        <p className="cv-q-modal-text">{q.text}</p>

        {q.isFechada ? (
          <div className="cv-q-modal-options">
            {q.options.map((opt, i) => (
              <label
                key={i}
                className={[
                  'cv-q-modal-option',
                  !answered && selectedOption === i ? 'selected' : '',
                  answered && i === q.correta ? 'correct' : '',
                  answered && i === selectedOption && i !== q.correta ? 'wrong' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => { if (!answered) setSelectedOption(i) }}
              >
                <input type="radio" name="cvqopt" value={i} readOnly checked={selectedOption === i} style={{ display: 'none' }} />
                <span className="cv-opt-letter">{'ABCD'[i]}</span>
                <span>{opt}</span>
              </label>
            ))}
          </div>
        ) : (
          <textarea
            className="cv-q-modal-textarea"
            placeholder="Digite sua resposta..."
            value={textAnswer}
            onChange={e => setTextAnswer(e.target.value)}
            disabled={answered}
          />
        )}

        {feedback && (
          <div className={`cv-q-feedback ${feedback.type}`}>{feedback.text}</div>
        )}
        {gabarito && (
          <div className="cv-q-gabarito">
            <span className="cv-q-gabarito-label">Gabarito:</span> {gabarito}
          </div>
        )}

        <div className="cv-q-modal-actions">
          <button className="cv-q-skip" onClick={onClose}>Pular</button>
          <button
            className="cv-q-submit"
            onClick={handleSubmit}
            disabled={q.isFechada && !answered && selectedOption === -1}
          >
            {answered ? 'Continuar →' : 'Responder'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main CourseViewPage ───────────────────────────────────────────────────────
export default function CourseViewPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayedQs, setDisplayedQs] = useState([])
  const [queueSize, setQueueSize] = useState(0)
  const [questionsHint, setQuestionsHint] = useState('As perguntas serão liberadas conforme o vídeo avança.')
  const [videoSrc, setVideoSrc] = useState(null)
  const [notepad, setNotepad] = useState('')
  const [savedIndicator, setSavedIndicator] = useState(false)
  const [activeTab, setActiveTab] = useState('questions')
  const [doneSet, setDoneSet] = useState(new Set())
  const [overlayData, setOverlayData] = useState(null)
  const [displayedCount, setDisplayedCount] = useState(0)

  // Refs for event-handler access (avoid stale closures)
  const videoRef = useRef(null)
  const questionQueueRef = useRef(new Queue())
  const thresholdsRef = useRef([])
  const blobUrlRef = useRef(null)
  const saveTimerRef = useRef(null)
  const unlockedCountRef = useRef(0)
  const overlayPendingRef = useRef([])
  const overlayOpenRef = useRef(false)
  const courseRef = useRef(null)
  const currentIndexRef = useRef(0)

  // Load course once
  useEffect(() => {
    getAll().then(({ data: courses }) => {
      const found = (courses || []).find(c => c.id === Number(courseId))
      if (!found) { setNotFound(true); return }
      courseRef.current = found
      setCourse(found)
      getDone(found.id).then(({ data }) => setDoneSet(data || new Set()))
    })
  }, [courseId])

  // Build thresholds
  function buildThresholds(count) {
    if (!count) return []
    if (count === 1) return [0.45]
    const step = 0.65 / (count - 1)
    return Array.from({ length: count }, (_, i) => 0.2 + step * i)
  }

  // Show next overlay from queue
  const showNextOverlay = useCallback(() => {
    if (!overlayPendingRef.current.length) {
      overlayOpenRef.current = false
      videoRef.current?.play()
      return
    }
    overlayOpenRef.current = true
    const next = overlayPendingRef.current.shift()
    videoRef.current?.pause()
    setOverlayData(next)
  }, [])

  // Handle overlay close (called from overlay)
  function handleOverlayClose() {
    setOverlayData(null)
    overlayOpenRef.current = false
    showNextOverlay()
  }

  // Video timeupdate
  const onVideoTimeUpdate = useCallback(() => {
    const queue = questionQueueRef.current
    if (queue.isEmpty()) return
    const video = videoRef.current
    if (!video || !video.duration || !isFinite(video.duration)) return
    const pct = video.currentTime / video.duration
    const thresholds = thresholdsRef.current

    while (
      unlockedCountRef.current < thresholds.length &&
      pct >= thresholds[unlockedCountRef.current]
    ) {
      const q = queue.dequeue()
      unlockedCountRef.current++
      const num = unlockedCountRef.current
      setDisplayedQs(prev => [...prev, q])
      setDisplayedCount(prev => prev + 1)
      setQueueSize(queue.size)
      overlayPendingRef.current.push({ q, num })
      if (!overlayOpenRef.current) showNextOverlay()
    }

    if (queue.isEmpty() && unlockedCountRef.current > 0) {
      setQuestionsHint('Todas as perguntas foram liberadas!')
    }
  }, [showNextOverlay])

  // Video ended
  const onVideoEnded = useCallback(async () => {
    const c = courseRef.current
    if (!c) return
    const lesson = c.lessons[currentIndexRef.current]
    const { data: done } = await markDone(c.id, lesson.id)
    setDoneSet(done || new Set())
  }, [])

  // Load lesson effect
  useEffect(() => {
    if (!course) return

    currentIndexRef.current = currentIndex
    const lesson = course.lessons[currentIndex]

    // Reset overlay state
    overlayPendingRef.current = []
    overlayOpenRef.current = false
    setOverlayData(null)

    // Reset question queue
    questionQueueRef.current.clear()
    unlockedCountRef.current = 0
    setDisplayedQs([])
    setDisplayedCount(0)
    setQueueSize(0)

    // Reset video
    const video = videoRef.current
    if (video) {
      video.pause()
      video.src = ''
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    setVideoSrc(null)

    if (!lesson) return

    // Set questions hint
    setQuestionsHint(lesson.questionCount
      ? 'As perguntas serão liberadas conforme o vídeo avança.'
      : 'Nenhuma pergunta nesta aula.'
    )

    // Build queue & thresholds
    thresholdsRef.current = buildThresholds(lesson.questionCount)
    lesson.questions.forEach(q => questionQueueRef.current.enqueue(
      q instanceof Question ? q : Question.fromRaw(q)
    ))
    setQueueSize(questionQueueRef.current.size)

    // Load video
    if (lesson.hasVideo) {
      getVideo(`lesson_${lesson.id}`).then(({ data: blob }) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url
        setVideoSrc(url)
        if (videoRef.current) {
          videoRef.current.src = url
          videoRef.current.load()
        }
      })
    }

    // Load notepad
    getNote(course.id, lesson.id).then(({ data }) => setNotepad(data || ''))
    setSavedIndicator(false)

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [currentIndex, course])

  // Attach video event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.addEventListener('timeupdate', onVideoTimeUpdate)
    video.addEventListener('ended', onVideoEnded)
    return () => {
      video.removeEventListener('timeupdate', onVideoTimeUpdate)
      video.removeEventListener('ended', onVideoEnded)
    }
  }, [onVideoTimeUpdate, onVideoEnded])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current)
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  function handleNotepadChange(value) {
    setNotepad(value)
    setSavedIndicator(false)
    clearTimeout(saveTimerRef.current)
    const c = courseRef.current
    if (!c) return
    const lesson = c.lessons[currentIndexRef.current]
    if (!lesson) return
    saveTimerRef.current = setTimeout(() => {
      saveNote(c.id, lesson.id, value).then(() => setSavedIndicator(true))
    }, 700)
  }

  if (notFound) {
    return (
      <div style={{ padding: '40px', color: '#e6edf3' }}>
        Curso não encontrado.{' '}
        <Link to="/user" style={{ color: '#00c8a0' }}>← Voltar</Link>
      </div>
    )
  }

  if (!course) return null

  const lesson = course.lessons[currentIndex] || null

  return (
    <>
      <div className="cv-layout">
        {/* ── Left sidebar: lesson list ─────────────────────────────── */}
        <aside className="cv-sidebar">
          <div className="cv-sidebar-top">
            <Link to="/user" className="cv-back">← Voltar</Link>
            <h2 className="cv-course-title">{course.name}</h2>
          </div>
          <ul className="cv-lesson-list">
            {course.lessons.length === 0 ? (
              <li className="cv-lesson-empty">Nenhuma aula cadastrada.</li>
            ) : (
              course.lessons.map((l, i) => {
                const isDone = doneSet.has(l.id)
                const isActive = i === currentIndex
                return (
                  <li
                    key={l.id}
                    className={`cv-lesson-item${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
                    onClick={() => setCurrentIndex(i)}
                  >
                    <span className="cv-lesson-num">{isDone ? '✓' : i + 1}</span>
                    <span className="cv-lesson-name">{l.name}</span>
                  </li>
                )
              })
            )}
          </ul>
        </aside>

        {/* ── Center: video player ──────────────────────────────────── */}
        <main className="cv-main">
          <div className="cv-video-header">
            <h3>{lesson ? lesson.name : 'Selecione uma aula'}</h3>
            <button
              className="cv-next-btn"
              type="button"
              disabled={!lesson || currentIndex >= course.lessons.length - 1}
              onClick={() => setCurrentIndex(i => i + 1)}
            >
              Próxima aula →
            </button>
          </div>
          <div className="cv-video-wrap">
            <div className="cv-video-box">
              <video
                ref={videoRef}
                controls
                style={{ display: videoSrc ? 'block' : 'none', width: '100%', height: '100%' }}
              />
              <div className="cv-no-video" style={{ display: videoSrc ? 'none' : 'flex' }}>
                <span>▶</span>
                <p>Nenhum vídeo disponível para esta aula</p>
              </div>
            </div>
          </div>
          {lesson && <p className="cv-lesson-desc">{lesson.desc}</p>}
        </main>

        {/* ── Right sidebar: tabs ───────────────────────────────────── */}
        <aside className="cv-right">
          <div className="cv-tabs">
            {[
              { id: 'questions', label: 'Perguntas', badge: queueSize },
              { id: 'notes', label: 'Anotações' },
              { id: 'gabarito', label: 'Gabarito' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`cv-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="cv-tab-badge">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'questions' && (
            <div className="cv-tab-panel">
              <p className="cv-questions-hint">{questionsHint}</p>
              <div className="cv-questions-list">
                {displayedQs.map((q, i) => (
                  <div className="cv-question-item" key={i}>
                    <span className="cv-question-num">{i + 1}</span>
                    <p>{q.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="cv-tab-panel">
              <div className="cv-notepad-top">
                <span className="cv-saved-indicator" style={{ opacity: savedIndicator ? 1 : 0 }}>
                  salvo ✓
                </span>
              </div>
              <textarea
                className="cv-notepad"
                placeholder="Faça suas anotações aqui. Elas ficam salvas por aula."
                value={notepad}
                onChange={e => handleNotepadChange(e.target.value)}
              />
            </div>
          )}

          {activeTab === 'gabarito' && (
            <div className="cv-tab-panel">
              <GabaritoPanel lesson={lesson} displayedCount={displayedCount} />
            </div>
          )}
        </aside>
      </div>

      {/* ── Question overlay ──────────────────────────────────────── */}
      {overlayData && (
        <QuestionOverlay
          q={overlayData.q}
          num={overlayData.num}
          onClose={handleOverlayClose}
        />
      )}
    </>
  )
}
