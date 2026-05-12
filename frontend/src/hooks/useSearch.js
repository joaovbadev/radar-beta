import { useState, useCallback, useRef } from 'react'
import { streamSearch } from '../services/api'

export function useSearch() {
  const [locations, setLocations]   = useState([])
  const [loading, setLoading]       = useState(false)
  const [progress, setProgress]     = useState(null)
  // { current, total, message, percent, elapsed, added, skipped }
  const [logs, setLogs]             = useState([])
  // [{ time, type: 'add'|'skip'|'info'|'error', text }]
  const [source, setSource]         = useState(null)
  const [error, setError]           = useState(null)

  const streamRef    = useRef(null)
  const startTimeRef = useRef(null)
  const accRef       = useRef([])     // accumulate locations without closure
  const countRef     = useRef({ added: 0, skipped: 0 })

  function pushLog(type, text) {
    const elapsed = startTimeRef.current
      ? ((Date.now() - startTimeRef.current) / 1000).toFixed(1)
      : '0.0'
    setLogs(prev => [...prev.slice(-199), { time: elapsed, type, text }])
  }

  const search = useCallback((city, category) => {
    if (!city || !category) return

    streamRef.current?.close()
    accRef.current   = []
    countRef.current = { added: 0, skipped: 0 }
    startTimeRef.current = Date.now()

    setLoading(true)
    setLocations([])
    setLogs([])
    setError(null)
    setSource(null)
    setProgress({ current: 0, total: 0, percent: 0, message: 'Conectando...', added: 0, skipped: 0, elapsed: '0s' })

    pushLog('info', `Buscando "${category}" em ${city}`)

    streamRef.current = streamSearch(city, category, {
      onFound: ({ total }) => {
        setProgress(p => ({
          ...p,
          total,
          message: `${total} locais encontrados — iniciando coleta`,
        }))
        pushLog('info', `${total} locais encontrados no Google Maps`)
      },

      onItem: ({ index, total, item, added }) => {
        if (item) {
          accRef.current.push(item)
          setLocations([...accRef.current])
        }
        if (added) {
          countRef.current.added++
          pushLog('add', item?.nome || '—')
        } else {
          countRef.current.skipped++
          pushLog('skip', item?.nome || 'duplicata ignorada')
        }

        const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(0)
        const pct     = total > 0 ? Math.round((index / total) * 100) : 0

        setProgress({
          current: index,
          total,
          percent: pct,
          message: item?.nome || `Processando ${index}/${total}`,
          added:   countRef.current.added,
          skipped: countRef.current.skipped,
          elapsed: `${elapsed}s`,
        })
      },

      onComplete: ({ locations: all, source: src, count }) => {
        const final = all?.length ? all : accRef.current
        setLocations(final)
        setSource(src)
        setLoading(false)
        setProgress(null)
        const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(0)
        pushLog('info', `Concluído: ${countRef.current.added} adicionados · ${countRef.current.skipped} ignorados · ${elapsed}s`)
      },

      onError: ({ message }) => {
        const msg = message || 'Erro desconhecido'
        setError(msg)
        setLoading(false)
        setProgress(null)
        pushLog('error', msg)
      },
    })
  }, [])

  const reset = useCallback(() => {
    streamRef.current?.close()
    accRef.current   = []
    countRef.current = { added: 0, skipped: 0 }
    setLocations([])
    setLoading(false)
    setProgress(null)
    setLogs([])
    setSource(null)
    setError(null)
  }, [])

  return { locations, loading, progress, logs, source, error, search, reset }
}
