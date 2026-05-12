import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'

// Fix default Leaflet marker icons in Vite
import markerIcon2x   from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon     from 'leaflet/dist/images/marker-icon.png'
import markerShadow   from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
})

const customIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const selectedIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width:34px;height:34px;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:3px solid white;
    box-shadow:0 4px 15px rgba(99,102,241,0.6);
  "></div>`,
  iconSize:   [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -38],
})

// Fly to selected marker
function FlyToMarker({ location }) {
  const map = useMap()
  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      const lat = parseFloat(location.latitude)
      const lng = parseFloat(location.longitude)
      if (!isNaN(lat) && !isNaN(lng)) {
        map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 })
      }
    }
  }, [location, map])
  return null
}

// Fit map to all markers
function FitBounds({ locations }) {
  const map = useMap()
  const prevCount = useRef(0)

  useEffect(() => {
    const valid = locations.filter(
      l => l.latitude && l.longitude &&
           !isNaN(parseFloat(l.latitude)) && !isNaN(parseFloat(l.longitude))
    )
    if (valid.length > 0 && valid.length !== prevCount.current) {
      prevCount.current = valid.length
      const bounds = L.latLngBounds(
        valid.map(l => [parseFloat(l.latitude), parseFloat(l.longitude)])
      )
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 })
    }
  }, [locations, map])

  return null
}

export default function MapView({ locations, selectedLocation, onSelectLocation }) {
  const validLocations = locations.filter(
    l => l.latitude && l.longitude &&
         !isNaN(parseFloat(l.latitude)) && !isNaN(parseFloat(l.longitude))
  )

  return (
    <MapContainer
      center={[-15.793889, -47.882778]}
      zoom={4}
      className="w-full h-full"
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />

      <FitBounds locations={validLocations} />
      {selectedLocation && <FlyToMarker location={selectedLocation} />}

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        showCoverageOnHover={false}
      >
        {validLocations.map((loc, i) => {
          const lat = parseFloat(loc.latitude)
          const lng = parseFloat(loc.longitude)
          const isSelected = selectedLocation?.maps_url === loc.maps_url

          return (
            <Marker
              key={loc.maps_url || i}
              position={[lat, lng]}
              icon={isSelected ? selectedIcon : customIcon}
              eventHandlers={{ click: () => onSelectLocation(loc) }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <p className="font-semibold text-slate-100 text-sm mb-1">
                    {loc.nome || '—'}
                  </p>
                  {loc.endereco && (
                    <p className="text-slate-400 text-xs mb-1.5">{loc.endereco}</p>
                  )}
                  {loc.telefone && (
                    <p className="text-emerald-400 text-xs">📞 {loc.telefone}</p>
                  )}
                  <button
                    onClick={() => onSelectLocation(loc)}
                    className="mt-2 text-xs text-radar-400 hover:text-radar-300 font-medium"
                  >
                    Ver detalhes →
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
