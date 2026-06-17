import Lesson from './Lesson'

export default class Course {
  constructor({ id, name = '', topic = '', photoUrl = '', lessons = [] } = {}) {
    this.id = id
    this.name = name
    this.topic = topic
    this.photoUrl = photoUrl
    this.lessons = lessons.map(l => l instanceof Lesson ? l : Lesson.fromRaw(l))
  }

  get lessonCount() { return this.lessons.length }
  get topicInitial() { return this.topic.charAt(0).toUpperCase() }

  static fromRaw(raw) { return new Course(raw) }
}
