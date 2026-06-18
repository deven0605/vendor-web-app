import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import styles from './KitchenMap.module.css'

// ── Fix Leaflet default marker icons broken by Vite's asset bundling ─────────
import markerIconPng from 'leaflet/dist/images/marker-icon.png'
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png'

const defaultIcon = L.icon({
  iconUrl: markerIconPng,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MapLocation {
  lat: number
  lng: number
  streetAddress?: string
  city?: string
  state?: string
  pincode?: string
}

interface Props {
  onLocationSelect: (loc: MapLocation) => void
  initialPosition?: [number, number]
}

// ── Nominatim helpers ─────────────────────────────────────────────────────────

const NOMINATIM = 'https://nominatim.openstreetmap.org'
const HEADERS = { 'Accept-Language': 'en', 'User-Agent': 'ThaliCloud-VendorPortal/1.0' }

async function reverseGeocode(lat: number, lng: number): Promise<Partial<MapLocation>> {
  try {
    const res = await fetch(
      `${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: HEADERS },
    )
    const data = await res.json()
    const a = data.address ?? {}
    return {
      streetAddress: [a.road, a.neighbourhood, a.suburb].filter(Boolean).join(', '),
      city: a.city ?? a.town ?? a.village ?? a.county ?? '',
      state: a.state ?? '',
      pincode: a.postcode ?? '',
    }
  } catch {
    return {}
  }
}

async function searchPlace(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`,
      { headers: HEADERS },
    )
    const results = await res.json()
    if (!results.length) return null
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
  } catch {
    return null
  }
}

// ── Click handler (must be inside MapContainer) ───────────────────────────────

interface ClickHandlerProps {
  onSelect: (lat: number, lng: number) => void
}

function ClickHandler({ onSelect }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// ── Fly-to controller (must be inside MapContainer) ───────────────────────────

interface FlyToProps {
  target: [number, number] | null
}

function FlyTo({ target }: FlyToProps) {
  const map = useMap()
  const prevRef = useRef<[number, number] | null>(null)
  useEffect(() => {
    if (target && target !== prevRef.current) {
      map.flyTo(target, 15, { duration: 1.2 })
      prevRef.current = target
    }
  }, [map, target])
  return null
}

// ── Main Component ────────────────────────────────────────────────────────────

const PUNE_CENTER: [number, number] = [18.5204, 73.8567]

export default function KitchenMap({ onLocationSelect, initialPosition }: Props) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialPosition ?? null,
  )
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  const handleMapClick = async (lat: number, lng: number) => {
    const pos: [number, number] = [lat, lng]
    setPosition(pos)
    setGeocoding(true)
    const addr = await reverseGeocode(lat, lng)
    setGeocoding(false)
    onLocationSelect({ lat, lng, ...addr })
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    const result = await searchPlace(searchQuery)
    setSearching(false)
    if (result) {
      const pos: [number, number] = [result.lat, result.lng]
      setPosition(pos)
      setFlyTarget(pos)
      const addr = await reverseGeocode(result.lat, result.lng)
      onLocationSelect({ lat: result.lat, lng: result.lng, ...addr })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const hintText = geocoding
    ? 'Fetching address…'
    : position
    ? `📍 ${position[0].toFixed(5)}, ${position[1].toFixed(5)} — location selected`
    : 'Click anywhere on the map to set your kitchen location'

  return (
    <div className={styles.wrapper}>
      {/* Search bar */}
      <div className={styles.searchBar}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.searchInput}
          placeholder="Search area, landmark, or locality"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className={styles.searchBtn}
          onClick={handleSearch}
          disabled={searching || !searchQuery.trim()}
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {/* Map */}
      <MapContainer
        center={initialPosition ?? PUNE_CENTER}
        zoom={13}
        className={styles.map}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onSelect={handleMapClick} />
        <FlyTo target={flyTarget} />
        {position && <Marker position={position} icon={defaultIcon} />}
      </MapContainer>

      {/* Hint */}
      <div className={position ? styles.hintSelected : styles.hint}>
        {hintText}
      </div>
    </div>
  )
}
