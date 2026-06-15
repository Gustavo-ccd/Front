class Dom {
    static escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    static toggleModal(el, show) {
        el.classList.toggle('modal-active', show);
        el.setAttribute('aria-hidden', String(!show));
    }
}
