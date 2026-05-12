import { useEffect, useRef, useState } from 'react'
import {
  Loader2, CheckCircle2, SkipForward, AlertCircle,
  Info, ChevronUp, ChevronDown, X, Clock,
} from 'lucide-react'

const LOG_ICONS = {
  add:   { icon: CheckCircle2, cls: 'text-emerald-400' },
  skip:  { icon: SkipForward,  cls: 'text-slate-500'   },
  info:  { icon: Info,         cls: 'text-radar-400'   },
  error: { icon: AlertCircle,  cls: 'text-red-400'     },
}

function LogEntry({ entry }) {
  const { icon: Icon, cls } = LOG_ICONS[entry.type] || LOG_ICONS.info
  return (
    <div className={`flex items-start gap-2 py-0.5 text-xs ${entry.type === 'skip' ? 'opacity-35' : ''}`}>
      <span className="text-slate-600 font-mono w-9 shrink-0">{entry.time}s</span>
      <Icon size={11} className={`${cls} shrink-0 mt-0.5`} />
      <span className={
        entry.type === 'add'   ? 'text-slate-200' :
        entry.type === 'error' ? 'text-red-300'   : 'text-slate-400'
      }>
        {entry.text}
      </span>
    </div>
  )
}

export default function ScrapingProgress({ loading, progress, logs }) {
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const logsEndRef = useRef(null)

  // Auto-expand when scraping starts, reset dismiss on new search
  useEffect(() => {
    if (loading) {
      setExpanded(true)
      setDismissed(false)
    }
  }, [loading])

  // Auto-scroll when expanded
  useEffect(() => {
    if (expanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [logs.length, expanded])

  const visible = (loading || logs.length > 0) && !dismissed
  if (!visible) return null

  const isActive  = loading && progress
  const pct       = progress?.percent ?? 0
  const addedCount  = progress?.added   ?? logs.filter(l => l.type === 'add').length
  const skippedCount= progress?.skipped ?? logs.filter(l => l.type === 'skip').length

  return (
    <div className="absolute bottom-5 right-5 z-[1000] w-80 pointer-events-auto">
      <div className="bg-slate-900/95 backdrop-blur border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">

        {/* ── Header / collapsed pill ── */}
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            {/* Status icon */}
            {isActive
              ? <Loader2 size={13} className="text-radar-400 animate-spin shrink-0" />
              : <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            }

            {/* Current message */}
            <span className="flex-1 text-xs font-medium text-slate-200 truncate min-w-0">
              {isActive ? (progress.message || 'Coletando...') : 'Scraping concluído'}
            </span>

            {/* Elapsed */}
            {progress?.elapsed && (
              <span className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                <Clock size={10} />{progress.elapsed}
              </span>
            )}

            {/* Expand / collapse */}
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1 rounded-md hover:bg-slate-700 transition-colors shrink-0"
              title={expanded ? 'Recolher' : 'Expandir'}
            >
              {expanded
                ? <ChevronDown size={13} className="text-slate-400" />
                : <ChevronUp   size={13} className="text-slate-400" />
              }
            </button>

            {/* Dismiss — only when idle */}
            {!loading && (
              <button
                onClick={() => setDismissed(true)}
                className="p-1 rounded-md hover:bg-slate-700 transition-colors shrink-0"
                title="Fechar"
              >
                <X size={13} className="text-slate-500 hover:text-slate-300" />
              </button>
            )}
          </div>

          {/* Mini progress bar — always visible */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-700/80 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: isActive ? `${pct}%` : '100%',
                  background: isActive
                    ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                    : 'linear-gradient(90deg, #34d399, #10b981)',
                }}
              />
            </div>
            {isActive && progress?.total > 0 && (
              <span className="text-xs font-mono text-slate-500 shrink-0">
                {progress.current}/{progress.total}
              </span>
            )}
          </div>
        </div>

        {/* ── Expandable body ── */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: expanded ? '360px' : '0px' }}
        >
          {/* Counters */}
          <div className="flex gap-2 px-3 pb-2">
            <span className="tag bg-emerald-900/30 text-emerald-400">
              ✓ {addedCount} adicionados
            </span>
            <span className="tag bg-slate-700/50 text-slate-500">
              ⏭ {skippedCount} ignorados
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700/50" />

          {/* Log stream */}
          <div className="max-h-56 overflow-y-auto px-3 py-2 font-mono space-y-0.5">
            {logs.length === 0 && isActive && (
              <p className="text-xs text-slate-500 py-3 text-center">
                Aguardando resultados...
              </p>
            )}
            {logs.map((entry, i) => (
              <LogEntry key={i} entry={entry} />
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>
    </div>
  )
}
