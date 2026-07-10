import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { styleCatalog } from '../../config/styles'
import {
  filterFinderShops,
  getPopulatedFinderRegions,
  toSafeHttpsUrl,
  type FinderMeta,
  type FinderRegion,
  type FinderRegionData,
  type FinderShop,
} from '../../domain/ramenMap'
import type { RankedStyle } from '../../domain/types'
import {
  getDictionary,
  localizeStyle,
  localizeStyleDefinition,
  type Locale,
} from '../../i18n'
import { createShopPopupContent } from './mapPopupContent'

interface RamenFinderMapProps {
  result: RankedStyle
  locale: Locale
  initialRegionData?: FinderRegionData
}

const DATA_ROOT = `${import.meta.env.BASE_URL}ramen-map/data`
const DEFAULT_REGION = 'taichung'
const FALLBACK_REGION: FinderRegion = {
  region: '台中市',
  regionCode: DEFAULT_REGION,
  shopCount: 0,
  dataPath: `${DATA_ROOT}/${DEFAULT_REGION}.json`,
}

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

function getShopLabel(shop: FinderShop) {
  return [shop.style4char, shop.styleFamily].join(' · ')
}

function getFinderCodesForCurrentStyle(styleId: string) {
  return CURRENT_STYLE_TO_FINDER_CODES[styleId] ?? []
}

function getCurrentStyleLabel(styleId: string, locale: Locale) {
  const style = styleCatalog.find((candidate) => candidate.id === styleId)

  return style ? localizeStyleDefinition(style, locale).label : styleId
}

async function fetchMapJson<T>(path: string) {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(`Unable to load ${path}`)
  }

  return response.json() as Promise<T>
}

export function RamenFinderMap({
  result,
  locale,
  initialRegionData,
}: RamenFinderMapProps) {
  const dictionary = getDictionary(locale)
  const copy = dictionary.results.map
  const localizedResult = localizeStyle(result, locale)
  const initialCurrentStyleId = useMemo(() => result.style.id, [result])
  const isTestMode = import.meta.env.MODE === 'test'
  const [meta, setMeta] = useState<FinderMeta | null>(null)
  const [regionCode, setRegionCode] = useState(DEFAULT_REGION)
  const [regionData, setRegionData] = useState<FinderRegionData | null>(
    initialRegionData ?? null,
  )
  const [currentStyleId, setCurrentStyleId] = useState(initialCurrentStyleId)
  const [query, setQuery] = useState('')
  const [selectedShopId, setSelectedShopId] = useState<string>('')
  const [loadError, setLoadError] = useState(false)
  const mapNodeRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (isTestMode || initialRegionData) {
      return
    }

    let ignore = false

    async function loadBaseData() {
      try {
        const nextMeta = await fetchMapJson<FinderMeta>(`${DATA_ROOT}/meta.json`)

        if (!ignore) {
          setMeta(nextMeta)
          setLoadError(false)
        }
      } catch {
        if (!ignore) {
          setLoadError(true)
        }
      }
    }

    void loadBaseData()

    return () => {
      ignore = true
    }
  }, [initialRegionData, isTestMode])

  useEffect(() => {
    if (isTestMode || initialRegionData) {
      return
    }

    let ignore = false

    async function loadRegionData() {
      setRegionData(null)
      setLoadError(false)

      try {
        const nextRegionData = await fetchMapJson<FinderRegionData>(`${DATA_ROOT}/${regionCode}.json`)

        if (!ignore) {
          setRegionData(nextRegionData)
          setSelectedShopId(nextRegionData.shops[0]?.shopId ?? '')
        }
      } catch {
        if (!ignore) {
          setRegionData(null)
          setSelectedShopId('')
          setLoadError(true)
        }
      }
    }

    void loadRegionData()

    return () => {
      ignore = true
    }
  }, [initialRegionData, isTestMode, regionCode])

  const filteredShops = useMemo(() => {
    const finderCodes = getFinderCodesForCurrentStyle(currentStyleId)

    return filterFinderShops(
      regionData?.shops ?? [],
      currentStyleId ? finderCodes : [],
      query,
    )
  }, [currentStyleId, query, regionData])

  const selectedShop = filteredShops.find((shop) => shop.shopId === selectedShopId) ?? filteredShops[0]
  const selectedShopMapUrl = selectedShop ? toSafeHttpsUrl(selectedShop.mapUrl) : null
  const selectedShopWebsite = selectedShop ? toSafeHttpsUrl(selectedShop.website) : null
  const selectedStyleLabel = currentStyleId
    ? getCurrentStyleLabel(currentStyleId, locale)
    : copy.allStyles
  const hasInteractiveMap = !isTestMode
  const populatedRegions = getPopulatedFinderRegions(meta?.regions ?? [])
  const regionOptions = populatedRegions.length ? populatedRegions : [FALLBACK_REGION]

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
      }).bindPopup(createShopPopupContent(shop))

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
        <p className="eyebrow">{copy.eyebrow}</p>
        <h3>{copy.title}</h3>
        <p>{copy.body(localizedResult.label)}</p>
      </div>

      <div className="finder-controls">
        <label>
          <span>{copy.region}</span>
          <select value={regionCode} onChange={(event) => setRegionCode(event.target.value)}>
            {regionOptions.map((region) => (
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
                {localizeStyleDefinition(style, locale).label}
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
            ) : loadError ? (
              <small>{copy.mapLoadFailed}</small>
            ) : (
              <small>{copy.loading}</small>
            )}
          </div>

          <div className="finder-shop-list">
            {filteredShops.length ? filteredShops.map((shop) => (
              <button
                key={shop.shopId}
                type="button"
                className={shop.shopId === selectedShop?.shopId ? 'finder-shop-card active' : 'finder-shop-card'}
                aria-pressed={shop.shopId === selectedShop?.shopId}
                aria-controls="finder-shop-detail"
                onClick={() => setSelectedShopId(shop.shopId)}
              >
                <span className="finder-shop-card__topline">
                  <strong>{shop.name}</strong>
                  <span>{shop.styleFamily}</span>
                </span>
                <span>{getShopLabel(shop)}</span>
                <span>
                  {copy.verified(getUpdatedDate(shop.verifiedAt, locale))}
                </span>
                <span>
                  {shop.district ?? regionData?.region}
                  {shop.areaTag ? ` · ${shop.areaTag}` : ''}
                </span>
              </button>
            )) : (
              <p className="catalog-empty">
                {loadError ? copy.mapLoadFailed : regionData ? copy.noShops : copy.loading}
              </p>
            )}
          </div>
        </aside>
      </div>

      {selectedShop ? (
        <article id="finder-shop-detail" className="finder-shop-detail" aria-live="polite">
          <div>
            <h4>{selectedShop.name}</h4>
            <p>{getShopLabel(selectedShop)}</p>
          </div>
          <div className="finder-shop-detail__facts">
            <span>{copy.address} {selectedShop.address}</span>
            <span>{copy.verified(getUpdatedDate(selectedShop.verifiedAt, locale))}</span>
            <span>{selectedShop.openHours ?? copy.checkOfficialHours}</span>
          </div>
          <div className="finder-shop-detail__links">
            {selectedShopMapUrl ? (
              <a
                href={selectedShopMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={dictionary.app.opensInNewTab(copy.openMap)}
              >
                {copy.openMap}
              </a>
            ) : null}
            {selectedShopWebsite ? (
              <a
                href={selectedShopWebsite}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={dictionary.app.opensInNewTab(copy.officialInfo)}
              >
                {copy.officialInfo}
              </a>
            ) : null}
          </div>
        </article>
      ) : null}
    </section>
  )
}
