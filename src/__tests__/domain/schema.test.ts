import { describe, expect, test } from 'vitest'

import { questionBank } from '../../config/questions'
import { styleCatalog } from '../../config/styles'
import type { CatalogDataset } from '../../domain/catalog'
import { assertCatalogDataset, assertQuestionBank } from '../../domain/schema'

describe('question-bank validation', () => {
  test('rejects archetype options that cannot be completed for their form', () => {
    const archetypeQuestion = questionBank.find((question) => question.id === 'archetype')

    if (!archetypeQuestion?.branchOptions) {
      throw new Error('archetype question fixture is missing branch options')
    }

    const gyokaiRich = archetypeQuestion.branchOptions.tsukemen.find(
      (option) => option.value === 'gyokai-rich',
    )

    if (!gyokaiRich) {
      throw new Error('gyokai-rich fixture is missing')
    }

    const invalidQuestionBank = questionBank.map((question) =>
      question.id === 'archetype' && question.branchOptions
        ? {
            ...question,
            branchOptions: {
              ...question.branchOptions,
              soup: [...question.branchOptions.soup, gyokaiRich],
            },
          }
        : question,
    )

    expect(() => assertQuestionBank(invalidQuestionBank)).toThrow(
      'archetype branch for soup has an incompatible option',
    )
  })

  test('rejects catalog core and subtype IDs that belong to another style', () => {
    const invalidCatalog: CatalogDataset = {
      stores: [
        {
          id: 'test-store',
          name: 'Test store',
          location: 'Test location',
          summary: 'Test summary',
          styleIds: ['hakata', 'iekei'],
          sourceUrl: 'https://example.com/menu',
        },
      ],
      items: [
        {
          id: 'test-item',
          storeId: 'test-store',
          name: 'Test item',
          summary: 'Test summary',
          styleId: 'hakata',
          coreTypeIds: ['iekei:heavy'],
          subtypeIds: ['iekei:heavy:medium-thick-straight'],
        },
      ],
    }

    expect(() => assertCatalogDataset(invalidCatalog, styleCatalog)).toThrow(
      'does not belong to style hakata',
    )
  })
})
