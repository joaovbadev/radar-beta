import { Loader2 } from 'lucide-react'

export default function LoadingOverlay({ loading, progress }) {
  if (!loading) return null

  const pct = progress?.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : null

  return (
    /* Floating banner at top of map — doesn't block interaction */
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
      <div className="flex items-center gap-3 px-4 py-2.5
                      bg-slate-900/95 backdrop-blur border border-radar-500/40
                      rounded-2xl shadow-2xl shadow-radar-900/50 min-w-64">
        {/* Pulsing dot */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-radar-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-radar-500" />
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-200 truncate">
            {progress?.message || 'Scraping em andamento...'}
          </p>
          {pct !== null && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-radar-500 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 shrink-0 font-mono">
                {progress.current}/{progress.total}
              </span>
            </div>
          )}
        </div>

        <Loader2 size={14} className="text-radar-400 animate-spin shrink-0" />
      </div>
    </div>
  )
}
