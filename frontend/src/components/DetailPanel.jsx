import { useEffect, useRef } from 'react'
import {
  X, Phone, Globe, Mail, MapPin, ExternalLink,
  Instagram, Facebook, Linkedin, Youtube,
  Copy, Check,
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(`${label} copiado!`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Não foi possível copiar')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-md hover:bg-slate-700 transition-colors"
      title={`Copiar ${label}`}
    >
      {copied
        ? <Check size={13} className="text-emerald-400" />
        : <Copy size={13} className="text-slate-500 hover:text-slate-300" />
      }
    </button>
  )
}

function InfoRow({ icon: Icon, label, value, href, copy }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-700/50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-radar-400 hover:text-radar-300 truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-slate-200 truncate">{value}</p>
        )}
      </div>
      {copy && <CopyButton text={value} label={label} />}
    </div>
  )
}

function SocialLink({ href, label, icon: Icon, color }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${color}`}
    >
      <Icon size={13} />
      {label}
    </a>
  )
}

export default function DetailPanel({ location, onClose }) {
  const panelRef = useRef(null)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function copyAllContact() {
    const lines = [
      location.nome,
      location.telefone && `Tel: ${location.telefone}`,
      location.email    && `Email: ${location.email}`,
      location.website  && `Site: ${location.website}`,
      location.endereco && `Endereço: ${location.endereco}`,
      location.maps_url && `Maps: ${location.maps_url}`,
    ].filter(Boolean)

    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => toast.success('Contato completo copiado!'))
      .catch(() => toast.error('Erro ao copiar'))
  }

  if (!location) return null

  const hasSocials = location.instagram || location.facebook ||
                     location.linkedin  || location.youtube  || location.tiktok

  return (
    <aside
      ref={panelRef}
      className="w-96 shrink-0 h-full flex flex-col bg-slate-900 border-l border-slate-800 overflow-hidden
                 animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="tag bg-radar-600/20 text-radar-300 mb-2 inline-flex">
              {location.categoria}
            </span>
            <h2 className="text-base font-bold text-white leading-snug">
              {location.nome || '—'}
            </h2>
            {location.cidade && (
              <p className="text-xs text-slate-500 mt-1">
                <MapPin size={11} className="inline mr-1" />
                {location.cidade}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Contact info */}
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Contato
          </h3>
          <InfoRow
            icon={Phone} label="Telefone"
            value={location.telefone} copy
          />
          <InfoRow
            icon={Mail} label="E-mail"
            value={location.email}
            href={location.email ? `mailto:${location.email}` : null}
            copy
          />
          <InfoRow
            icon={Globe} label="Website"
            value={location.website}
            href={location.website}
          />
          <InfoRow
            icon={MapPin} label="Endereço"
            value={location.endereco} copy
          />
        </div>

        {/* Social media */}
        {hasSocials && (
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Redes Sociais
            </h3>
            <div className="flex flex-wrap gap-2">
              <SocialLink
                href={location.instagram} label="Instagram" icon={Instagram}
                color="bg-pink-900/30 text-pink-400 hover:bg-pink-900/50"
              />
              <SocialLink
                href={location.facebook} label="Facebook" icon={Facebook}
                color="bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
              />
              <SocialLink
                href={location.linkedin} label="LinkedIn" icon={Linkedin}
                color="bg-sky-900/30 text-sky-400 hover:bg-sky-900/50"
              />
              <SocialLink
                href={location.youtube} label="YouTube" icon={Youtube}
                color="bg-red-900/30 text-red-400 hover:bg-red-900/50"
              />
              {location.tiktok && (
                <a
                  href={location.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                             bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  🎵 TikTok
                </a>
              )}
            </div>
          </div>
        )}

        {/* Coordinates */}
        {location.latitude && location.longitude && (
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Geolocalização
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 rounded-lg p-2.5">
                <p className="text-xs text-slate-500 mb-0.5">Latitude</p>
                <p className="text-sm font-mono text-slate-300">{location.latitude}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-2.5">
                <p className="text-xs text-slate-500 mb-0.5">Longitude</p>
                <p className="text-sm font-mono text-slate-300">{location.longitude}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-slate-800 space-y-2">
        {location.maps_url && (
          <a
            href={location.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary no-underline"
          >
            <ExternalLink size={15} />
            Abrir no Google Maps
          </a>
        )}
        <button
          onClick={copyAllContact}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                     bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium
                     rounded-xl transition-all duration-150 text-sm"
        >
          <Copy size={14} />
          Copiar Contato Completo
        </button>
      </div>
    </aside>
  )
}
