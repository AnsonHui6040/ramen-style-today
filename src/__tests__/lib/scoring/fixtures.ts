import { toCompletedAnswers } from '../../../domain/schema'
import type { CompletedAnswers, UserAnswers } from '../../../domain/types'

function complete(answers: UserAnswers): CompletedAnswers {
  const completed = toCompletedAnswers(answers)

  if (!completed) {
    throw new Error('fixture answers are incomplete or invalid')
  }

  return completed
}

export const canonicalFixtures = {
  iekei: complete({
    form: 'soup',
    archetype: 'paitan',
    tare: 'shoyu',
    source: ['pork'],
    body: 'backfat-heavy',
    noodle: 'medium-thick-straight',
    signature: ['nori-spinach'],
    exclusions: ['none'],
  }),
  jiro: complete({
    form: 'soup',
    archetype: 'paitan',
    tare: 'shoyu',
    source: ['pork'],
    body: 'ultra-heavy',
    noodle: 'extra-thick',
    signature: ['bean-sprout-garlic-backfat'],
    exclusions: ['none'],
  }),
  duckShellfish: complete({
    form: 'soup',
    archetype: 'chintan',
    tare: 'shio',
    source: ['duck', 'shellfish'],
    body: 'light',
    noodle: 'medium-thin-straight',
    signature: ['yuzu-citrus'],
    exclusions: ['none'],
  }),
  konbusui: complete({
    form: 'tsukemen',
    archetype: 'konbusui-light',
    tare: 'shio',
    source: ['fish-seafood', 'shellfish'],
    body: 'balanced',
    noodle: 'medium-thick-straight',
    signature: ['fish-kombu'],
    exclusions: ['none'],
  }),
  taiwanMazesoba: complete({
    form: 'dry',
    archetype: 'taiwan-mazesoba',
    tare: 'spicy-sesame',
    source: ['pork'],
    body: 'ultra-heavy',
    noodle: 'extra-thick',
    signature: ['fish-kombu'],
    exclusions: ['none'],
  }),
} satisfies Record<string, CompletedAnswers>

export const conflictFixtures = {
  jiroWithYuzu: complete({
    ...canonicalFixtures.jiro,
    signature: ['bean-sprout-garlic-backfat', 'yuzu-citrus'],
  }),
  taiwanMazesobaPlain: complete({
    ...canonicalFixtures.taiwanMazesoba,
    tare: 'none',
  }),
  porkBlockedIekei: complete({
    ...canonicalFixtures.iekei,
    exclusions: ['pork'],
  }),
} satisfies Record<string, CompletedAnswers>

export const normalizationFixture: UserAnswers = {
  form: 'soup',
  archetype: 'paitan',
  tare: 'shoyu',
  source: ['unsure', 'pork'],
  body: 'rich',
  noodle: 'medium-thick-straight',
  signature: ['no-preference', 'nori-spinach'],
  exclusions: ['none', 'pork'],
}