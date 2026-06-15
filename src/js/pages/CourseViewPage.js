class CourseViewPage {
    #course;
    #currentIndex = 0;
    #questionQueue;
    #displayedQs    = [];
    #unlockedCount  = 0;
    #thresholds     = [];
    #overlayPending = [];
    #overlayOpen    = false;
    #currentBlobUrl = null;
    #saveTimer      = null;
    #activeQuestion = null;
    #selectedOption = -1;
    #answered       = false;

    // DOM refs
    #video;
    #noVideo;
    #lessonTitle;
    #lessonDesc;
    #questionsList;
    #queueBadge;
    #questionsHint;
    #notepad;
    #savedIndicator;
    #nextBtn;
    #overlay;

    constructor() {
        const params   = new URLSearchParams(location.search);
        const courseId = Number(params.get('courseId'));
        const courses  = CoursesDB.load();
        this.#course   = courses.find(c => c.id === courseId);

        if (!this.#course) {
            document.body.innerHTML =
                '<div style="padding:40px;color:#e6edf3">Curso não encontrado. ' +
                '<a href="user.html" style="color:#00c8a0">← Voltar</a></div>';
            return;
        }

        this.#questionQueue = new Queue();
        this._cacheDomRefs();
        this._initEventListeners();
        this._init();
    }

    _cacheDomRefs() {
        this.#video          = document.getElementById('cvVideo');
        this.#noVideo        = document.getElementById('cvNoVideo');
        this.#lessonTitle    = document.getElementById('cvLessonTitle');
        this.#lessonDesc     = document.getElementById('cvLessonDesc');
        this.#questionsList  = document.getElementById('cvQuestionsList');
        this.#queueBadge     = document.getElementById('cvQueueBadge');
        this.#questionsHint  = document.getElementById('cvQuestionsHint');
        this.#notepad        = document.getElementById('cvNotepad');
        this.#savedIndicator = document.getElementById('cvSavedIndicator');
        this.#nextBtn        = document.getElementById('cvNextBtn');
        this.#overlay        = document.getElementById('cvQOverlay');
    }

    _initEventListeners() {
        this.#nextBtn.addEventListener('click', () => {
            if (this.#currentIndex < this.#course.lessons.length - 1) {
                this._loadLesson(this.#currentIndex + 1);
            }
        });

        this.#video.addEventListener('timeupdate', () => this._onVideoTimeUpdate());
        this.#video.addEventListener('ended',      () => this._onVideoEnded());

        document.getElementById('cvQSubmit').addEventListener('click', () => this._onOverlaySubmit());
        document.getElementById('cvQSkip').addEventListener('click',   () => this._closeOverlay());

        document.querySelectorAll('.cv-tab').forEach(tab => {
            tab.addEventListener('click', () => this._switchTab(tab));
        });

        this.#notepad.addEventListener('input', () => this._onNotepadInput());
    }

    _init() {
        document.getElementById('cvCourseTitle').textContent = this.#course.name;
        document.title = `EducaInclui Pascal | ${this.#course.name}`;
        this._renderLessonList();

        if (this.#course.lessons.length) {
            this._loadLesson(0);
        } else {
            this.#lessonTitle.textContent = 'Nenhuma aula disponível neste curso.';
        }
    }

    // ── Persistência ──────────────────────────────────────────────────────────

    get #doneKey() {
        return `pascal_done_${this.#course.id}`;
    }

    #noteKey() {
        return `pascal_note_${this.#course.id}_${this._currentLesson().id}`;
    }

    _doneSet() {
        return new Set(JSON.parse(localStorage.getItem(this.#doneKey) || '[]'));
    }

    _markDone(lessonId) {
        const done = this._doneSet();
        done.add(lessonId);
        localStorage.setItem(this.#doneKey, JSON.stringify([...done]));
    }

    _currentLesson() {
        return this.#course.lessons[this.#currentIndex];
    }

    // ── Lista de aulas ────────────────────────────────────────────────────────

    _renderLessonList() {
        const list = document.getElementById('cvLessonList');
        const done = this._doneSet();

        if (!this.#course.lessons.length) {
            list.innerHTML = '<li class="cv-lesson-empty">Nenhuma aula cadastrada.</li>';
            return;
        }

        list.innerHTML = this.#course.lessons.map((l, i) => {
            const isDone   = done.has(l.id);
            const isActive = i === this.#currentIndex;
            return `
                <li class="cv-lesson-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}"
                    data-index="${i}">
                    <span class="cv-lesson-num">${isDone ? '✓' : i + 1}</span>
                    <span class="cv-lesson-name">${Dom.escHtml(l.name)}</span>
                </li>`;
        }).join('');

        list.querySelectorAll('[data-index]').forEach(li =>
            li.addEventListener('click', () => this._loadLesson(Number(li.dataset.index)))
        );
    }

    // ── Carregar aula ─────────────────────────────────────────────────────────

    async _loadLesson(index) {
        this.#currentIndex = index;
        const lesson = this._currentLesson();

        this.#lessonTitle.textContent = lesson.name;
        this.#lessonDesc.textContent  = lesson.desc || '';
        this._updateNextBtn();
        this._resetOverlayState();
        this._resetPlayer();

        if (lesson.hasVideo) {
            const blob = await VideoDB.get(`lesson_${lesson.id}`);
            if (blob) {
                this.#currentBlobUrl    = URL.createObjectURL(blob);
                this.#video.src         = this.#currentBlobUrl;
                this.#video.style.display = 'block';
                this.#noVideo.style.display = 'none';
                this.#video.load();
            }
        }

        this._buildQuestionQueue(lesson);
        this.#notepad.value = localStorage.getItem(this.#noteKey()) || '';
        this.#savedIndicator.style.opacity = '0';
        this._renderGabaritoPanel();
        this._renderLessonList();
    }

    _resetPlayer() {
        this.#video.pause();
        if (this.#currentBlobUrl) {
            URL.revokeObjectURL(this.#currentBlobUrl);
            this.#currentBlobUrl = null;
        }
        this.#video.src = '';
        this.#video.style.display = 'none';
        this.#noVideo.style.display = 'flex';
    }

    _resetOverlayState() {
        this.#overlayPending      = [];
        this.#overlayOpen         = false;
        this.#overlay.style.display = 'none';
    }

    _updateNextBtn() {
        this.#nextBtn.disabled = this.#currentIndex >= this.#course.lessons.length - 1;
    }

    // ── Fila de perguntas ─────────────────────────────────────────────────────

    _buildQuestionQueue(lesson) {
        this.#questionQueue.clear();
        this.#displayedQs   = [];
        this.#unlockedCount = 0;

        lesson.questions.forEach(q => this.#questionQueue.enqueue(
            q instanceof Question ? q : Question.fromRaw(q)
        ));

        this.#thresholds = this._buildThresholds(lesson.questionCount);
        this._renderSidebarQuestions();
        this._updateQueueBadge();

        this.#questionsHint.textContent = lesson.questionCount
            ? 'As perguntas serão liberadas conforme o vídeo avança.'
            : 'Nenhuma pergunta nesta aula.';
    }

    _buildThresholds(count) {
        if (!count) return [];
        if (count === 1) return [0.45];
        const step = 0.65 / (count - 1);
        return Array.from({ length: count }, (_, i) => 0.2 + step * i);
    }

    // ── Progresso do vídeo ────────────────────────────────────────────────────

    _onVideoTimeUpdate() {
        if (this.#questionQueue.isEmpty()) return;
        const { currentTime, duration } = this.#video;
        if (!duration || !isFinite(duration)) return;

        const pct = currentTime / duration;

        while (
            this.#unlockedCount < this.#thresholds.length &&
            pct >= this.#thresholds[this.#unlockedCount]
        ) {
            const q = this.#questionQueue.dequeue();
            this.#displayedQs.push(q);
            this.#unlockedCount++;
            this.#overlayPending.push({ q, num: this.#unlockedCount });
            this._updateQueueBadge();
            this._renderSidebarQuestions();
            this._renderGabaritoPanel();
            if (!this.#overlayOpen) this._showNextOverlay();
        }

        if (this.#questionQueue.isEmpty() && this.#unlockedCount > 0) {
            this.#questionsHint.textContent = 'Todas as perguntas foram liberadas!';
        }
    }

    _onVideoEnded() {
        this._markDone(this._currentLesson().id);
        this._renderLessonList();
    }

    // ── Overlay de pergunta ───────────────────────────────────────────────────

    _showNextOverlay() {
        if (!this.#overlayPending.length) {
            this.#overlayOpen = false;
            this.#video.play();
            return;
        }

        this.#overlayOpen    = true;
        this.#answered       = false;
        this.#selectedOption = -1;
        this.#video.pause();

        const { q, num }  = this.#overlayPending.shift();
        this.#activeQuestion = q;

        document.getElementById('cvQBadge').textContent = `Pergunta ${num}`;
        document.getElementById('cvQText').textContent  = q.text;

        const feedback = document.getElementById('cvQFeedback');
        feedback.className   = 'cv-q-feedback';
        feedback.textContent = '';

        const gabEl = document.getElementById('cvQGabarito');
        gabEl.style.display = 'none';
        gabEl.textContent   = '';

        const submitBtn = document.getElementById('cvQSubmit');
        submitBtn.textContent = 'Responder';
        submitBtn.disabled    = false;

        const area = document.getElementById('cvQAnswerArea');
        if (q.isFechada) {
            area.innerHTML = `<div class="cv-q-modal-options">
                ${q.options.map((opt, i) => `
                    <label class="cv-q-modal-option" data-idx="${i}">
                        <input type="radio" name="cvqopt" value="${i}" />
                        <span class="cv-opt-letter">${'ABCD'[i]}</span>
                        <span>${Dom.escHtml(opt)}</span>
                    </label>`).join('')}
            </div>`;
            area.querySelectorAll('.cv-q-modal-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    if (this.#answered) return;
                    area.querySelectorAll('.cv-q-modal-option').forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                    this.#selectedOption = Number(opt.dataset.idx);
                    submitBtn.disabled   = false;
                });
            });
            submitBtn.disabled = true;
        } else {
            area.innerHTML = `<textarea class="cv-q-modal-textarea" id="cvQTextarea"
                placeholder="Digite sua resposta..."></textarea>`;
        }

        this.#overlay.style.display = 'flex';
    }

    _onOverlaySubmit() {
        if (!this.#activeQuestion) return;

        const feedback  = document.getElementById('cvQFeedback');
        const submitBtn = document.getElementById('cvQSubmit');

        if (this.#answered) {
            this._closeOverlay();
            return;
        }

        this.#answered = true;
        const q        = this.#activeQuestion;

        if (q.isFechada) {
            const area = document.getElementById('cvQAnswerArea');
            area.querySelectorAll('.cv-q-modal-option').forEach(opt => {
                const idx = Number(opt.dataset.idx);
                if (idx === q.correta)                  opt.classList.add('correct');
                if (idx === this.#selectedOption && idx !== q.correta) opt.classList.add('wrong');
            });

            if (this.#selectedOption === q.correta) {
                feedback.textContent = '✓ Resposta correta!';
                feedback.className   = 'cv-q-feedback correct';
            } else {
                feedback.textContent = `✗ Incorreto. A resposta correta era: ${'ABCD'[q.correta]} — ${Dom.escHtml(q.options[q.correta])}`;
                feedback.className   = 'cv-q-feedback wrong';
            }
        } else {
            const answer = (document.getElementById('cvQTextarea')?.value || '').trim();
            feedback.textContent = answer ? 'Resposta registrada!' : 'Nenhuma resposta digitada.';
            feedback.className   = 'cv-q-feedback neutral';

            const gabEl = document.getElementById('cvQGabarito');
            if (q.gabarito) {
                gabEl.innerHTML     = `<span class="cv-q-gabarito-label">Gabarito:</span> ${Dom.escHtml(q.gabarito)}`;
                gabEl.style.display = 'block';
            }
        }

        submitBtn.textContent = 'Continuar →';
        submitBtn.disabled    = false;
    }

    _closeOverlay() {
        this.#overlay.style.display = 'none';
        this.#activeQuestion = null;
        this._showNextOverlay();
    }

    // ── Sidebar direita ───────────────────────────────────────────────────────

    _renderSidebarQuestions() {
        this.#questionsList.innerHTML = this.#displayedQs.length
            ? this.#displayedQs.map((q, i) => `
                <div class="cv-question-item">
                    <span class="cv-question-num">${i + 1}</span>
                    <p>${Dom.escHtml(q.text)}</p>
                </div>`).join('')
            : '';
    }

    _updateQueueBadge() {
        this.#queueBadge.textContent = this.#questionQueue.size;
    }

    _switchTab(activeTab) {
        document.querySelectorAll('.cv-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.cv-tab-panel').forEach(p => p.style.display = 'none');
        activeTab.classList.add('active');
        document.getElementById(activeTab.dataset.panel).style.display = 'flex';
    }

    _onNotepadInput() {
        this.#savedIndicator.style.opacity = '0';
        clearTimeout(this.#saveTimer);
        this.#saveTimer = setTimeout(() => {
            localStorage.setItem(this.#noteKey(), this.#notepad.value);
            this.#savedIndicator.style.opacity = '1';
        }, 700);
    }

    // ── Gabarito ──────────────────────────────────────────────────────────────

    _renderGabaritoPanel() {
        const list = document.getElementById('cvGabaritoList');
        const qs   = this._currentLesson().questions;

        if (!qs?.length) {
            list.innerHTML = '<p class="cv-questions-hint">Nenhuma pergunta nesta aula.</p>';
            return;
        }

        list.innerHTML = qs.map((raw, i) => {
            const q    = raw instanceof Question ? raw : Question.fromRaw(raw);
            const shown = i < this.#displayedQs.length;
            let answerContent;

            if (q.isFechada && q.options?.length) {
                const idx = q.correta;
                answerContent = `${'ABCD'[idx] || '?'}) ${Dom.escHtml(q.options[idx] || '—')}`;
            } else if (q.gabarito) {
                answerContent = Dom.escHtml(q.gabarito);
            } else {
                answerContent = 'Gabarito não informado';
            }

            return `<div class="cv-gab-item">
                <p class="cv-gab-q"><strong>${i + 1}.</strong> ${Dom.escHtml(q.text)}</p>
                ${shown
                    ? `<button class="cv-gab-reveal-btn" type="button">Ver resposta</button>
                       <div class="cv-gab-answer" style="display:none">${answerContent}</div>`
                    : `<span class="cv-gab-locked">Responda a pergunta no vídeo para desbloquear</span>`
                }
            </div>`;
        }).join('');

        list.querySelectorAll('.cv-gab-reveal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const answer = btn.nextElementSibling;
                const hidden = answer.style.display === 'none';
                answer.style.display = hidden ? 'block' : 'none';
                btn.textContent = hidden ? 'Ocultar' : 'Ver resposta';
                btn.classList.toggle('active', hidden);
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new CourseViewPage());
