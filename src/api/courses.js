import Course from '../models/Course'
import { saveVideo, deleteVideo } from '../lib/VideoDB'

const KEY = 'pascal_courses'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : { courses: [], nextId: 1 }
  } catch {
    return { courses: [], nextId: 1 }
  }
}

function persist(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function getAll() {
  const { courses } = load()
  return { data: courses.map(c => Course.fromRaw(c)), error: null }
}

export async function getById(id) {
  const { data } = await getAll()
  const course = data.find(c => c.id === Number(id)) || null
  return { data: course, error: course ? null : 'Curso não encontrado' }
}

export async function create(name, topic, photoFile = null) {
  try {
    const data = load()
    let photoUrl = ''
    if (photoFile) photoUrl = await fileToBase64(photoFile)
    const course = { id: data.nextId++, name, topic, photoUrl, lessons: [] }
    data.courses.push(course)
    persist(data)
    return { data: Course.fromRaw(course), error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export async function remove(id) {
  const data = load()
  const course = data.courses.find(c => c.id === id)
  if (course) {
    for (const lesson of course.lessons) {
      if (lesson.hasVideo) await deleteVideo(lesson.id).catch(() => {})
    }
  }
  data.courses = data.courses.filter(c => c.id !== id)
  persist(data)
  return { data: true, error: null }
}

export async function addLesson(courseId, { name, desc, videoFile, questions }) {
  try {
    const data = load()
    const course = data.courses.find(c => c.id === courseId)
    if (!course) return { data: null, error: 'Curso não encontrado' }
    const id = data.nextId++
    const hasVideo = Boolean(videoFile)
    const videoName = videoFile ? videoFile.name : ''
    const lesson = { id, name, desc, hasVideo, videoName, questions }
    course.lessons.push(lesson)
    persist(data)
    if (videoFile) await saveVideo(id, videoFile)
    return { data: Course.fromRaw(course), error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export async function updateLesson(courseId, lessonId, { name, desc, videoFile, questions }) {
  try {
    const data = load()
    const course = data.courses.find(c => c.id === courseId)
    if (!course) return { data: null, error: 'Curso não encontrado' }
    const lesson = course.lessons.find(l => l.id === lessonId)
    if (!lesson) return { data: null, error: 'Aula não encontrada' }
    lesson.name = name
    lesson.desc = desc
    lesson.questions = questions
    if (videoFile) {
      lesson.hasVideo = true
      lesson.videoName = videoFile.name
      await saveVideo(lessonId, videoFile)
    }
    persist(data)
    return { data: Course.fromRaw(course), error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export async function removeLesson(courseId, lessonId) {
  try {
    const data = load()
    const course = data.courses.find(c => c.id === courseId)
    if (!course) return { data: null, error: 'Curso não encontrado' }
    const lesson = course.lessons.find(l => l.id === lessonId)
    if (lesson?.hasVideo) await deleteVideo(lessonId).catch(() => {})
    course.lessons = course.lessons.filter(l => l.id !== lessonId)
    persist(data)
    return { data: Course.fromRaw(course), error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}
