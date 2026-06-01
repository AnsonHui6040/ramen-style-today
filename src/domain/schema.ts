import {
  archetypeValues,
  coreIntensityValues,
  exclusionValues,
  formValues,
  noodleValues,
  questionIds,
  scoredQuestionIds,
  type CompletedAnswers,
  type ExclusionOption,
  type FormOption,
  type QuestionDefinition,
  type StyleDefinition,
  type UserAnswers,
} from './types'
import type { CatalogCurrency, CatalogDataset } from './catalog'

const catalogCurrencies = ['JPY', 'TWD'] as const satisfies readonly CatalogCurrency[]

function hasExactIds(
  ids: readonly string[],
  expected: readonly string[],
  label: string,
) {
  if (ids.length !== expected.length) {
    throw new Error(`${label} count mismatch`)
  }

  for (const expectedId of expected) {
    if (!ids.includes(expectedId)) {
      throw new Error(`${label} is missing ${expectedId}`)
    }
  }
}

export function assertQuestionBank(questionBank: readonly QuestionDefinition[]) {
  hasExactIds(
    questionBank.map((question) => question.id),
    questionIds,
    'question bank ids',
  )

  const totalWeight = questionBank.reduce(
    (sum, question) => sum + question.weight,
    0,
  )

  if (totalWeight !== 100) {
    throw new Error(`question bank weights must total 100, received ${totalWeight}`)
  }

  for (const question of questionBank) {
    if (question.minSelections > question.maxSelections) {
      throw new Error(`${question.id} has invalid selection bounds`)
    }

    if (question.id === 'archetype') {
      if (!question.branchOptions) {
        throw new Error('archetype question must define branch options')
      }

      for (const form of formValues) {
        if (!question.branchOptions[form]?.length) {
          throw new Error(`archetype branch for ${form} is empty`)
        }
      }

      continue
    }

    if (!question.options?.length) {
      throw new Error(`${question.id} must define options`)
    }
  }
}

export function assertStyleCatalog(styleCatalog: readonly StyleDefinition[]) {
  const ids = new Set<string>()
  const coreTypeIds = new Set<string>()
  const subtypeIds = new Set<string>()

  for (const style of styleCatalog) {
    if (ids.has(style.id)) {
      throw new Error(`duplicate style id: ${style.id}`)
    }

    ids.add(style.id)

    if (style.coreTypes.length !== coreIntensityValues.length) {
      throw new Error(`${style.id} must define exactly ${coreIntensityValues.length} core types`)
    }

    for (const coreType of style.coreTypes) {
      if (coreTypeIds.has(coreType.id)) {
        throw new Error(`duplicate core type id: ${coreType.id}`)
      }

      coreTypeIds.add(coreType.id)

      if (!coreIntensityValues.includes(coreType.intensity)) {
        throw new Error(`${coreType.id} has unsupported intensity ${coreType.intensity}`)
      }

      for (const questionId of scoredQuestionIds) {
        if (!coreType.rules[questionId]) {
          throw new Error(`${coreType.id} is missing a rule for ${questionId}`)
        }
      }

      const bonusPoints = coreType.bonuses?.reduce((sum, rule) => sum + rule.points, 0) ?? 0
      if (bonusPoints > 10) {
        throw new Error(`${coreType.id} bonus budget is unexpectedly high`)
      }

      const penaltyPoints =
        coreType.conflicts?.reduce((sum, rule) => sum + rule.penalty, 0) ?? 0
      if (penaltyPoints > 30) {
        throw new Error(`${coreType.id} conflict budget is unexpectedly high`)
      }

      if (coreType.noodleVariants.length !== noodleValues.length) {
        throw new Error(`${coreType.id} must define ${noodleValues.length} noodle variants`)
      }

      const seenNoodles = new Set<string>()

      for (const variant of coreType.noodleVariants) {
        if (subtypeIds.has(variant.id)) {
          throw new Error(`duplicate noodle variant id: ${variant.id}`)
        }

        subtypeIds.add(variant.id)

        if (seenNoodles.has(variant.noodle)) {
          throw new Error(`${coreType.id} repeats noodle variant ${variant.noodle}`)
        }

        seenNoodles.add(variant.noodle)
      }
    }
  }
}

