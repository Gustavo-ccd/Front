import CoursesDB from '../lib/CoursesDB'
import VideoDB from '../lib/VideoDB'
import Course from '../models/Course'
import Lesson from '../models/Lesson'

export async function getAll() {
  try {
    return { data: CoursesDB.load(), error: null }
  } catch (e) {
    return { data: [], error: e.message }
  }
}

export async function getById(id) {
  try {
    const courses = CoursesDB.load()
    const course = courses.find(c => c.id === Number(id)) || null
    return { data: course, error: course ? null : 'Curso não encontrado' }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export async function create(name, topic, imageFile = null) {
  try {
    const courses = CoursesDB.load()
    const ids = courses.map(c => Number(c.id)).filter(n => !isNaN(n))
    const newId = ids.length ? Math.max(...ids) + 1 : 1
    if (imageFile) await VideoDB.save(`course_img_${newId}`, imageFile)
    const course = new Course({ id: newId, name, topic, lessons: [] })
    CoursesDB.save([...courses, course])
    return { data: course, error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export async function remove(id) {
  try {
    const courses = CoursesDB.load()
    CoursesDB.save(courses.filter(c => c.id !== Number(id)))
    return { data: true, error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

function nextLessonId(courses) {
  const ids = []
  courses.forEach(c => c.lessons.forEach(l => ids.push(Number(l.id))))
  const valid = ids.filter(n => !isNaN(n))
  return valid.length ? Math.max(...valid) + 1 : 1
}

export async function addLesson(courseId, { name, desc, videoFile, questions }) {
  try {
    const courses = CoursesDB.load()
    const lessonId = nextLessonId(courses)
    if (videoFile) await VideoDB.save(`lesson_${lessonId}`, videoFile)
    const lesson = new Lesson({
      id: lessonId,
      name,
      desc,
      videoName: videoFile ? videoFile.name : '',
      questions,
    })
    const updated = courses.map(c => {
      if (c.id !== Number(courseId)) return c
      return new Course({ id: c.id, name: c.name, topic: c.topic, lessons: [...c.lessons, lesson] })
    })
    CoursesDB.save(updated)
    return { data: updated.find(c => c.id === Number(courseId)), error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export async function updateLesson(courseId, lessonId, { name, desc, videoFile, questions }) {
  try {
    const courses = CoursesDB.load()
    if (videoFile) await VideoDB.save(`lesson_${lessonId}`, videoFile)
    const updated = courses.map(c => {
      if (c.id !== Number(courseId)) return c
      const newLessons = c.lessons.map(l => {
        if (l.id !== Number(lessonId)) return l
        return new Lesson({
          id: l.id,
          name,
          desc,
          videoName: videoFile ? videoFile.name : l.videoName,
          questions,
        })
      })
      return new Course({ id: c.id, name: c.name, topic: c.topic, lessons: newLessons })
    })
    CoursesDB.save(updated)
    return { data: updated.find(c => c.id === Number(courseId)), error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export async function removeLesson(courseId, lessonId) {
  try {
    const courses = CoursesDB.load()
    const updated = courses.map(c => {
      if (c.id !== Number(courseId)) return c
      return new Course({
        id: c.id,
        name: c.name,
        topic: c.topic,
        lessons: c.lessons.filter(l => l.id !== Number(lessonId)),
      })
    })
    CoursesDB.save(updated)
    return { data: updated.find(c => c.id === Number(courseId)), error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}
