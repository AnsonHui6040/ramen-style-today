import { describe, expect, test } from 'vitest'

import { styleCatalog } from '../../config/styles'
import { assertStyleCatalog } from '../../domain/schema'
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

  test('rejects ingredient tags that cannot be represented by the exclusion flow', () => {
    const invalidCatalog = styleCatalog.map((style, index) =>
      index === 0
        ? { ...style, ingredients: ['unknown-ingredient'] }
        : style,
    )

    expect(() => assertStyleCatalog(invalidCatalog as typeof styleCatalog)).toThrow(
      'unsupported ingredient',
    )
  })

  test('rejects a variant set that replaces a supported noodle with an unknown one', () => {
    const invalidCatalog = styleCatalog.map((style, styleIndex) =>
      styleIndex === 0
        ? {
            ...style,
            coreTypes: style.coreTypes.map((coreType, coreTypeIndex) =>
              coreTypeIndex === 0
                ? {
                    ...coreType,
                    noodleVariants: coreType.noodleVariants.map((variant, variantIndex) =>
                      variantIndex === 0
                        ? { ...variant, noodle: 'unknown-noodle' }
                        : variant,
                    ),
                  }
                : coreType,
            ),
          }
        : style,
    )

    expect(() => assertStyleCatalog(invalidCatalog as typeof styleCatalog)).toThrow(
      'unsupported noodle variant',
    )
  })

  test('rejects scoring rules that refer to a value unavailable to that question', () => {
    const invalidCatalog = styleCatalog.map((style, styleIndex) =>
      styleIndex === 0
        ? {
            ...style,
            coreTypes: style.coreTypes.map((coreType, coreTypeIndex) =>
              coreTypeIndex === 0
                ? {
                    ...coreType,
                    rules: {
                      ...coreType.rules,
                      form: { exact: ['unknown-form'] },
                    },
                  }
                : coreType,
            ),
          }
        : style,
    )

    expect(() => assertStyleCatalog(invalidCatalog as typeof styleCatalog)).toThrow(
      'unsupported rule value',
    )
  })

  test('rejects bonus conditions that cannot produce a valid match', () => {
    const invalidCatalog = styleCatalog.map((style, styleIndex) =>
      styleIndex === 0
        ? {
            ...style,
            coreTypes: style.coreTypes.map((coreType, coreTypeIndex) =>
              coreTypeIndex === 0
                ? {
                    ...coreType,
                    bonuses: [
                      {
                        id: 'invalid-bonus',
                        label: 'Invalid bonus',
                        points: 1,
                        minMatches: 1,
                        conditions: [{ question: 'form', anyOf: [] }],
                      },
                    ],
                  }
                : coreType,
            ),
          }
        : style,
    )

    expect(() => assertStyleCatalog(invalidCatalog as typeof styleCatalog)).toThrow(
      'invalid bonus condition',
    )
  })
})
