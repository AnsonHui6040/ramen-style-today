export interface FinderMapPosition {
  lat: number
  lng: number
  zoom?: number
}

export interface FinderRegion {
  region: string
  regionCode: string
  shopCount: number
  dataPath: string
  defaultMap?: FinderMapPosition
}

export interface FinderMeta {
  regions: FinderRegion[]
}

export interface FinderShop {
  shopId: string
  status: 'published'
  region: string
  regionCode: string
  district: string
  areaTag?: string
  name: string
  nameOriginal?: string
  styleCode: string
  styleCodes: string[]
  style4char: string
  styleFamily: string
  address: string
  lat?: number
  lng?: number
  openHours?: string
  website: string
  mapUrl: string
  sourceUrls: string[]
  verifiedAt: string
  notes?: string
}

export interface FinderRegionData {
  region: string
  regionCode: string
  updatedAt: string
  defaultMap?: FinderMapPosition
  shopCount: number
  shops: FinderShop[]
}

const placeholderPattern = /example|範例|示例|測試店/i
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function assertFinderRegionData(
  data: FinderRegionData,
  supportedStyleCodes: readonly string[],
) {
  const shopIds = new Set<string>()

  for (const shop of data.shops) {
    if (shopIds.has(shop.shopId)) {
      throw new Error(`duplicate shop id: ${shop.shopId}`)
    }

    shopIds.add(shop.shopId)
  }

  if (data.shopCount !== data.shops.length) {
    throw new Error(
      `shop count mismatch: declared ${data.shopCount}, received ${data.shops.length}`,
    )
  }

  for (const shop of data.shops) {
    if (placeholderPattern.test(`${shop.name} ${shop.nameOriginal ?? ''} ${shop.notes ?? ''}`)) {
      throw new Error(`${shop.shopId} contains placeholder content`)
    }

    if (
      typeof shop.lat !== 'number' ||
      typeof shop.lng !== 'number' ||
      shop.lat < 23.9 ||
      shop.lat > 24.5 ||
      shop.lng < 120.4 ||
      shop.lng > 121.1
    ) {
      throw new Error(`${shop.shopId} has invalid Taichung coordinates`)
    }

    if (!shop.sourceUrls.length || shop.sourceUrls.some((url) => !isHttpsUrl(url))) {
      throw new Error(`${shop.shopId} must declare at least one valid source URL`)
    }

    if (!isHttpsUrl(shop.website) || !isHttpsUrl(shop.mapUrl)) {
      throw new Error(`${shop.shopId} must use valid https links`)
    }

    if (!shop.sourceUrls.includes(shop.website)) {
      throw new Error(`${shop.shopId} must include its official website in sourceUrls`)
    }

    if (!shop.sourceUrls.some((url) => url.startsWith('https://www.openstreetmap.org/'))) {
      throw new Error(`${shop.shopId} must include an OpenStreetMap source`)
    }

    if (!shop.styleCodes.length || !shop.styleCodes.includes(shop.styleCode)) {
      throw new Error(`${shop.shopId} styleCodes must contain its primary style`)
    }

    for (const styleCode of shop.styleCodes) {
      if (!supportedStyleCodes.includes(styleCode)) {
        throw new Error(`${shop.shopId} uses unsupported style code: ${styleCode}`)
      }
    }

    if (!isoDatePattern.test(shop.verifiedAt)) {
      throw new Error(`${shop.shopId} must use an ISO verifiedAt date`)
    }
  }
}

function shopSearchText(shop: FinderShop) {
  return [
    shop.name,
    shop.nameOriginal,
    shop.address,
    shop.district,
    shop.areaTag,
    shop.styleCode,
    shop.styleCodes.join(' '),
    shop.style4char,
    shop.styleFamily,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function filterFinderShops(
  shops: readonly FinderShop[],
  styleCodes: readonly string[],
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase()

  return shops
    .filter(
      (shop) =>
        !styleCodes.length ||
        styleCodes.some((styleCode) => shop.styleCodes.includes(styleCode)),
    )
    .filter((shop) => !normalizedQuery || shopSearchText(shop).includes(normalizedQuery))
    .sort(
      (left, right) =>
        left.district.localeCompare(right.district, 'zh-Hant') ||
        left.name.localeCompare(right.name, 'zh-Hant'),
    )
}
