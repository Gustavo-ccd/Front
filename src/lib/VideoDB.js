let db = null
const DB_NAME = 'pascal_videos'
const STORE_NAME = 'videos'

function open() {
  if (db) return Promise.resolve(db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE_NAME)
    req.onsuccess = e => { db = e.target.result; resolve(db) }
    req.onerror = () => reject(req.error)
  })
}

const VideoDB = {
  async save(key, blob) {
    const database = await open()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(blob, key)
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
  },
  async get(key) {
    const database = await open()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    })
  },
  async remove(key) {
    const database = await open()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(key)
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
  },
}

export default VideoDB
