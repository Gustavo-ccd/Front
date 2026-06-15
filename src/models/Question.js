export default class Question {
  constructor({ text = '', type = 'aberta', options = [], correta = -1, gabarito = '' } = {}) {
    this.text = text
    this.type = type
    this.options = options
    this.correta = correta
    this.gabarito = gabarito
  }

  get isFechada() { return this.type === 'fechada' }

  static fromRaw(raw) {
    if (typeof raw === 'string') return new Question({ text: raw })
    return new Question(raw)
  }
}
