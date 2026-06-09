import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { styleCatalog } from '../../config/styles'
import type { RankedStyle } from '../../domain/types'
import { getDictionary, localizeStyle, type Locale } from '../../i18n'

interface FinderRegion {
  region: string
  regionCode: string
  shopCount: number
  dataPath: string
  defaultMap?: FinderMapPosition
}

interface FinderMeta {
  regions: FinderRegion[]
}

interface FinderMapPosition {
  lat: number
  lng: number
  zoom?: number
}

interface FinderRegionData {
  region: string
  regionCode: string
  updatedAt: string
  defaultMap?: FinderMapPosition
  shops: FinderShop[]
}

interface FinderShop {
  shopId: string
  name: string
  nameOriginal?: string
  styleCode?: string
  style4char?: string
  styleFamily?: string
  rating?: number
  ratingCount?: number
  priceRangeLabel?: string
  address?: string
  district?: string
  areaTag?: string
  lat?: number
  lng?: number
  openHours?: string
  website?: string
  mapUrl?: string
  notes?: string
  lastVerified?: string
}

interface RamenFinderMapProps {
  result: RankedStyle
  locale: Locale
}

const DATA_ROOT = '/ramen-map/data'
const DEFAULT_REGION = 'taichung'

const CURRENT_STYLE_TO_FINDER_CODES: Record<string, readonly string[]> = {
  'shoyu-chintan': ['CKLF', 'CKLT', 'CKHF', 'CKHT'],
  'shio-chintan': ['CKLF', 'CKLT', 'CKHF', 'CKHT'],
  miso: ['CWLT', 'CWHT', 'RWLT', 'RWHT'],
  tonkotsu: ['RWLF', 'RWLT', 'RWHF', 'RWHT'],
  'chicken-chintan': ['CKLF', 'CKLT', 'CKHF', 'CKHT'],
  'chicken-paitan': ['CWLF', 'CWLT', 'CWHF', 'CWHT', 'RWLF', 'RWLT'],
  'duck-chintan': ['CKLF', 'CKLT', 'CKHF', 'CKHT', 'RKHF'],
  'duck-paitan': ['CWLF', 'CWLT', 'CWHF', 'CWHT', 'RWHF', 'RWHT'],
  gyokai: ['RKLF', 'RKLT', 'RKHF', 'RKHT'],
  'shellfish-dashi': ['RKLF', 'RKLT', 'CKHF', 'CKHT'],
  iekei: ['RWLT', 'RWHF', 'RWHT'],
  jiro: ['RWLT', 'RWHT'],
  hakata: ['RWLF', 'RWHF', 'RWHT'],
  sapporo: ['CWLT', 'CWHT', 'RWLT', 'RWHT'],
  'konbusui-tsukemen': ['CKLT', 'CKHT', 'RKLT'],
  'gyokai-tsukemen': ['RKLT', 'RKHT', 'RWLT', 'RWHT'],
  aburasoba: ['RKLT', 'RKHT', 'RWLT'],
  'taiwan-mazesoba': ['RWLT', 'RWHT', 'RKHT'],
}

function getUpdatedDate(value: string, locale: Locale) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(locale)
}

