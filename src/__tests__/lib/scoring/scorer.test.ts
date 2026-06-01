import { describe, expect, test } from 'vitest'

import { toCompletedAnswers } from '../../../domain/schema'
import { scoreQuestionnaire } from '../../../lib/scoring/scorer'
import {
  canonicalFixtures,
  conflictFixtures,
  normalizationFixture,
} from './fixtures'

describe('scoreQuestionnaire canonical pathways', () => {
  test('canonical Iekei answers rank Iekei first with the expected bonus', () => {
    const outcome = scoreQuestionnaire(canonicalFixtures.iekei)

    expect(outcome.results[0]?.style.id).toBe('iekei')
    expect(outcome.results[0]?.bonusReasons).toEqual(
      expect.arrayContaining(['家系標誌同時成立 +5']),
    )
    expect(outcome.lowConfidence).toBe(false)
  })

  test('canonical Jiro answers rank Jiro first', () => {
    const outcome = scoreQuestionnaire(canonicalFixtures.jiro)

    expect(outcome.results[0]?.style.id).toBe('jiro')
    expect(outcome.results[0]?.confidence).toBeGreaterThanOrEqual(70)
  })

  test('duck and shellfish light path prefers duck chintan while keeping shellfish in top results', () => {
    const outcome = scoreQuestionnaire(canonicalFixtures.duckShellfish)
    const topIds = outcome.results.map((result) => result.style.id)

    expect(topIds[0]).toBe('duck-chintan')
    expect(topIds).toContain('shellfish-dashi')
  })

  test('konbusui pathway ranks konbusui tsukemen first', () => {
    const outcome = scoreQuestionnaire(canonicalFixtures.konbusui)

    expect(outcome.results[0]?.style.id).toBe('konbusui-tsukemen')
    expect(outcome.results[0]?.bonusReasons).toEqual(
      expect.arrayContaining(['昆布水沾麵輪廓完整 +4']),
    )
  })

  test('taiwan mazesoba pathway ranks taiwan mazesoba first', () => {
    const outcome = scoreQuestionnaire(canonicalFixtures.taiwanMazesoba)

    expect(outcome.results[0]?.style.id).toBe('taiwan-mazesoba')
  })
})

describe('scoreQuestionnaire conflicts and filters', () => {
  test('Jiro with yuzu applies the explicit conflict penalty', () => {
    const outcome = scoreQuestionnaire(conflictFixtures.jiroWithYuzu)
    const jiro = outcome.results.find((result) => result.style.id === 'jiro')

    expect(jiro).toBeDefined()
    expect(jiro?.penaltyReasons).toEqual(
      expect.arrayContaining(['柚子淡麗訊號應壓制二郎置信度 -15']),
    )
  })

  test('plain taiwan mazesoba keeps the style but loses confidence through penalty', () => {
    const canonicalOutcome = scoreQuestionnaire(canonicalFixtures.taiwanMazesoba)
    const plainOutcome = scoreQuestionnaire(conflictFixtures.taiwanMazesobaPlain)
    const plain = plainOutcome.results.find(
      (result) => result.style.id === 'taiwan-mazesoba',
    )

    expect(plain).toBeDefined()
    expect(plain?.penaltyReasons).toEqual(
      expect.arrayContaining(['台灣まぜ若完全不強調調味，置信度應下降 -10']),
    )
    expect(plain?.confidence).toBeLessThan(
      canonicalOutcome.results[0]?.confidence ?? 100,
    )
  })

  test('pork exclusion blocks the strongest Iekei-style result and surfaces a blocked lead', () => {
    const outcome = scoreQuestionnaire(conflictFixtures.porkBlockedIekei)

    expect(outcome.blockedLead?.style.id).toBe('iekei')
    expect(outcome.blockedLead?.blockedBy).toEqual(['pork'])
    expect(outcome.results.every((result) => result.style.id !== 'iekei')).toBe(true)
  })
})

describe('answer normalization guards', () => {
  test('exclusive values are stripped when mixed with concrete selections', () => {
    const completed = toCompletedAnswers(normalizationFixture)

    expect(completed).not.toBeNull()
    expect(completed?.source).toEqual(['pork'])
    expect(completed?.signature).toEqual(['nori-spinach'])
    expect(completed?.exclusions).toEqual(['pork'])
  })
})