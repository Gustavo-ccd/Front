class AdministrativePage {
    #courses;

    constructor() {
        this.#courses = CoursesDB.load();
        this._render();
    }

    _render() {
        const totalLessons = this.#courses.reduce((acc, c) => acc + c.lessonCount, 0);

        document.getElementById('totalCoursesCount').textContent = this.#courses.length;
        document.getElementById('totalLessonsCount').textContent = totalLessons;

        this._renderCourseList();
    }

    _renderCourseList() {
        const list = document.getElementById('dashCoursesList');

        if (!this.#courses.length) return;

        list.innerHTML = this.#courses.map((c, i) => `
            <div class="top-course-item">
                <span>${i + 1}. ${Dom.escHtml(c.name)}</span>
                <span>${Dom.escHtml(c.topic)}</span>
                <span>${c.lessonCount} aula${c.lessonCount !== 1 ? 's' : ''}</span>
            </div>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => new AdministrativePage());