function shopSearchText(shop: FinderShop) {
  return [
    shop.name,
    shop.nameOriginal,
    shop.address,
    shop.district,
    shop.areaTag,
    shop.styleCode,
    shop.style4char,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function getShopLabel(shop: FinderShop) {
  return [shop.styleCode, shop.style4char].filter(Boolean).join(' | ')
}

function getFinderCodesForCurrentStyle(styleId: string) {
  return CURRENT_STYLE_TO_FINDER_CODES[styleId] ?? []
}

function getCurrentStyleLabel(styleId: string) {
  return styleCatalog.find((style) => style.id === styleId)?.label ?? styleId
}

export function RamenFinderMap({ result, locale }: RamenFinderMapProps) {
  const dictionary = getDictionary(locale)
  const copy = dictionary.results.map
  const localizedResult = localizeStyle(result, locale)
  const initialCurrentStyleId = useMemo(() => result.style.id, [result])
  const isTestMode = import.meta.env.MODE === 'test'
  const [meta, setMeta] = useState<FinderMeta | null>(null)
  const [regionCode, setRegionCode] = useState(DEFAULT_REGION)
  const [regionData, setRegionData] = useState<FinderRegionData | null>(null)
  const [currentStyleId, setCurrentStyleId] = useState(initialCurrentStyleId)
  const [query, setQuery] = useState('')
  const [selectedShopId, setSelectedShopId] = useState<string>('')
  const mapNodeRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (isTestMode) {
      return
    }

    let ignore = false

    async function loadBaseData() {
      const nextMeta = await fetch(`${DATA_ROOT}/meta.json`)
        .then((response) => response.json() as Promise<FinderMeta>)

      if (!ignore) {
        setMeta(nextMeta)
      }
    }

    void loadBaseData()

    return () => {
      ignore = true
    }
  }, [isTestMode])

  useEffect(() => {
    if (isTestMode) {
      return
    }

    let ignore = false

    async function loadRegionData() {
      setRegionData(null)
      const nextRegionData = await fetch(`${DATA_ROOT}/${regionCode}.json`)
        .then((response) => response.json() as Promise<FinderRegionData>)

      if (!ignore) {
        setRegionData(nextRegionData)
        setSelectedShopId(nextRegionData.shops[0]?.shopId ?? '')
      }
    }

    void loadRegionData()

    return () => {
      ignore = true
    }
  }, [isTestMode, regionCode])

  const filteredShops = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const finderCodes = getFinderCodesForCurrentStyle(currentStyleId)

    return (regionData?.shops ?? [])
      .filter((shop) => !currentStyleId || finderCodes.includes(shop.styleCode ?? ''))
      .filter((shop) => !normalizedQuery || shopSearchText(shop).includes(normalizedQuery))
      .sort((left, right) => (right.rating ?? 0) - (left.rating ?? 0))
  }, [currentStyleId, query, regionData])

  const selectedShop = filteredShops.find((shop) => shop.shopId === selectedShopId) ?? filteredShops[0]
  const selectedStyleLabel = currentStyleId ? getCurrentStyleLabel(currentStyleId) : copy.allStyles
  const hasInteractiveMap = !isTestMode

  useEffect(() => {
    if (!hasInteractiveMap || !mapNodeRef.current || mapRef.current) {
      return
    }

    const map = L.map(mapNodeRef.current)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    mapRef.current = map
    markersLayerRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
      markersLayerRef.current = null
    }
  }, [hasInteractiveMap])

  useEffect(() => {
    if (!hasInteractiveMap || !mapRef.current || !markersLayerRef.current || !regionData) {
      return
    }

    const layer = markersLayerRef.current
    layer.clearLayers()

    const defaultMap = regionData.defaultMap
    if (defaultMap) {
      mapRef.current.setView(
        [defaultMap.lat, defaultMap.lng],
        defaultMap.zoom ?? 12,
      )
    }

    const bounds: L.LatLngTuple[] = []

    for (const shop of filteredShops) {
      if (typeof shop.lat !== 'number' || typeof shop.lng !== 'number') {
        continue
      }

      const marker = L.circleMarker([shop.lat, shop.lng], {
        radius: shop.shopId === selectedShop?.shopId ? 8 : 6,
        color: '#8b3f1d',
        fillColor: shop.shopId === selectedShop?.shopId ? '#c56a32' : '#fff6ea',
        fillOpacity: 0.92,
        weight: 2,
      }).bindPopup(`
        <strong>${shop.name}</strong><br />
        ${getShopLabel(shop)}<br />
        ${shop.district ?? ''} ${shop.areaTag ? `・${shop.areaTag}` : ''}
      `)

      marker.on('click', () => {
        setSelectedShopId(shop.shopId)
      })
      marker.addTo(layer)
      bounds.push([shop.lat, shop.lng])
    }

    if (bounds.length) {
      mapRef.current.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 })
    }

    window.requestAnimationFrame(() => {
      mapRef.current?.invalidateSize()
    })
  }, [filteredShops, hasInteractiveMap, regionData, selectedShop?.shopId])

  return (
    <section className="finder-map-section">
      <div className="section-heading">
        <p className="eyebrow">Ramen Finder Map</p>
        <h3>{copy.title}</h3>
        <p>{copy.body(localizedResult.label)}</p>
      </div>

      <div className="finder-controls">
        <label>
          <span>{copy.region}</span>
          <select value={regionCode} onChange={(event) => setRegionCode(event.target.value)}>
            {(meta?.regions ?? []).map((region) => (
              <option key={region.regionCode} value={region.regionCode}>
                {region.shopCount > 0
                  ? `${region.region} (${region.shopCount})`
                  : region.region}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>{copy.style}</span>
          <select value={currentStyleId} onChange={(event) => setCurrentStyleId(event.target.value)}>
            <option value="">{copy.allStyles}</option>
            {styleCatalog.map((style) => (
              <option key={style.id} value={style.id}>
                {style.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>{copy.search}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.search}
          />
        </label>
      </div>

      <div className="finder-map-grid">
        <div className="finder-map-frame">
          {hasInteractiveMap ? (
            <div ref={mapNodeRef} className="finder-map-canvas" />
          ) : (
            <p className="finder-map-placeholder">{copy.mapUnavailable}</p>
          )}
        </div>

        <aside className="finder-shop-panel">
          <div className="finder-shop-panel__summary">
            <strong>{copy.resultCount(filteredShops.length)}</strong>
            <span>
              {currentStyleId
                ? copy.selectedStyle(selectedStyleLabel)
                : copy.allStyles}
            </span>
            {regionData ? (
              <small>{copy.dataNote(getUpdatedDate(regionData.updatedAt, locale))}</small>
            ) : (
              <small>{copy.loading}</small>
            )}
          </div>

          <div className="finder-shop-list">
            {filteredShops.length ? filteredShops.slice(0, 8).map((shop) => (
              <button
                key={shop.shopId}
                type="button"
                className={shop.shopId === selectedShop?.shopId ? 'finder-shop-card active' : 'finder-shop-card'}
                onClick={() => setSelectedShopId(shop.shopId)}
              >
                <span className="finder-shop-card__topline">
                  <strong>{shop.name}</strong>
                  <span>{shop.styleCode}</span>
                </span>
                <span>{getShopLabel(shop)}</span>
                <span>
                  {copy.rating} {shop.rating ?? '-'} · {copy.reviews(shop.ratingCount ?? 0)}
                </span>
                <span>
                  {shop.district ?? regionData?.region}
                  {shop.areaTag ? ` · ${shop.areaTag}` : ''}
                </span>
              </button>
            )) : (
              <p className="catalog-empty">{regionData ? copy.noShops : copy.loading}</p>
            )}
          </div>
        </aside>
      </div>

      {selectedShop ? (
        <article className="finder-shop-detail">
          <div>
            <h4>{selectedShop.name}</h4>
            <p>{getShopLabel(selectedShop)}</p>
          </div>
          <div className="finder-shop-detail__facts">
            <span>{copy.rating} {selectedShop.rating ?? '-'}</span>
            <span>{copy.price} {selectedShop.priceRangeLabel ?? '-'}</span>
            <span>{copy.address} {selectedShop.address ?? '-'}</span>
          </div>
          <div className="finder-shop-detail__links">
            {selectedShop.mapUrl ? (
              <a href={selectedShop.mapUrl} target="_blank" rel="noreferrer">
                {copy.openMap}
              </a>
            ) : null}
            {selectedShop.website ? (
              <a href={selectedShop.website} target="_blank" rel="noreferrer">
                {copy.officialSite}
              </a>
            ) : null}
          </div>
        </article>
      ) : null}
    </section>
  )
}
