import questionBankData from '../data/questions.json'
import { assertQuestionBank, isArchetypeAllowed } from '../domain/schema'
import type {
  ArchetypeOption,
  ChoiceOption,
  FormOption,
  QuestionDefinition,
  QuestionId,
} from '../domain/types'

export const questionBank = questionBankData as readonly QuestionDefinition[]

assertQuestionBank(questionBank)

const questionMap = new Map(questionBank.map((question) => [question.id, question]))

const optionValuesByArchetype: Partial<
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
    tare: ['spicy-sesame', 'shoyu'],
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

export function getQuestionById(questionId: QuestionId) {
  return questionMap.get(questionId)
}

export function resolveQuestionOptions(
  question: QuestionDefinition,
  form?: FormOption,
  archetype?: ArchetypeOption,
): readonly ChoiceOption[] {
  const options = question.branchOptions
    ? form
      ? question.branchOptions[form]
      : []
    : question.options ?? []
  const allowedValues = archetype
    ? optionValuesByArchetype[archetype]?.[question.id]
    : undefined

  if (!allowedValues) {
    return options
  }

  return options.filter((option) => allowedValues.includes(option.value))
}

export function getOptionLabel(
  questionId: QuestionId,
  value: string,
  form?: FormOption,
) {
  const question = getQuestionById(questionId)
  if (!question) {
    return value
  }

  const option = resolveQuestionOptions(question, form).find(
    (candidate) => candidate.value === value,
  )

  return option?.label ?? value
}

export function isQuestionValueAllowed(
  questionId: QuestionId,
  value: string,
  form?: FormOption,
) {
  if (questionId === 'archetype' && form) {
    return isArchetypeAllowed(form, value)
  }

  const question = getQuestionById(questionId)
  if (!question) {
    return false
  }

  return resolveQuestionOptions(question, form).some(
    (candidate) => candidate.value === value,
  )
}
