import { describe, expect, test } from 'vitest'

import { toCompletedAnswers } from '../../../domain/schema'
import { enrichScoringOutcome } from '../../../lib/catalog/enricher'
import { scoreQuestionnaire } from '../../../lib/scoring/scorer'
import { canonicalFixtures } from '../scoring/fixtures'

describe('enrichScoringOutcome', () => {
  test('adds store and item recommendations for catalog-backed styles', () => {
    const outcome = enrichScoringOutcome(scoreQuestionnaire(canonicalFixtures.iekei))

    expect(outcome.results[0]?.catalogRecommendations.length).toBeGreaterThan(0)
    expect(outcome.results[0]?.catalogRecommendations[0]?.store.name).toBe(
      '横浜家系ラーメン大和家',
    )
    expect(outcome.results[0]?.catalogRecommendations[0]?.items[0]?.name).toBe(
      '631ラーメン 醤油',
    )
  })

  test('returns an empty catalog list when no real store is mapped to the style', () => {
    const completed = toCompletedAnswers({
      form: 'soup',
      archetype: 'chintan',
      tare: 'shoyu',
      source: ['chicken'],
      body: 'light',
      noodle: 'thin-straight',
      signature: ['yuzu-citrus'],
      exclusions: ['none'],
    })

    expect(completed).not.toBeNull()

    const outcome = enrichScoringOutcome(scoreQuestionnaire(completed!))

    expect(outcome.results[0]?.style.id).toBe('shoyu-chintan')
    expect(outcome.results[0]?.catalogRecommendations).toEqual([])
  })
})