const key = courseId => `pascal_done_${courseId}`

export async function getDone(courseId) {
  try {
    const raw = JSON.parse(localStorage.getItem(key(courseId)) || '[]')
    return { data: new Set(raw), error: null }
  } catch (e) {
    return { data: new Set(), error: e.message }
  }
}

export async function markDone(courseId, lessonId) {
  try {
    const raw = JSON.parse(localStorage.getItem(key(courseId)) || '[]')
    const done = new Set(raw)
    done.add(Number(lessonId))
    localStorage.setItem(key(courseId), JSON.stringify([...done]))
    return { data: done, error: null }
  } catch (e) {
    return { data: new Set(), error: e.message }
  }
}
