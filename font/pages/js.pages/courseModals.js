import { getAll, create, remove, addLesson, updateLesson, removeLesson } from '/font/src/js.src/api/courses.js'

let currentCourseId = null
let currentLessonId = null
let questions = []
let qCounter = 0

function $(id) { return document.getElementById(id) }
function openModal(id) { $(id).classList.add('modal-active') }
function closeModal(id) { $(id).classList.remove('modal-active') }
function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('modal-active') })
})
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('.modal').classList.remove('modal-active'))
})

// ── Adicionar Curso ──────────────────────────────────────────────────────
window.openAddCourseModal = function () {
  $('add-course-form').reset()
  $('add-course-preview-wrap').style.display = 'none'
  $('add-course-filename').textContent = 'Nenhum arquivo escolhido'
  openModal('add-course-modal')
}

$('add-course-image-btn').addEventListener('click', () => $('add-course-image').click())
$('add-course-image').addEventListener('change', e => {
  const file = e.target.files[0]
  if (file) {
    $('add-course-preview').src = URL.createObjectURL(file)
    $('add-course-preview-wrap').style.display = 'flex'
    $('add-course-filename').textContent = file.name
  } else {
    $('add-course-preview-wrap').style.display = 'none'
    $('add-course-filename').textContent = 'Nenhum arquivo escolhido'
  }
})

$('add-course-form').addEventListener('submit', async e => {
  e.preventDefault()
  const name = $('add-course-name').value.trim()
  const topic = $('add-course-topic').value.trim()
  if (!name || !topic) return
  await create(name, topic, $('add-course-image').files[0] || null)
  closeModal('add-course-modal')
  window.__refreshCourseList?.()
})

// ── Deletar Curso ────────────────────────────────────────────────────────
window.deleteCourse = async function (courseId) {
  await remove(courseId)
  window.__refreshCourseList?.()
}

// ── Gerenciar Curso ──────────────────────────────────────────────────────
window.openManageCourseModal = async function (courseId) {
  currentCourseId = courseId
  const { data: courses } = await getAll()
  const course = (courses || []).find(c => Number(c.id) === Number(courseId))
  if (!course) return
  $('manage-course-title').textContent = course.name
  renderLessonsList(course.lessons)
  openModal('manage-course-modal')
}

function renderLessonsList(lessons) {
  const list = $('manage-lessons-list')
  if (!lessons || !lessons.length) {
    list.innerHTML = '<p class="manage-empty">Nenhuma aula adicionada ainda.</p>'
    return
  }
  list.innerHTML = lessons.map((l, i) => `
    <div class="lesson-item">
      <div class="lesson-item-info">
        <span class="lesson-number">${i + 1}.</span>
        <div>
          <span>${escHtml(l.name)}</span>
          ${l.hasVideo ? `<span class="lesson-video-badge">${escHtml(l.videoName)}</span>` : ''}
        </div>
      </div>
      <div class="lesson-item-actions">
        <button class="secondary-button" onclick="openLessonModal(${Number(l.id)})">Editar</button>
        <button class="remove-button" onclick="doDeleteLesson(${Number(l.id)})">Remover</button>
      </div>
    </div>
  `).join('')
}

window.doDeleteLesson = async function (lessonId) {
  const { data: updated } = await removeLesson(currentCourseId, lessonId)
  if (updated) renderLessonsList(updated.lessons)
  window.__refreshCourseList?.()
}

$('manage-add-lesson-btn').addEventListener('click', () => openLessonModal(null))

// ── Aula Modal ───────────────────────────────────────────────────────────
window.openLessonModal = async function (lessonId) {
  currentLessonId = lessonId
  questions = []
  qCounter = 0
  $('lesson-modal-title').textContent = lessonId ? 'Editar aula' : 'Adicionar aula'
  $('lesson-form').reset()
  $('lesson-video-filename').textContent = 'Nenhum arquivo escolhido'
  $('lesson-video-current').style.display = 'none'
  $('questions-list').innerHTML = '<p class="manage-empty" id="no-questions-msg">Nenhuma pergunta adicionada.</p>'

  if (lessonId) {
    const { data: courses } = await getAll()
    const course = (courses || []).find(c => Number(c.id) === Number(currentCourseId))
    const lesson = course?.lessons.find(l => Number(l.id) === Number(lessonId))
    if (lesson) {
      $('lesson-name').value = lesson.name
      $('lesson-desc').value = lesson.desc || ''
      if (lesson.hasVideo) {
        $('lesson-video-current').textContent = `Vídeo atual: ${lesson.videoName}`
        $('lesson-video-current').style.display = 'block'
      }
      lesson.questions.forEach(q => addQuestion({
        text: q.text,
        type: q.type,
        options: q.options?.length ? [...q.options] : ['', '', '', ''],
        correta: q.correta ?? 0,
        gabarito: q.gabarito || '',
      }))
    }
  }

  openModal('lesson-modal')
}

$('lesson-video-btn').addEventListener('click', () => $('lesson-video').click())
$('lesson-video').addEventListener('change', e => {
  const file = e.target.files[0]
  $('lesson-video-filename').textContent = file ? file.name : 'Nenhum arquivo escolhido'
})
$('add-question-btn').addEventListener('click', () => addQuestion())

