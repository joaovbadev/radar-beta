import axios from 'axios'

const BASE = '/api'

const http = axios.create({ baseURL: BASE, timeout: 15000 })

export const api = {
  getCategories: () => http.get('/categories').then(r => r.data),
  getCities:     () => http.get('/cities').then(r => r.data),
  getStats:      () => http.get('/stats').then(r => r.data),

  getLocations: (city, category) =>
    http.get('/locations', { params: { city, category } }).then(r => r.data),

  /** Blocking search — returns when scraping finishes */
  search: (city, category) =>
    http.post('/search', { city, category }, { timeout: 300_000 }).then(r => r.data),
}

/**
 * SSE streaming search.
 * Returns an EventSource. Caller must call .close() when done.
 *
 * @param {string} city
 * @param {string} category
 * @param {{ onFound, onItem, onComplete, onError }} callbacks
 */
export function streamSearch(city, category, { onFound, onItem, onComplete, onError }) {
  const url = `${BASE}/search/stream`

  // SSE requires GET, but our endpoint is POST.
  // We use a workaround: send a regular fetch with ReadableStream.
  const controller = new AbortController()

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city, category }),
    signal: controller.signal,
  })
    .then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'found')    onFound?.(event)
            if (event.type === 'item')     onItem?.(event)
            if (event.type === 'complete') onComplete?.(event)
            if (event.type === 'error')    onError?.(event)
          } catch {}
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') onError?.({ message: err.message })
    })

  return { close: () => controller.abort() }
}
