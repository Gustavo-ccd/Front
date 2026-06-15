class LandingPage {
    #modal;
    #modalTitulo;
    #modalCorpo;

    #MODAL_CONTENTS = {
        login: {
            titulo: 'Entrar',
            corpo: `
                <div style="background:#21262d;border:1px solid #30363d;padding:15px;border-radius:10px;margin-bottom:20px;color:#e6edf3;">
                    <h4 style="color:#00c8a0;margin-bottom:10px;">Usuários para teste</h4>
                    <p>Cliente:</p>
                    <small>cliente@pascal.com | 123</small>
                    <br><br>
                    <p>Educacional:</p>
                    <small>educacional@pascal.com | 123</small>
                </div>
                <div class="modal-campo">
                    <label>E-mail</label>
                    <input type="email" id="loginEmail" placeholder="Digite seu e-mail" />
                </div>
                <div class="modal-campo">
                    <label>Senha</label>
                    <input type="password" id="loginSenha" placeholder="Digite sua senha" />
                </div>
                <button class="modal-botao" id="loginBtn">Entrar</button>
            `,
        },
        register: {
            titulo: 'Cadastro Desativado',
            corpo: `
                <p>Esta versão utiliza apenas usuários de demonstração.</p>
                <br>
                <p>Utilize um dos acessos disponíveis na tela de login.</p>
            `,
        },
        profissional: {
            titulo: 'Plano Profissional',
            corpo: `
                <p>Ideal para instrutores e criadores de cursos.</p>
                <ul class="modal-lista">
                    <li>Publicação de cursos</li>
                    <li>Gestão de alunos</li>
                    <li>Dashboard profissional</li>
                    <li>Certificados</li>
                </ul>
                <button class="modal-botao">Comprar Plano</button>
            `,
        },
        empresarial: {
            titulo: 'Plano Empresarial',
            corpo: `
                <p>Plataforma para treinamento corporativo.</p>
                <ul class="modal-lista">
                    <li>Gestão de colaboradores</li>
                    <li>Relatórios</li>
                    <li>Treinamentos internos</li>
                    <li>Suporte dedicado</li>
                </ul>
                <button class="modal-botao">Falar com Comercial</button>
            `,
        },
        educacional: {
            titulo: 'Plano Educacional',
            corpo: `
                <p>Plataforma para instituições de ensino.</p>
                <ul class="modal-lista">
                    <li>Gestão de turmas</li>
                    <li>Gestão de alunos</li>
                    <li>Biblioteca de cursos</li>
                    <li>Painel educacional</li>
                </ul>
                <button class="modal-botao">Solicitar Contato</button>
            `,
        },
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
        this.#modal = document.getElementById('modal');
        this.#modalTitulo = document.getElementById('modalTitulo');
        this.#modalCorpo = document.getElementById('modalCorpo');
        this._initEventListeners();
        this._renderCourseCatalog();
    }

    _initEventListeners() {
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

        if (tipo === 'login') {
            this.#modalCorpo.querySelector('#loginBtn')
                ?.addEventListener('click', () => this._validateLogin());
        }

        if (tipo === 'profile') {
            this.#modalCorpo.querySelector('#logoutBtn')
                ?.addEventListener('click', () => this._logout());
        }
    }

    _closeModal() {
        this.#modal.classList.remove('ativo');
    }

    _validateLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const senha = document.getElementById('loginSenha').value.trim();
        const user = Session.authenticate(email, senha);

        if (!user) {
            alert('E-mail ou senha inválidos.');
            return;
        }

        Session.set(user);
        Session.redirectByRole(user);
    }

    _logout() {
        this._closeModal();
        Session.clear();
        alert('Você saiu com sucesso.');
        window.location.href = '../../index.html';
    }

    _renderCourseCatalog() {
        const courses = CoursesDB.load();
        if (!courses.length) return;

        document.getElementById('cursosCatalogo').style.display = '';
        const grid = document.getElementById('cursosGrid');
        grid.innerHTML = courses.map(c => `
            <div class="curso-card-landing">
                <div class="curso-card-placeholder-landing">
                    <span>${c.topicInitial}</span>
                </div>
                <h3>${Dom.escHtml(c.name)}</h3>
                <p>${Dom.escHtml(c.topic)}</p>
                <span class="curso-card-meta">${c.lessonCount} aula${c.lessonCount !== 1 ? 's' : ''}</span>
            </div>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => new LandingPage());
