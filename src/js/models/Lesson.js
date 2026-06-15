class Lesson {
    constructor({ id, name = '', desc = '', videoName = '', questions = [] } = {}) {
        this.id = id;
        this.name = name;
        this.desc = desc;
        this.videoName = videoName;
        this.questions = questions.map(q =>
            q instanceof Question ? q : Question.fromRaw(q)
        );
    }

    get hasVideo() {
        return Boolean(this.videoName);
    }

    get questionCount() {
        return this.questions.length;
    }

    static fromRaw(raw) {
        return new Lesson(raw);
    }
}
