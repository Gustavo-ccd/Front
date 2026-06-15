class VideoDB {
    static #db = null;
    static #DB_NAME = 'pascal_videos';
    static #STORE_NAME = 'videos';

    static open() {
        if (this.#db) return Promise.resolve(this.#db);
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.#DB_NAME, 1);
            req.onupgradeneeded = e => e.target.result.createObjectStore(this.#STORE_NAME);
            req.onsuccess = e => { this.#db = e.target.result; resolve(this.#db); };
            req.onerror = () => reject(req.error);
        });
    }

    static async save(key, blob) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.#STORE_NAME, 'readwrite');
            tx.objectStore(this.#STORE_NAME).put(blob, key);
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }

    static async get(key) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.#STORE_NAME, 'readonly');
            const req = tx.objectStore(this.#STORE_NAME).get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }

    static async remove(key) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.#STORE_NAME, 'readwrite');
            tx.objectStore(this.#STORE_NAME).delete(key);
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }
}
