import { describe, expect, test } from 'vitest'

import type { FinderShop } from '../../domain/ramenMap'
import { createShopPopupContent } from './mapPopupContent'

const maliciousShop: FinderShop = {
  shopId: 'malicious-shop',
  status: 'published',
  region: '台中市',
  regionCode: 'taichung',
  district: '<img src=x onerror=alert(1)>',
  areaTag: '<script>alert(1)</script>',
  name: '<img src=x onerror=alert(1)>安全拉麵',
  styleCode: 'RWHT',
  styleCodes: ['RWHT'],
  style4char: '<b>濃白重口型</b>',
  styleFamily: '濃白系',
  address: '台中市',
  website: 'https://example.com',
  mapUrl: 'https://www.openstreetmap.org/node/1',
  sourceUrls: ['https://example.com', 'https://www.openstreetmap.org/node/1'],
  verifiedAt: '2026-07-10',
}

describe('createShopPopupContent', () => {
  test('renders untrusted shop text as text instead of HTML', () => {
    const content = createShopPopupContent(maliciousShop)

    expect(content.querySelector('img')).toBeNull()
    expect(content.querySelector('script')).toBeNull()
    expect(content.querySelector('strong')).toHaveTextContent(
      '<img src=x onerror=alert(1)>安全拉麵',
    )
    expect(content).toHaveTextContent('<b>濃白重口型</b>')
    expect(content).toHaveTextContent('<script>alert(1)</script>')
  })
})
