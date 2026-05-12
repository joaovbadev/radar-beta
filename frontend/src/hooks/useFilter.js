import { useState, useMemo } from 'react'

const INITIAL = {
  hasPhone:   false,
  hasWebsite: false,
  hasSocial:  false,
  hasEmail:   false,
  hasCoords:  false,
}

function passes(loc, filters) {
  if (filters.hasPhone   && !loc.telefone?.trim()) return false
  if (filters.hasWebsite && !loc.website?.trim())  return false
  if (filters.hasSocial  && !loc.instagram && !loc.facebook && !loc.tiktok && !loc.youtube && !loc.linkedin) return false
  if (filters.hasEmail   && !loc.email?.trim())    return false
  if (filters.hasCoords  && (!loc.latitude || !loc.longitude)) return false
  return true
}

export function useFilter(locations) {
  const [filters, setFilters] = useState(INITIAL)

  const activeCount = Object.values(filters).filter(Boolean).length

  function toggle(key) {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function clearAll() {
    setFilters(INITIAL)
  }

  const filtered = useMemo(
    () => activeCount === 0 ? locations : locations.filter(l => passes(l, filters)),
    [locations, filters, activeCount],
  )

  return { filters, filtered, activeCount, toggle, clearAll }
}
