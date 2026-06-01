import { describe, expect, test } from 'vitest'

import { styleCatalog } from '../../config/styles'
import { coreIntensityValues, noodleValues } from '../../domain/types'

describe('styleCatalog hierarchy', () => {
  test('keeps 18 display styles but expands them into 54 core types', () => {
    const coreTypes = styleCatalog.flatMap((style) => style.coreTypes)

    expect(styleCatalog).toHaveLength(18)
    expect(coreTypes).toHaveLength(18 * coreIntensityValues.length)
  })

  test('every core type carries one noodle variant for each noodle shape', () => {
    for (const style of styleCatalog) {
      for (const coreType of style.coreTypes) {
        expect(coreType.noodleVariants).toHaveLength(noodleValues.length)
        expect(coreType.noodleVariants.map((variant) => variant.noodle)).toEqual(
          noodleValues,
        )
      }
    }
  })
})