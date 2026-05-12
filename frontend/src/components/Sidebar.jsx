import { useState, useEffect, useRef } from "react";
import {
  Search,
  MapPin,
  Tag,
  Plus,
  Loader2,
  Building2,
  ChevronRight,
  Wifi,
  WifiOff,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { api } from "../services/api";
import toast from "react-hot-toast";

const SUGGESTED_CATEGORIES = [
  "restaurantes",
  "academias",
  "dentistas",
  "pet shop",
  "advogados",
  "clínicas",
  "supermercados",
  "salões de beleza",
  "barbearias",
  "farmácias",
  "hotéis",
  "imobiliárias",
];

// Filter chip definitions
const FILTER_DEFS = [
  {
    key: "hasPhone",
    label: "Com telefone",
    icon: "📞",
    activeClass: "bg-emerald-600/25 border-emerald-500/60 text-emerald-300",
  },
  {
    key: "hasWebsite",
    label: "Com website",
    icon: "🌐",
    activeClass: "bg-blue-600/25 border-blue-500/60 text-blue-300",
  },
  {
    key: "hasSocial",
    label: "Com social",
    icon: "📸",
    activeClass: "bg-pink-600/25 border-pink-500/60 text-pink-300",
  },
  {
    key: "hasEmail",
    label: "Com e-mail",
    icon: "📧",
    activeClass: "bg-amber-600/25 border-amber-500/60 text-amber-300",
  },
  {
    key: "hasCoords",
    label: "Com pin",
    icon: "📍",
    activeClass: "bg-radar-600/25 border-radar-500/60 text-radar-300",
  },
];

export default function Sidebar({
  locations,
  filtered,
  filters,
  activeFilterCount,
  onToggleFilter,
  onClearFilters,
  loading,
  progress,
  logs,
  source,
  onSearch,
  onSelectLocation,
  selectedLocation,
}) {
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [city, setCity] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const inputRef = useRef(null);

  useEffect(() => {
    Promise.all([api.getCities(), api.getCategories()])
      .then(([c, k]) => {
        setCities(c);
        setCategories(k);
      })
      .catch(() => toast.error("Não foi possível carregar dados do servidor"));
  }, []);

  useEffect(() => {
    if (!loading) {
      api
        .getCategories()
        .then(setCategories)
        .catch(() => {});
      api
        .getCities()
        .then(setCities)
        .catch(() => {});
    }
  }, [loading]);

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const activeCity = customCity.trim() || city;
  const activeCategory = customCategory.trim() || category;

  const filteredSuggestions = customCategory
    ? SUGGESTED_CATEGORIES.filter(
        (s) =>
          s.includes(customCategory.toLowerCase()) &&
          s !== customCategory.toLowerCase(),
      )
    : [];

  function handleSearch(e) {
    e.preventDefault();
    if (!activeCity) return toast.error("Selecione ou informe uma cidade");
    if (!activeCategory)
      return toast.error("Selecione ou informe uma categoria");
    setShowSuggestions(false);
    onSearch(activeCity, activeCategory);
  }

  function pickSuggestion(s) {
    setCustomCategory(s);
    setShowSuggestions(false);
    inputRef.current?.blur();
  }

  const showFilters = locations.length > 0;
  const displayList = filtered; // the list uses filtered locations
  const hiddenCount = locations.length - filtered.length;

  return (
    <aside className="w-80 shrink-0 h-full flex flex-col bg-slate-900 border-r border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-radar-600/20 flex items-center justify-center">
            <span className="text-radar-400 text-sm font-bold">⬡</span>
          </div>
          <h1 className="text-base font-bold text-white tracking-tight">
            Opportunity Radar
          </h1>
          <span title={isOnline ? "Online" : "Offline"} className="ml-auto">
            {isOnline ? (
              <Wifi size={14} className="text-emerald-400" />
            ) : (
              <WifiOff size={14} className="text-red-400" />
            )}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Prospecção comercial geolocalizada
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="px-4 pt-4 pb-3 space-y-3">
        {/* City */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            <MapPin size={11} className="inline mr-1" />
            Cidade
          </label>
          {cities.length > 0 && (
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setCustomCity("");
              }}
              className="select-field"
            >
              <option value="">Selecione uma cidade...</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            value={customCity}
            onChange={(e) => {
              setCustomCity(e.target.value);
              setCity("");
            }}
            placeholder={
              cities.length ? "Ou digite outra cidade..." : "Ex: Fortaleza, CE"
            }
            className={`input-field ${cities.length ? "mt-2" : ""}`}
          />
        </div>

        {/* Category */}
        <div className="relative">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            <Tag size={11} className="inline mr-1" />
            Categoria
          </label>
          {categories.length > 0 && (
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setCustomCategory("");
              }}
              className="select-field"
            >
              <option value="">Selecione uma categoria...</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <div className="relative mt-2">
            <input
              ref={inputRef}
              type="text"
              value={customCategory}
              onChange={(e) => {
                setCustomCategory(e.target.value);
                setCategory("");
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={
                categories.length ? "Ou nova categoria..." : "Ex: barbearias"
              }
              className="input-field pr-8"
            />
            <Plus
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                {filteredSuggestions.slice(0, 5).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={() => pickSuggestion(s)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Buscando...
            </>
          ) : (
            <>
              <Search size={16} /> Buscar
            </>
          )}
        </button>
      </form>

      {/* ── Filter chips ── */}
      {showFilters && (
        <div className="px-4 pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <SlidersHorizontal size={11} />
              Filtros
            </span>
            {activeFilterCount > 0 && (
              <button
                onClick={onClearFilters}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={10} /> Limpar
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTER_DEFS.map(({ key, label, icon, activeClass }) => {
              const active = filters[key];
              return (
                <button
                  key={key}
                  onClick={() => onToggleFilter(key)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150
                    ${
                      active
                        ? activeClass
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                    }`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Filter result count */}
          {activeFilterCount > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              <span className="text-slate-300 font-medium">
                {filtered.length}
              </span>{" "}
              de {locations.length}
              {hiddenCount > 0 && (
                <span className="text-slate-600"> · {hiddenCount} ocultos</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Results list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {displayList.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3 mt-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Resultados
              </span>
              <span className="tag bg-radar-600/20 text-radar-300">
                {displayList.length}
              </span>
            </div>
            <div className="space-y-2">
              {displayList.map((loc, i) => (
                <LocationCard
                  key={loc.maps_url || i}
                  location={loc}
                  selected={selectedLocation?.maps_url === loc.maps_url}
                  onClick={() => onSelectLocation(loc)}
                />
              ))}
            </div>
          </>
        )}

        {!loading && displayList.length === 0 && locations.length === 0 && (
          <div className="sidebar-section flex flex-col items-center py-10 text-center">
            <Building2 size={32} className="text-slate-700 mb-3" />
            <p className="text-sm text-slate-500">
              Nenhum resultado ainda.
              <br />
              Escolha uma cidade e categoria.
            </p>
          </div>
        )}

        {!loading && displayList.length === 0 && locations.length > 0 && (
          <div className="sidebar-section flex flex-col items-center py-8 text-center">
            <SlidersHorizontal size={28} className="text-slate-700 mb-3" />
            <p className="text-sm text-slate-500">
              Nenhum resultado com os filtros ativos.
            </p>
            <button
              onClick={onClearFilters}
              className="mt-3 text-xs text-radar-400 hover:text-radar-300 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function LocationCard({ location, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-3 border transition-all duration-150 group
        ${
          selected
            ? "bg-radar-600/20 border-radar-500/50"
            : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-800 hover:border-slate-600"
        }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate leading-snug">
            {location.nome || "—"}
          </p>
          {location.endereco && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {location.endereco}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {location.telefone && (
              <span className="tag bg-emerald-900/40 text-emerald-400">
                📞 {location.telefone}
              </span>
            )}
            {location.website && (
              <span className="tag bg-blue-900/40 text-blue-400">🌐</span>
            )}
            {location.instagram && (
              <span className="tag bg-pink-900/40 text-pink-400">📸</span>
            )}
            {location.email && (
              <span className="tag bg-amber-900/40 text-amber-400">📧</span>
            )}
          </div>
        </div>
        <ChevronRight
          size={14}
          className={`shrink-0 mt-0.5 transition-colors ${selected ? "text-radar-400" : "text-slate-600 group-hover:text-slate-400"}`}
        />
      </div>
    </button>
  );
}
