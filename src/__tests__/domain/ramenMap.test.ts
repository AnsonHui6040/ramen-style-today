import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import {
  assertFinderRegionData,
  filterFinderShops,
  type FinderRegionData,
  type FinderShop,
} from '../../domain/ramenMap'

const validShop: FinderShop = {
  shopId: 'tcg-west-menya-kokoro',
  status: 'published',
  region: '台中市',
  regionCode: 'taichung',
  district: '西區',
  areaTag: '勤美',
  name: '麵屋心',
  styleCode: 'RWHT',
  styleCodes: ['RWHT', 'RKHT'],
  style4char: '濃白重口型',
  styleFamily: '濃白系',
  address: '台中市西區範例路1號',
  lat: 24.15,
  lng: 120.67,
  openHours: '請查看官方頁面',
  website: 'https://example.com/official',
  mapUrl: 'https://www.openstreetmap.org/?mlat=24.15&mlon=120.67',
  sourceUrls: [
    'https://example.com/official',
    'https://www.openstreetmap.org/node/1',
  ],
  verifiedAt: '2026-07-09',
}

function createRegionData(overrides: Partial<FinderRegionData> = {}): FinderRegionData {
  return {
    region: '台中市',
    regionCode: 'taichung',
    updatedAt: '2026-07-09',
    defaultMap: {
      lat: 24.1617,
      lng: 120.6468,
      zoom: 12,
    },
    shopCount: 1,
    shops: [validShop],
    ...overrides,
  }
}

describe('ramen map domain', () => {
  test('accepts a verified shop with a primary and multiple supported style codes', () => {
    expect(() => assertFinderRegionData(createRegionData(), ['RWHT', 'RKHT'])).not.toThrow()
  })

  test('rejects duplicate shops and mismatched shop counts', () => {
    const duplicate = createRegionData({
      shopCount: 1,
      shops: [validShop, { ...validShop }],
    })

    expect(() => assertFinderRegionData(duplicate, ['RWHT', 'RKHT'])).toThrow(
      'duplicate shop id',
    )
  })

  test('rejects missing sources, coordinates, invalid styles, and example content', () => {
    const invalidCases: Array<[Partial<FinderShop>, string]> = [
      [{ sourceUrls: [] }, 'source URL'],
      [{ sourceUrls: [validShop.website] }, 'OpenStreetMap source'],
      [
        {
          website: 'https://example.com/another-official-page',
          sourceUrls: validShop.sourceUrls,
        },
        'official website in sourceUrls',
      ],
      [{ lat: undefined }, 'coordinates'],
      [{ styleCode: 'UNKNOWN', styleCodes: ['UNKNOWN'] }, 'unsupported style code'],
      [{ styleCode: 'RKHT', styleCodes: ['RWHT'] }, 'primary style'],
      [{ name: 'Example Ramen' }, 'placeholder content'],
    ]

    for (const [shopOverrides, message] of invalidCases) {
      const data = createRegionData({
        shops: [{ ...validShop, ...shopOverrides }],
      })

      expect(() => assertFinderRegionData(data, ['RWHT', 'RKHT'])).toThrow(message)
    }
  })

  test('matches shops by any supported style and searchable shop text', () => {
    const shops = [
      validShop,
      {
        ...validShop,
        shopId: 'tcg-north-clear',
        name: '清湯製作所',
        district: '北區',
        styleCode: 'CKLF',
        styleCodes: ['CKLF'],
        style4char: '清亮細緻型',
        styleFamily: '清亮系',
      },
    ]

    expect(filterFinderShops(shops, ['RKHT'], '')).toEqual([validShop])
    expect(filterFinderShops(shops, [], '北區')).toEqual([shops[1]])
    expect(filterFinderShops(shops, [], '濃白重口')).toEqual([validShop])
  })
})

describe('published Taichung ramen data', () => {
  test('contains 30 to 50 verified, non-placeholder shops', () => {
    const dataPath = resolve('public/ramen-map/data/taichung.json')
    const metaPath = resolve('public/ramen-map/data/meta.json')
    const profilePath = resolve('public/ramen-map/data/type-profiles.json')
    const data = JSON.parse(readFileSync(dataPath, 'utf8')) as FinderRegionData
    const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as {
      regions: Array<{ regionCode: string; shopCount: number }>
    }
    const profileCodes = (
      JSON.parse(readFileSync(profilePath, 'utf8')) as Array<{ code: string }>
    ).map((profile) => profile.code)

    expect(data.shops.length).toBeGreaterThanOrEqual(30)
    expect(data.shops.length).toBeLessThanOrEqual(50)
    expect(
      meta.regions.find((region) => region.regionCode === data.regionCode)?.shopCount,
    ).toBe(data.shopCount)
    expect(() => assertFinderRegionData(data, profileCodes)).not.toThrow()
  })
})
