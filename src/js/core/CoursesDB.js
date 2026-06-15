class CoursesDB {
    static #KEY = 'pascal_courses';

    static load() {
        try {
            const raw = JSON.parse(localStorage.getItem(this.#KEY) || '[]');
            return raw.map(c => Course.fromRaw(c));
        } catch {
            return [];
        }
    }

    static save(courses) {
        localStorage.setItem(this.#KEY, JSON.stringify(courses));
    }
}
