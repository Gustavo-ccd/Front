const key = (courseId, lessonId) => `pascal_note_${courseId}_${lessonId}`

export async function getNote(courseId, lessonId) {
  try {
    return { data: localStorage.getItem(key(courseId, lessonId)) || '', error: null }
  } catch (e) {
    return { data: '', error: e.message }
  }
}

export async function saveNote(courseId, lessonId, text) {
  try {
    localStorage.setItem(key(courseId, lessonId), text)
    return { data: true, error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}
