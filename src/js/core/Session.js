class Session {
    static #KEY = 'usuarioLogado';

    static #USERS = [
        { id: 1, nome: 'Ana Lima',        email: 'cliente@pascal.com',     senha: '123', tipo: 'cliente'      },
        { id: 2, nome: 'Carlos Ferreira', email: 'profissional@pascal.com', senha: '123', tipo: 'professor'    },
        { id: 3, nome: 'Escola Pascal',   email: 'educacional@pascal.com',  senha: '123', tipo: 'educacional'  },
    ];

    static get() {
        try {
            return JSON.parse(localStorage.getItem(this.#KEY));
        } catch {
            return null;
        }
    }

    static set(user) {
        localStorage.setItem(this.#KEY, JSON.stringify(user));
    }

    static clear() {
        localStorage.removeItem(this.#KEY);
    }

    static authenticate(email, senha) {
        return this.#USERS.find(u => u.email === email && u.senha === senha) || null;
    }

    static redirectByRole(user) {
        const isStudent = user.tipo === 'cliente';
        window.location.href = isStudent
            ? 'src/pages/user.html'
            : 'src/pages/administrative.html';
    }
}