export function assertCatalogDataset(catalogDataset: CatalogDataset) {
  const storesById = new Map<string, CatalogDataset['stores'][number]>()
  const itemIds = new Set<string>()

  for (const store of catalogDataset.stores) {
    if (storesById.has(store.id)) {
      throw new Error(`duplicate store id: ${store.id}`)
    }

    if (!store.styleIds.length) {
      throw new Error(`${store.id} must declare at least one supported style id`)
    }

    if (store.sourceUrl && !store.sourceUrl.startsWith('https://')) {
      throw new Error(`${store.id} must use an https source URL`)
    }

    storesById.set(store.id, store)
  }

  for (const item of catalogDataset.items) {
    if (itemIds.has(item.id)) {
      throw new Error(`duplicate menu item id: ${item.id}`)
    }

    itemIds.add(item.id)

    const store = storesById.get(item.storeId)

    if (!store) {
      throw new Error(`${item.id} points to an unknown store id: ${item.storeId}`)
    }

    if (!store.styleIds.includes(item.styleId)) {
      throw new Error(`${item.id} points to style ${item.styleId} not declared by ${store.id}`)
    }

    if (item.price !== undefined && item.price < 0) {
      throw new Error(`${item.id} has an invalid negative price`)
    }

    if ((item.price === undefined) !== (item.currency === undefined)) {
      throw new Error(`${item.id} must provide both price and currency together`)
    }

    if (item.currency && !catalogCurrencies.includes(item.currency)) {
      throw new Error(`${item.id} uses unsupported currency ${item.currency}`)
    }
  }
}

export function isArchetypeAllowed(form: FormOption, archetype: string) {
  if (form === 'soup') {
    return archetype === 'chintan' || archetype === 'paitan'
  }

  if (form === 'tsukemen') {
    return (
      archetype === 'konbusui-light' ||
      archetype === 'gyokai-rich' ||
      archetype === 'miso-rich' ||
      archetype === 'tsukemen-other'
    )
  }

  return (
    archetype === 'aburasoba' ||
    archetype === 'taiwan-mazesoba' ||
    archetype === 'soupless-tantan' ||
    archetype === 'dry-other'
  )
}

export function normalizeExclusiveValues<T extends string>(
  values: readonly T[],
  exclusiveValue: T,
) {
  if (values.includes(exclusiveValue) && values.length > 1) {
    return values.filter((value) => value !== exclusiveValue)
  }

  return [...values]
}

export function normalizeAnswers(answers: UserAnswers): UserAnswers {
  return {
    ...answers,
    source: normalizeExclusiveValues(answers.source, 'unsure'),
    signature: normalizeExclusiveValues(answers.signature, 'no-preference'),
    exclusions: normalizeExclusiveValues(answers.exclusions, 'none'),
  }
}

function hasSelection(values: readonly string[]) {
  return values.length > 0
}

export function toCompletedAnswers(
  answers: UserAnswers,
): CompletedAnswers | null {
  const normalized = normalizeAnswers(answers)

  if (!normalized.form || !formValues.includes(normalized.form)) {
    return null
  }

  if (
    !normalized.archetype ||
    !archetypeValues.includes(normalized.archetype) ||
    !isArchetypeAllowed(normalized.form, normalized.archetype)
  ) {
    return null
  }

  if (!normalized.tare) {
    return null
  }

  if (!normalized.body || !normalized.noodle) {
    return null
  }

  if (!hasSelection(normalized.source) || !hasSelection(normalized.signature)) {
    return null
  }

  const exclusions = normalized.exclusions.length
    ? normalized.exclusions
    : (['none'] satisfies ExclusionOption[])

  if (!exclusions.every((value) => exclusionValues.includes(value))) {
    return null
  }

  return {
    form: normalized.form,
    archetype: normalized.archetype,
    tare: normalized.tare,
    source: normalized.source,
    body: normalized.body,
    noodle: normalized.noodle,
    signature: normalized.signature,
    exclusions,
  }
}