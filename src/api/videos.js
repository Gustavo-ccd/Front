import VideoDB from '../lib/VideoDB'

export async function getVideo(key) {
  try {
    const data = await VideoDB.get(key)
    return { data: data || null, error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export async function saveVideo(key, blob) {
  try {
    await VideoDB.save(key, blob)
    return { data: true, error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export async function removeVideo(key) {
  try {
    await VideoDB.remove(key)
    return { data: true, error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}
