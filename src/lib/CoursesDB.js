import Course from '../models/Course'

const KEY = 'pascal_courses'

const CoursesDB = {
  load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
      return raw.map(c => Course.fromRaw(c))
    } catch { return [] }
  },
  save(courses) {
    localStorage.setItem(KEY, JSON.stringify(courses))
  },
}

export default CoursesDB
