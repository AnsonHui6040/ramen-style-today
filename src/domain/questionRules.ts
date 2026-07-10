import type { ArchetypeOption, QuestionId } from './types'

export const maxSelectionsByQuestion: Partial<Record<QuestionId, number>> = {
  source: 2,
  signature: 2,
  exclusions: 8,
}

export const optionValuesByArchetype: Partial<
  Record<ArchetypeOption, Partial<Record<QuestionId, readonly string[]>>>
> = {
  'konbusui-light': {
    tare: ['shio', 'shoyu'],
    source: ['fish-seafood', 'shellfish', 'vegetable', 'mixed', 'unsure'],
    body: ['light', 'balanced'],
    noodle: ['medium-thin-straight', 'medium-thick-straight'],
    signature: ['fish-kombu', 'yuzu-citrus', 'no-preference'],
  },
  'gyokai-rich': {
    tare: ['shoyu', 'shio', 'miso'],
    source: ['fish-seafood', 'shellfish', 'mixed', 'unsure'],
    body: ['balanced', 'rich', 'ultra-heavy'],
    noodle: ['medium-thick-straight', 'medium-thick-wavy', 'extra-thick'],
    signature: ['fish-kombu', 'no-preference'],
  },
  'miso-rich': {
    tare: ['miso'],
    source: ['pork', 'chicken', 'fish-seafood', 'vegetable', 'mixed', 'unsure'],
    body: ['balanced', 'rich', 'ultra-heavy'],
    noodle: ['medium-thick-straight', 'medium-thick-wavy', 'extra-thick'],
    signature: ['corn-butter', 'fish-kombu', 'no-preference'],
  },
  aburasoba: {
    tare: ['shoyu', 'none'],
    source: ['pork', 'mixed', 'unsure'],
    body: ['light', 'balanced', 'rich'],
    noodle: ['medium-thin-straight', 'medium-thick-straight', 'extra-thick'],
    signature: ['no-preference', 'bean-sprout-garlic-backfat', 'fish-kombu'],
  },
  'taiwan-mazesoba': {
    tare: ['spicy-sesame', 'shoyu', 'none'],
    source: ['pork', 'mixed', 'unsure'],
    body: ['balanced', 'rich', 'ultra-heavy'],
    noodle: ['medium-thick-straight', 'extra-thick'],
    signature: ['fish-kombu', 'bean-sprout-garlic-backfat', 'no-preference'],
  },
  'soupless-tantan': {
    tare: ['spicy-sesame'],
    source: ['pork', 'vegetable', 'mixed', 'unsure'],
    body: ['balanced', 'rich', 'ultra-heavy'],
    noodle: ['medium-thick-straight', 'extra-thick'],
    signature: ['no-preference', 'bean-sprout-garlic-backfat'],
  },
}

export function getAllowedQuestionValues(
  questionId: QuestionId,
  archetype?: ArchetypeOption,
) {
  return archetype ? optionValuesByArchetype[archetype]?.[questionId] : undefined
}
