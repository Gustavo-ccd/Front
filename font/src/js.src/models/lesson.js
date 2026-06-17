import Question from './question'

export default class Lesson {
  constructor({ id, name = '', desc = '', hasVideo = false, videoName = '', questions = [] } = {}) {
    this.id = id
    this.name = name
    this.desc = desc
    this.hasVideo = hasVideo
    this.videoName = videoName
    this.questions = questions.map(q => q instanceof Question ? q : Question.fromRaw(q))
  }

  get questionCount() { return this.questions.length }

  static fromRaw(raw) { return new Lesson(raw) }
}

