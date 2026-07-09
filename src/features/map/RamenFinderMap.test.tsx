import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { canonicalFixtures } from '../../__tests__/lib/scoring/fixtures'
import type { FinderRegionData } from '../../domain/ramenMap'
import { scoreQuestionnaire } from '../../lib/scoring/scorer'
import { RamenFinderMap } from './RamenFinderMap'

const regionData: FinderRegionData = {
  region: '台中市',
  regionCode: 'taichung',
  updatedAt: '2026-07-09',
  shopCount: 1,
  shops: [
    {
      shopId: 'tcg-central-yoshi-ramen',
      status: 'published',
      region: '台中市',
      regionCode: 'taichung',
      district: '中區',
      areaTag: '台中車站',
      name: '有囍拉麵',
      styleCode: 'RWHT',
      styleCodes: ['RWHT', 'CWLF'],
      style4char: '濃白重口型',
      styleFamily: '濃白系',
      address: '台中市中區中山路82號',
      lat: 24.1391709,
      lng: 120.6818505,
      website: 'https://www.facebook.com/yoshiramentaichung/',
      mapUrl: 'https://www.openstreetmap.org/node/8064187430',
      sourceUrls: [
        'https://www.facebook.com/yoshiramentaichung/',
        'https://www.openstreetmap.org/node/8064187430',
      ],
      verifiedAt: '2026-07-09',
    },
  ],
}

describe('RamenFinderMap', () => {
  test('renders verified shop details without third-party ratings', () => {
    const result = scoreQuestionnaire(canonicalFixtures.iekei).results[0]

    render(
      <RamenFinderMap
        result={result}
        locale="zh-TW"
        initialRegionData={regionData}
      />,
    )

    expect(screen.getAllByText('有囍拉麵').length).toBeGreaterThan(0)
    expect(screen.queryByText('RWHT')).not.toBeInTheDocument()
    expect(screen.queryByText('評分')).not.toBeInTheDocument()
    expect(screen.getAllByText('核實日期 2026/7/9').length).toBeGreaterThan(0)
    expect(screen.getByText('營業時間請查看店家官方資訊')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '官方資訊' })).toHaveAttribute(
      'href',
      'https://www.facebook.com/yoshiramentaichung/',
    )
  })
})
