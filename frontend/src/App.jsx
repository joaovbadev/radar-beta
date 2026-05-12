import { useState, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import Sidebar          from './components/Sidebar'
import MapView          from './components/MapView'
import DetailPanel      from './components/DetailPanel'
import OpportunityRadar from './components/OpportunityRadar'
import LoadingOverlay    from './components/LoadingOverlay'
import ScrapingProgress  from './components/ScrapingProgress'
import { useSearch }     from './hooks/useSearch'
import { useFilter }     from './hooks/useFilter'

export default function App() {
  const { locations, loading, progress, logs, source, error, search } = useSearch()
  const { filters, filtered, activeCount, toggle, clearAll } = useFilter(locations)
  const [selectedLocation, setSelectedLocation] = useState(null)

  const handleSearch = useCallback((city, category) => {
    setSelectedLocation(null)
    search(city, category)
  }, [search])

  const handleSelectLocation = useCallback((loc) => {
    setSelectedLocation(prev => prev?.maps_url === loc.maps_url ? null : loc)
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar
        locations={locations}
        filtered={filtered}
        filters={filters}
        activeFilterCount={activeCount}
        onToggleFilter={toggle}
        onClearFilters={clearAll}
        loading={loading}
        progress={progress}
        logs={logs}
        source={source}
        onSearch={handleSearch}
        onSelectLocation={handleSelectLocation}
        selectedLocation={selectedLocation}
      />

      <main className="flex-1 relative overflow-hidden">
        <MapView
          locations={filtered}
          selectedLocation={selectedLocation}
          onSelectLocation={handleSelectLocation}
        />

        <OpportunityRadar locations={filtered} total={locations.length} />

        <LoadingOverlay loading={loading} progress={progress} />

        {/* Floating scraping log — bottom-right, expandable */}
        <ScrapingProgress loading={loading} progress={progress} logs={logs} />
      </main>

      {selectedLocation && (
        <DetailPanel
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#34d399', secondary: '#1e293b' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#1e293b' } },
        }}
      />
    </div>
  )
}
