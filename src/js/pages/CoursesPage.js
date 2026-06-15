class CoursesPage {
    #courses;
    #nextCourseId;
    #nextLessonId;
    #currentCourseId = null;
    #editingLessonId = null;
    #selectedVideoFile = null;
    #selectedCourseImage = null;
    #qIdCounter = 0;

    #addCourseModal;
    #manageCourseModal;
    #lessonModal;

    constructor() {
        this.#courses = CoursesDB.load();
        this.#nextCourseId = this.#courses.length
            ? Math.max(...this.#courses.map(c => c.id)) + 1
            : 1;
        this.#nextLessonId = 1;
        this.#courses.forEach(c =>
            c.lessons.forEach(l => {
                if (l.id >= this.#nextLessonId) this.#nextLessonId = l.id + 1;
            })
        );

        this.#addCourseModal = document.getElementById('addCourseModal');
        this.#manageCourseModal = document.getElementById('manageCourseModal');
        this.#lessonModal = document.getElementById('lessonModal');

        this._initEventListeners();
        this._renderCourseTable();
    }

    _initEventListeners() {
        // Modal 1 — Adicionar Curso
        document.getElementById('triggerCourseImage').addEventListener('click', () =>
            document.getElementById('newCourseImageInput').click()
        );
        document.getElementById('openAddCourseModal').addEventListener('click', () =>
            this._openAddCourseModal()
        );
        document.getElementById('newCourseImageInput').addEventListener('change', e =>
            this._onCourseImageChange(e)
        );
        document.getElementById('closeAddCourseModal').addEventListener('click', () =>
            Dom.toggleModal(this.#addCourseModal, false)
        );
        this.#addCourseModal.addEventListener('click', e => {
            if (e.target === this.#addCourseModal) Dom.toggleModal(this.#addCourseModal, false);
        });
        document.getElementById('addCourseForm').addEventListener('submit', e =>
            this._onAddCourseSubmit(e)
        );

        // Modal 2 — Gerenciar Curso
        document.getElementById('closeManageCourseModal').addEventListener('click', () =>
            Dom.toggleModal(this.#manageCourseModal, false)
        );
        this.#manageCourseModal.addEventListener('click', e => {
            if (e.target === this.#manageCourseModal) Dom.toggleModal(this.#manageCourseModal, false);
        });

        // Modal 3 — Aula
        document.getElementById('triggerLessonVideo').addEventListener('click', () =>
            document.getElementById('lessonVideoInput').click()
        );
        document.getElementById('openAddLessonBtn').addEventListener('click', () =>
            this._openLessonModal()
        );
        document.getElementById('closeLessonModal').addEventListener('click', () =>
            Dom.toggleModal(this.#lessonModal, false)
        );
        this.#lessonModal.addEventListener('click', e => {
            if (e.target === this.#lessonModal) Dom.toggleModal(this.#lessonModal, false);
        });
        document.getElementById('lessonVideoInput').addEventListener('change', e =>
            this._onLessonVideoChange(e)
        );
        document.getElementById('addQuestionBtn').addEventListener('click', () =>
            this._addQuestionItem()
        );
        document.getElementById('lessonForm').addEventListener('submit', e =>
            this._onLessonFormSubmit(e)
        );
    }

    // ── Tabela de cursos ──────────────────────────────────────────────────────

    _renderCourseTable() {
        const tbody = document.getElementById('coursesTableBody');

        if (!this.#courses.length) {
            tbody.innerHTML = '<div class="manage-empty" style="padding:20px 0">Nenhum curso adicionado ainda.</div>';
            return;
        }

        tbody.innerHTML = this.#courses.map(c => `
            <div class="courses-row">
                <span>${Dom.escHtml(c.name)}</span>
                <span>${Dom.escHtml(c.topic)}</span>
                <span>${c.lessonCount}</span>
                <div class="courses-row-actions">
                    <button class="secondary-button" type="button" data-manage="${c.id}">Editar</button>
                    <button class="remove-button"    type="button" data-delete="${c.id}">Deletar</button>
                </div>
            </div>
        `).join('');

        tbody.querySelectorAll('[data-manage]').forEach(btn =>
            btn.addEventListener('click', () => this._openManageCourse(Number(btn.dataset.manage)))
        );
        tbody.querySelectorAll('[data-delete]').forEach(btn =>
            btn.addEventListener('click', () => this._deleteCourse(Number(btn.dataset.delete)))
        );
    }

    _deleteCourse(courseId) {
        this.#courses = this.#courses.filter(c => c.id !== courseId);
        CoursesDB.save(this.#courses);
        this._renderCourseTable();
    }

    // ── Modal 1 — Adicionar Curso ─────────────────────────────────────────────

    _openAddCourseModal() {
        document.getElementById('newCourseNameInput').value = '';
        document.getElementById('newCourseTopicInput').value = '';
        document.getElementById('newCourseImageInput').value = '';
        document.getElementById('courseImagePreview').style.display = 'none';
        document.getElementById('courseImageName').textContent = 'Nenhum arquivo escolhido';
        this.#selectedCourseImage = null;
        Dom.toggleModal(this.#addCourseModal, true);
    }

    _onCourseImageChange(e) {
        this.#selectedCourseImage = e.target.files[0] || null;
        const preview  = document.getElementById('courseImagePreview');
        const img      = document.getElementById('courseImagePreviewImg');
        const nameSpan = document.getElementById('courseImageName');

        if (this.#selectedCourseImage) {
            img.src = URL.createObjectURL(this.#selectedCourseImage);
            preview.style.display = 'flex';
            nameSpan.textContent  = this.#selectedCourseImage.name;
        } else {
            preview.style.display = 'none';
            nameSpan.textContent  = 'Nenhum arquivo escolhido';
        }
    }

    async _onAddCourseSubmit(e) {
        e.preventDefault();
        const name  = document.getElementById('newCourseNameInput').value.trim();
        const topic = document.getElementById('newCourseTopicInput').value.trim();
        if (!name || !topic) return;

        const newId = this.#nextCourseId++;
        this.#courses.push(new Course({ id: newId, name, topic, lessons: [] }));

        if (this.#selectedCourseImage) {
            await VideoDB.save(`course_img_${newId}`, this.#selectedCourseImage);
        }

        CoursesDB.save(this.#courses);
        this._renderCourseTable();
        Dom.toggleModal(this.#addCourseModal, false);
    }

    // ── Modal 2 — Gerenciar Aulas ─────────────────────────────────────────────

    _openManageCourse(courseId) {
        this.#currentCourseId = courseId;
        const course = this.#courses.find(c => c.id === courseId);
        document.getElementById('manageCourseTitle').textContent = course.name;
        this._renderLessonsList();
        Dom.toggleModal(this.#manageCourseModal, true);
    }

    _renderLessonsList() {
        const course = this.#courses.find(c => c.id === this.#currentCourseId);
        const list   = document.getElementById('manageLessonsList');

        if (!course || !course.lessons.length) {
            list.innerHTML = '<p class="manage-empty">Nenhuma aula adicionada ainda.</p>';
            return;
        }

        list.innerHTML = course.lessons.map((l, i) => `
            <div class="lesson-item">
                <div class="lesson-item-info">
                    <span class="lesson-number">${i + 1}.</span>
                    <div>
                        <span>${Dom.escHtml(l.name)}</span>
                        ${l.hasVideo ? `<span class="lesson-video-badge">${Dom.escHtml(l.videoName)}</span>` : ''}
                    </div>
                </div>
                <div class="lesson-item-actions">
                    <button class="secondary-button" type="button" data-edit-lesson="${l.id}">Editar</button>
                    <button class="remove-button"    type="button" data-del-lesson="${l.id}">Remover</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('[data-edit-lesson]').forEach(btn =>
            btn.addEventListener('click', () => this._openLessonModal(Number(btn.dataset.editLesson)))
        );
        list.querySelectorAll('[data-del-lesson]').forEach(btn =>
            btn.addEventListener('click', () => this._deleteLesson(Number(btn.dataset.delLesson)))
        );
    }

    _deleteLesson(lessonId) {
        const course = this.#courses.find(c => c.id === this.#currentCourseId);
        course.lessons = course.lessons.filter(l => l.id !== lessonId);
        CoursesDB.save(this.#courses);
        this._renderLessonsList();
        this._renderCourseTable();
    }

    // ── Modal 3 — Adicionar / Editar Aula ────────────────────────────────────

    _openLessonModal(lessonId = null) {
        this.#editingLessonId = lessonId;
        this.#selectedVideoFile = null;

        const course = this.#courses.find(c => c.id === this.#currentCourseId);
        const lesson = lessonId ? course.lessons.find(l => l.id === lessonId) : null;

        document.getElementById('lessonModalTitle').textContent = lessonId ? 'Editar aula' : 'Adicionar aula';
        document.getElementById('lessonNameInput').value  = lesson ? lesson.name : '';
        document.getElementById('lessonDescInput').value  = lesson ? lesson.desc : '';
        document.getElementById('lessonVideoInput').value = '';
        document.getElementById('lessonVideoName').textContent = 'Nenhum arquivo escolhido';

        const hint = document.getElementById('videoCurrentHint');
        hint.textContent = lesson?.hasVideo ? `Vídeo atual: ${lesson.videoName}` : '';

        const qList = document.getElementById('questionsList');
        qList.innerHTML = '<p class="manage-empty">Nenhuma pergunta adicionada.</p>';
        if (lesson?.questions.length) lesson.questions.forEach(q => this._addQuestionItem(q));

        Dom.toggleModal(this.#lessonModal, true);
    }

    _onLessonVideoChange(e) {
        this.#selectedVideoFile = e.target.files[0] || null;
        const hint     = document.getElementById('videoCurrentHint');
        const nameSpan = document.getElementById('lessonVideoName');

        if (this.#selectedVideoFile) {
            nameSpan.textContent = this.#selectedVideoFile.name;
            hint.textContent     = '';
        } else {
            nameSpan.textContent = 'Nenhum arquivo escolhido';
        }
    }

    async _onLessonFormSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('lessonNameInput').value.trim();
        if (!name) return;

        const course = this.#courses.find(c => c.id === this.#currentCourseId);
        const existing = this.#editingLessonId
            ? course.lessons.find(l => l.id === this.#editingLessonId)
            : null;

        const payload = {
            name,
            desc:      document.getElementById('lessonDescInput').value.trim(),
            videoName: this.#selectedVideoFile
                ? this.#selectedVideoFile.name
                : (existing ? existing.videoName : ''),
            questions: this._collectQuestions(),
        };

        let lessonId;
        if (this.#editingLessonId) {
            Object.assign(existing, payload);
            lessonId = this.#editingLessonId;
        } else {
            lessonId = this.#nextLessonId++;
            course.lessons.push(new Lesson({ id: lessonId, ...payload }));
        }

        if (this.#selectedVideoFile) {
            await VideoDB.save(`lesson_${lessonId}`, this.#selectedVideoFile);
        }

        CoursesDB.save(this.#courses);
        this._renderLessonsList();
        this._renderCourseTable();
        Dom.toggleModal(this.#lessonModal, false);
    }

    // ── Perguntas ─────────────────────────────────────────────────────────────

    _addQuestionItem(qObj = null) {
        const list  = document.getElementById('questionsList');
        const empty = list.querySelector('.manage-empty');
        if (empty) empty.remove();

        const count = list.querySelectorAll('.question-item').length + 1;
        const qId   = ++this.#qIdCounter;
        const q     = qObj instanceof Question
            ? qObj
            : Question.fromRaw(qObj || { text: '', type: 'aberta', options: ['','','',''], correta: 0, gabarito: '' });

        const closed = q.isFechada;
        const div    = document.createElement('div');
        div.className = 'question-item';
        div.innerHTML = `
            <div class="question-header-row">
                <span class="question-label">${count}ª pergunta</span>
                <button class="question-remove" type="button" aria-label="Remover">×</button>
            </div>
            <div class="question-row">
                <input class="question-input" type="text" value="${Dom.escHtml(q.text)}" placeholder="Digite a pergunta" />
            </div>
            <div class="question-type-row">
                <input type="radio" name="qtype_${qId}" value="aberta"  ${!closed ? 'checked' : ''} style="display:none" />
                <input type="radio" name="qtype_${qId}" value="fechada" ${closed  ? 'checked' : ''} style="display:none" />
                <button type="button" class="qtype-btn ${!closed ? 'active' : ''}" data-val="aberta">Aberta</button>
                <button type="button" class="qtype-btn ${closed  ? 'active' : ''}" data-val="fechada">Fechada</button>
            </div>
            <div class="question-gabarito-block" style="display:${!closed ? 'grid' : 'none'}">
                <span class="gabarito-field-label">Resposta esperada (gabarito)</span>
                <textarea class="gabarito-input" placeholder="Digite a resposta que será exibida ao aluno como referência...">${Dom.escHtml(q.gabarito || '')}</textarea>
            </div>
            <div class="question-options-block" style="display:${closed ? 'flex' : 'none'}">
                ${['A','B','C','D'].map((l, i) => `
                    <label class="question-option-row">
                        <input type="radio" name="qcorreta_${qId}" value="${i}" ${q.correta === i ? 'checked' : ''} title="Marcar como correta" />
                        <span class="option-letter">${l}</span>
                        <input type="text" class="option-input" value="${Dom.escHtml(q.options[i] || '')}" placeholder="Opção ${l}" />
                    </label>`).join('')}
                <p class="option-hint">Selecione o marcador para indicar a resposta correta.</p>
            </div>
        `;

        div.querySelectorAll('.qtype-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.dataset.val;
                div.querySelector(`input[name="qtype_${qId}"][value="${val}"]`).checked = true;
                div.querySelectorAll('.qtype-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const isFechada = val === 'fechada';
                div.querySelector('.question-options-block').style.display  = isFechada ? 'flex'  : 'none';
                div.querySelector('.question-gabarito-block').style.display = isFechada ? 'none'  : 'grid';
            });
        });

        div.querySelector('.question-remove').addEventListener('click', () => {
            div.remove();
            list.querySelectorAll('.question-item').forEach((item, i) =>
                item.querySelector('.question-label').textContent = `${i + 1}ª pergunta`
            );
            if (!list.querySelectorAll('.question-item').length) {
                list.innerHTML = '<p class="manage-empty">Nenhuma pergunta adicionada.</p>';
            }
        });

        list.appendChild(div);
    }

    _collectQuestions() {
        return Array.from(document.querySelectorAll('#questionsList .question-item')).map(item => {
            const text = item.querySelector('.question-input').value.trim();
            if (!text) return null;

            const isFechada = item.querySelector('input[type="radio"][value="fechada"]:checked');
            if (isFechada) {
                const options = Array.from(item.querySelectorAll('.option-input')).map(i => i.value.trim());
                const cRadio  = item.querySelector('input[name^="qcorreta_"]:checked');
                return new Question({ text, type: 'fechada', options, correta: cRadio ? Number(cRadio.value) : 0, gabarito: '' });
            }

            const gabarito = item.querySelector('.gabarito-input')?.value.trim() || '';
            return new Question({ text, type: 'aberta', options: [], correta: -1, gabarito });
        }).filter(Boolean);
    }
}

document.addEventListener('DOMContentLoaded', () => new CoursesPage());
