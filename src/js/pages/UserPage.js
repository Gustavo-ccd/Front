class UserPage {
    #courses;
    #activeFilter = 'all';
    #searchQuery = '';

    #modal;
    #modalTitulo;
    #modalCorpo;

    #MODAL_CONTENTS = {
        profile: {
            titulo: 'Meu Perfil',
            corpo: `
                <div class="modal-campo">
                    <label>Nome:</label>
                    <p>Usuário Pascal</p>
                </div>
                <div class="modal-campo">
                    <label>E-mail:</label>
                    <p>usuario@pascal.com</p>
                </div>
                <button class="modal-botao" id="logoutBtn">Sair</button>
            `,
        },
    };

    constructor() {
        this.#courses = CoursesDB.load();
        this.#modal = document.getElementById('modal');
        this.#modalTitulo = document.getElementById('modalTitulo');
        this.#modalCorpo = document.getElementById('modalCorpo');
        this._initEventListeners();
        this._renderFilterButtons();
        this._renderCourseList();
    }

    _initEventListeners() {
        document.getElementById('searchInput').addEventListener('input', e => {
            this.#searchQuery = e.target.value.toLowerCase().trim();
            this._renderCourseList();
        });

        document.querySelectorAll('[data-modal]').forEach(el => {
            el.addEventListener('click', e => {
                e.preventDefault();
                this._openModal(el.dataset.modal);
            });
        });

        document.getElementById('fecharModal').addEventListener('click', () => this._closeModal());
        this.#modal.addEventListener('click', e => {
            if (e.target === this.#modal) this._closeModal();
        });
    }

    _openModal(tipo) {
        const content = this.#MODAL_CONTENTS[tipo];
        if (!content) return;
        this.#modalTitulo.innerHTML = content.titulo;
        this.#modalCorpo.innerHTML = content.corpo;
        this.#modal.classList.add('ativo');

        if (tipo === 'profile') {
            this.#modalCorpo.querySelector('#logoutBtn')
                ?.addEventListener('click', () => this._logout());
        }
    }

    _closeModal() {
        this.#modal.classList.remove('ativo');
    }

    _logout() {
        this._closeModal();
        Session.clear();
        window.location.href = '../../index.html';
    }

    _getFilteredCourses() {
        let result = this.#courses;

        if (this.#activeFilter !== 'all') {
            result = result.filter(c =>
                c.topic.toLowerCase() === this.#activeFilter.toLowerCase()
            );
        }

        if (this.#searchQuery) {
            result = result.filter(c =>
                c.name.toLowerCase().includes(this.#searchQuery) ||
                c.topic.toLowerCase().includes(this.#searchQuery)
            );
        }

        return result;
    }

    _renderCourseList() {
        const list = document.getElementById('courseList');
        const filtered = this._getFilteredCourses();

        if (!filtered.length) {
            list.innerHTML = `<div class="user-empty-state">
                <p>${this.#courses.length
                    ? 'Nenhum curso encontrado para essa busca.'
                    : 'Nenhum curso disponível no momento.'
                }</p>
            </div>`;
            return;
        }

        list.innerHTML = filtered.map(c => `
            <article class="course-card" data-course-id="${c.id}">
                <div class="course-card-placeholder" id="cimg_${c.id}">
                    <span>${c.topicInitial}</span>
                </div>
                <h3>${Dom.escHtml(c.name)}</h3>
                <p>${Dom.escHtml(c.topic)}</p>
                <div class="course-meta">
                    <span>${c.lessonCount} aula${c.lessonCount !== 1 ? 's' : ''}</span>
                </div>
                <div class="course-card-footer">
                    <a href="course-view.html?courseId=${c.id}">Ver curso</a>
                </div>
            </article>
        `).join('');

        this._loadCourseImages(filtered);
    }

    _renderFilterButtons() {
        const topics = [...new Set(this.#courses.map(c => c.topic))];
        const container = document.getElementById('filterButtons');

        container.innerHTML = `<button class="${this.#activeFilter === 'all' ? 'active' : ''}" data-filter="all">Todos</button>`;

        topics.forEach(topic => {
            const btn = document.createElement('button');
            btn.textContent = topic;
            btn.dataset.filter = topic;
            if (this.#activeFilter === topic) btn.classList.add('active');
            container.appendChild(btn);
        });

        container.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.#activeFilter = btn.dataset.filter;
                this._renderFilterButtons();
                this._renderCourseList();
            });
        });
    }

    async _loadCourseImages(courses) {
        for (const c of courses) {
            const blob = await VideoDB.get(`course_img_${c.id}`);
            if (!blob) continue;
            const placeholder = document.getElementById(`cimg_${c.id}`);
            if (!placeholder) continue;
            const url = URL.createObjectURL(blob);
            const img = document.createElement('img');
            img.src = url;
            img.style.cssText = 'width:100%;height:144px;object-fit:cover;border-radius:18px;margin-bottom:20px;border:1px solid var(--border);display:block;';
            placeholder.replaceWith(img);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new UserPage());