function addQuestion(data) {
  const id = ++qCounter
  const q = {
    _id: id,
    text: data?.text || '',
    type: data?.type || 'aberta',
    options: data?.options || ['', '', '', ''],
    correta: data?.correta ?? 0,
    gabarito: data?.gabarito || '',
  }
  questions.push(q)
  $('no-questions-msg')?.remove()
  const div = document.createElement('div')
  div.className = 'question-item'
  div.id = `q-${id}`
  div.innerHTML = buildQuestionHTML(q)
  $('questions-list').appendChild(div)
  bindQuestionEvents(div, id)
}

function buildQuestionHTML(q) {
  const num = questions.findIndex(x => x._id === q._id) + 1
  const letters = ['A', 'B', 'C', 'D']
  return `
    <div class="question-header-row">
      <span class="question-label">${num}ª pergunta</span>
      <button class="question-remove" type="button" data-remove="${q._id}" aria-label="Remover">×</button>
    </div>
    <div class="question-row">
      <input class="question-input" type="text" value="${escHtml(q.text)}" placeholder="Digite a pergunta" />
    </div>
    <div class="question-type-row">
      <button type="button" class="qtype-btn${q.type === 'aberta' ? ' active' : ''}" data-type="aberta">Aberta</button>
      <button type="button" class="qtype-btn${q.type === 'fechada' ? ' active' : ''}" data-type="fechada">Fechada</button>
    </div>
    ${q.type === 'aberta' ? `
      <div class="question-gabarito-block">
        <span class="gabarito-field-label">Resposta esperada (gabarito)</span>
        <textarea class="gabarito-input" placeholder="Digite a resposta que será exibida ao aluno como referência...">${escHtml(q.gabarito)}</textarea>
      </div>
    ` : `
      <div class="question-options-block" style="display:flex">
        ${letters.map((letter, i) => `
          <label class="question-option-row">
            <input type="radio" name="qcorreta_${q._id}" value="${i}" ${q.correta === i ? 'checked' : ''} title="Marcar como correta" style="accent-color:var(--accent);width:16px;height:16px;flex-shrink:0;cursor:pointer" />
            <span class="option-letter">${letter}</span>
            <input type="text" class="option-input" data-opt="${i}" value="${escHtml(q.options[i] || '')}" placeholder="Opção ${letter}" />
          </label>
        `).join('')}
        <p class="option-hint">Selecione o marcador para indicar a resposta correta.</p>
      </div>
    `}
  `
}

function bindQuestionEvents(div, id) {
  div.querySelector(`[data-remove="${id}"]`).addEventListener('click', () => removeQuestion(id))
  div.querySelectorAll('.qtype-btn').forEach(btn => {
    btn.addEventListener('click', () => switchType(id, btn.dataset.type))
  })
  div.querySelectorAll('input[type=radio]').forEach(r => {
    r.addEventListener('change', () => {
      const q = questions.find(x => x._id === id)
      if (q) q.correta = Number(r.value)
    })
  })
  div.querySelectorAll('.option-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const q = questions.find(x => x._id === id)
      if (q) q.options[Number(inp.dataset.opt)] = inp.value
    })
  })
}

function switchType(id, type) {
  const q = questions.find(x => x._id === id)
  if (!q || q.type === type) return
  const div = $(`q-${id}`)
  const textInput = div.querySelector('.question-input')
  if (textInput) q.text = textInput.value
  const gabInput = div.querySelector('.gabarito-input')
  if (gabInput) q.gabarito = gabInput.value
  q.type = type
  div.innerHTML = buildQuestionHTML(q)
  bindQuestionEvents(div, id)
}

function removeQuestion(id) {
  const idx = questions.findIndex(x => x._id === id)
  if (idx !== -1) questions.splice(idx, 1)
  $(`q-${id}`)?.remove()
  if (!questions.length) {
    $('questions-list').innerHTML = '<p class="manage-empty" id="no-questions-msg">Nenhuma pergunta adicionada.</p>'
  }
  questions.forEach((q, i) => {
    const lbl = $(`q-${q._id}`)?.querySelector('.question-label')
    if (lbl) lbl.textContent = `${i + 1}ª pergunta`
  })
}

$('lesson-form').addEventListener('submit', async e => {
  e.preventDefault()
  const name = $('lesson-name').value.trim()
  if (!name) return
  const desc = $('lesson-desc').value.trim()
  const videoFile = $('lesson-video').files[0] || null

  questions.forEach(q => {
    const div = $(`q-${q._id}`)
    if (!div) return
    q.text = div.querySelector('.question-input')?.value || q.text
    if (q.type === 'aberta') q.gabarito = div.querySelector('.gabarito-input')?.value || ''
    if (q.type === 'fechada') {
      div.querySelectorAll('.option-input').forEach(inp => { q.options[Number(inp.dataset.opt)] = inp.value })
      div.querySelectorAll('input[type=radio]').forEach(r => { if (r.checked) q.correta = Number(r.value) })
    }
  })

  const collectedQuestions = questions
    .filter(q => q.text.trim())
    .map(q => ({
      text: q.text,
      type: q.type,
      options: q.type === 'fechada' ? q.options : [],
      correta: q.type === 'fechada' ? q.correta : -1,
      gabarito: q.type === 'aberta' ? q.gabarito : '',
    }))

  const { data: updated } = currentLessonId
    ? await updateLesson(currentCourseId, currentLessonId, { name, desc, videoFile, questions: collectedQuestions })
    : await addLesson(currentCourseId, { name, desc, videoFile, questions: collectedQuestions })

  closeModal('lesson-modal')
  if (updated) renderLessonsList(updated.lessons)
  window.__refreshCourseList?.()
})

