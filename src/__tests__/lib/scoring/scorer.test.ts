import { describe, expect, test } from 'vitest'

import { toCompletedAnswers } from '../../../domain/schema'
import type { UserAnswers } from '../../../domain/types'
import { capRulePoints, scoreQuestionnaire } from '../../../lib/scoring/scorer'
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
    expect(outcome.results.every((result) => result.style.family === 'tsukemen')).toBe(true)
    expect(outcome.results).toHaveLength(2)
    expect(outcome.alternativeResults.every((result) => result.style.family !== 'tsukemen')).toBe(true)
    expect(outcome.results[0]?.bonusReasons).toEqual(
      expect.arrayContaining(['昆布水沾麵輪廓完整 +4']),
    )
  })

  test('taiwan mazesoba pathway ranks taiwan mazesoba first', () => {
    const outcome = scoreQuestionnaire(canonicalFixtures.taiwanMazesoba)

    expect(outcome.results[0]?.style.id).toBe('taiwan-mazesoba')
    expect(outcome.results.every((result) => result.style.family === 'dry')).toBe(true)
    expect(outcome.alternativeResults.every((result) => result.style.family !== 'dry')).toBe(true)
  })
})

describe('rule point caps', () => {
  test('caps an additional rule at the remaining score budget', () => {
    expect(capRulePoints(10, 10, 15)).toBe(5)
    expect(capRulePoints(10, 15, 15)).toBe(0)
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

  test('fish allergy blocks fish-forward tsukemen without using a broad seafood bucket', () => {
    const outcome = scoreQuestionnaire(conflictFixtures.fishBlockedKonbusui)

    expect(outcome.blockedLead?.style.id).toBe('konbusui-tsukemen')
    expect(outcome.blockedLead?.blockedBy).toEqual(['fish-seafood'])
    expect(outcome.results.every((result) => result.blockedBy.length === 0)).toBe(true)
  })

  test('dairy exclusion blocks the corn-butter Sapporo style', () => {
    const outcome = scoreQuestionnaire(conflictFixtures.dairyBlockedSapporo)

    expect(outcome.blockedLead?.style.id).toBe('sapporo')
    expect(outcome.blockedLead?.blockedBy).toEqual(['dairy'])
    expect(outcome.results.every((result) => result.style.id !== 'sapporo')).toBe(true)
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

  test('migrates the legacy seafood exclusion into granular current exclusions', () => {
    const legacyAnswers = {
      ...canonicalFixtures.konbusui,
      exclusions: ['seafood'],
    } as unknown as UserAnswers

    expect(toCompletedAnswers(legacyAnswers)?.exclusions).toEqual([
      'fish-seafood',
      'shellfish',
      'shrimp-crab',
    ])
  })

  test('rejects malformed persisted option values rather than scoring them', () => {
    const malformed = {
      ...canonicalFixtures.iekei,
      tare: 'not-a-tare',
      source: ['not-a-source'],
      signature: ['not-a-signature'],
    } as unknown as UserAnswers

    expect(toCompletedAnswers(malformed)).toBeNull()
  })

  test('rejects persisted answers that bypass an archetype branch or multi-select cap', () => {
    const incompatibleBranch = {
      ...canonicalFixtures.konbusui,
      archetype: 'miso-rich',
      tare: 'shoyu',
    } as unknown as UserAnswers
    const overSourceCap = {
      ...canonicalFixtures.iekei,
      source: ['pork', 'chicken', 'duck'],
    } as unknown as UserAnswers
    const overSignatureCap = {
      ...canonicalFixtures.iekei,
      signature: ['nori-spinach', 'corn-butter', 'fish-kombu'],
    } as unknown as UserAnswers

    expect(toCompletedAnswers(incompatibleBranch)).toBeNull()
    expect(toCompletedAnswers(overSourceCap)).toBeNull()
    expect(toCompletedAnswers(overSignatureCap)).toBeNull()
  })
})
