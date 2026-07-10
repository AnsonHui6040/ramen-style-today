import {
  archetypeValues,
  bodyValues,
  coreIntensityValues,
  exclusionValues,
  formValues,
  noodleValues,
  questionIds,
  scoredQuestionIds,
  signatureValues,
  sourceValues,
  tareValues,
  type ArchetypeOption,
  type CompletedAnswers,
  type ExclusionOption,
  type FormOption,
  type MatchRule,
  type QuestionDefinition,
  type QuestionId,
  type ScoredQuestionId,
  type SignalCondition,
  type StyleDefinition,
  type UserAnswers,
} from './types'
import type { CatalogCurrency, CatalogDataset } from './catalog'
import {
  getAllowedQuestionValues,
  maxSelectionsByQuestion,
  optionValuesByArchetype,
} from './questionRules'

const catalogCurrencies = ['JPY', 'TWD'] as const satisfies readonly CatalogCurrency[]

const allowedValuesByQuestion: Record<QuestionId, readonly string[]> = {
  form: formValues,
  archetype: archetypeValues,
  tare: tareValues,
  source: sourceValues,
  body: bodyValues,
  noodle: noodleValues,
  signature: signatureValues,
  exclusions: exclusionValues,
}

const allowedValuesByScoredQuestion: Record<ScoredQuestionId, readonly string[]> = {
  form: allowedValuesByQuestion.form,
  archetype: allowedValuesByQuestion.archetype,
  tare: allowedValuesByQuestion.tare,
  source: allowedValuesByQuestion.source,
  body: allowedValuesByQuestion.body,
  noodle: allowedValuesByQuestion.noodle,
  signature: allowedValuesByQuestion.signature,
}

function assertRuleValues(
  coreTypeId: string,
  questionId: ScoredQuestionId,
  rule: MatchRule,
) {
  const values = [
    ...(rule.exact ?? []),
    ...(rule.adjacent ?? []),
    ...(rule.partial ?? []),
  ]
  const allowedValues = allowedValuesByScoredQuestion[questionId]

  if (!values.length || values.some((value) => !allowedValues.includes(value))) {
    throw new Error(`${coreTypeId} has an unsupported rule value for ${questionId}`)
  }
}

function assertQuestionOptions(
  questionId: QuestionId,
  options: readonly { value: string }[],
) {
  const seenValues = new Set<string>()
  const allowedValues = allowedValuesByQuestion[questionId]

  for (const option of options) {
    if (!allowedValues.includes(option.value)) {
      throw new Error(`${questionId} has an unsupported option value`)
    }

    if (seenValues.has(option.value)) {
      throw new Error(`${questionId} repeats option ${option.value}`)
    }

    seenValues.add(option.value)
  }
}

function assertSignalConditions(
  coreTypeId: string,
  ruleType: 'bonus' | 'conflict',
  conditions: readonly SignalCondition[],
) {
  if (!conditions.length) {
    throw new Error(`${coreTypeId} has an invalid ${ruleType} condition`)
  }

  for (const condition of conditions) {
    const allowedValues = allowedValuesByScoredQuestion[condition.question]

    if (
      !allowedValues ||
      !condition.anyOf.length ||
      condition.anyOf.some((value) => !allowedValues.includes(value))
    ) {
      throw new Error(`${coreTypeId} has an invalid ${ruleType} condition`)
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAllowedValue<Value extends string>(
  value: unknown,
  allowedValues: readonly Value[],
): value is Value {
  return typeof value === 'string' && allowedValues.includes(value as Value)
}

function restoreValues<Value extends string>(
  value: unknown,
  allowedValues: readonly Value[],
): Value[] {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.filter((entry): entry is Value => isAllowedValue(entry, allowedValues)))]
}

export function restoreUserAnswers(value: unknown): UserAnswers {
  const source = isRecord(value) ? value : {}
  const exclusions = Array.isArray(source.exclusions)
    ? source.exclusions.flatMap((entry) =>
      entry === 'seafood' ? ['fish-seafood', 'shellfish', 'shrimp-crab'] : [entry],
    )
    : []
  const restoredExclusions = restoreValues(exclusions, exclusionValues)

  return {
    form: isAllowedValue(source.form, formValues) ? source.form : undefined,
    archetype: isAllowedValue(source.archetype, archetypeValues)
      ? source.archetype
      : undefined,
    tare: isAllowedValue(source.tare, tareValues) ? source.tare : undefined,
    source: normalizeExclusiveValues(
      restoreValues(source.source, sourceValues),
      'unsure',
    ),
    body: isAllowedValue(source.body, bodyValues) ? source.body : undefined,
    noodle: isAllowedValue(source.noodle, noodleValues) ? source.noodle : undefined,
    signature: normalizeExclusiveValues(
      restoreValues(source.signature, signatureValues),
      'no-preference',
    ),
    exclusions: restoredExclusions.length
      ? normalizeExclusiveValues(restoredExclusions, 'none')
      : ['none'],
  }
}

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
    if (!Number.isInteger(question.minSelections) || !Number.isInteger(question.maxSelections)) {
      throw new Error(`${question.id} selection bounds must be integers`)
    }

    if (question.minSelections < 0 || question.maxSelections < 0) {
      throw new Error(`${question.id} selection bounds cannot be negative`)
    }

    if (question.minSelections > question.maxSelections) {
      throw new Error(`${question.id} has invalid selection bounds`)
    }

    const expectedMaxSelections = maxSelectionsByQuestion[question.id]
    if (
      expectedMaxSelections !== undefined &&
      question.maxSelections !== expectedMaxSelections
    ) {
      throw new Error(`${question.id} has an unsupported selection limit`)
    }

    if (question.id === 'archetype') {
      if (!question.branchOptions) {
        throw new Error('archetype question must define branch options')
      }

      for (const form of formValues) {
        const options = question.branchOptions[form]

        if (!options?.length) {
          throw new Error(`archetype branch for ${form} is empty`)
        }

        assertQuestionOptions('archetype', options)

        if (options.some((option) => !isArchetypeAllowed(form, option.value))) {
          throw new Error(`archetype branch for ${form} has an incompatible option`)
        }

        if (question.maxSelections > options.length) {
          throw new Error(`archetype branch for ${form} has too few options`)
        }
      }

      continue
    }

    if (!question.options?.length) {
      throw new Error(`${question.id} must define options`)
    }

    assertQuestionOptions(question.id, question.options)

    if (question.maxSelections > question.options.length) {
      throw new Error(`${question.id} selects more options than it defines`)
    }
  }

  const questionsById = new Map(questionBank.map((question) => [question.id, question]))

  for (const [archetype, restrictions] of Object.entries(optionValuesByArchetype)) {
    for (const [questionId, allowedValues] of Object.entries(restrictions)) {
      const question = questionsById.get(questionId as QuestionId)
      const availableValues = question?.options?.map((option) => option.value) ?? []

      if (!allowedValues?.every((value) => availableValues.includes(value))) {
        throw new Error(`${archetype} has an unavailable ${questionId} option`)
      }
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

    if (style.ingredients.some((ingredient) =>
      ingredient === 'none' || !exclusionValues.includes(ingredient),
    )) {
      throw new Error(`${style.id} has an unsupported ingredient tag`)
    }

    if (style.coreTypes.length !== coreIntensityValues.length) {
      throw new Error(`${style.id} must define exactly ${coreIntensityValues.length} core types`)
    }

    const seenIntensities = new Set<string>()

    for (const coreType of style.coreTypes) {
      if (coreTypeIds.has(coreType.id)) {
        throw new Error(`duplicate core type id: ${coreType.id}`)
      }

      coreTypeIds.add(coreType.id)

      if (!coreIntensityValues.includes(coreType.intensity)) {
        throw new Error(`${coreType.id} has unsupported intensity ${coreType.intensity}`)
      }

      if (seenIntensities.has(coreType.intensity)) {
        throw new Error(`${style.id} repeats core intensity ${coreType.intensity}`)
      }

      seenIntensities.add(coreType.intensity)

      for (const questionId of scoredQuestionIds) {
        const rule = coreType.rules[questionId]

        if (!rule) {
          throw new Error(`${coreType.id} is missing a rule for ${questionId}`)
        }

        assertRuleValues(coreType.id, questionId, rule)
      }

      const bonusPoints = coreType.bonuses?.reduce((sum, rule) => sum + rule.points, 0) ?? 0
      if (bonusPoints > 5) {
        throw new Error(`${coreType.id} bonus budget is unexpectedly high`)
      }

      for (const rule of coreType.bonuses ?? []) {
        if (
          !Number.isFinite(rule.points) ||
          rule.points <= 0 ||
          !Number.isInteger(rule.minMatches) ||
          rule.minMatches < 1 ||
          rule.minMatches > rule.conditions.length
        ) {
          throw new Error(`${coreType.id} has an invalid bonus rule`)
        }

        assertSignalConditions(coreType.id, 'bonus', rule.conditions)
      }

      const penaltyPoints =
        coreType.conflicts?.reduce((sum, rule) => sum + rule.penalty, 0) ?? 0
      if (penaltyPoints > 30) {
        throw new Error(`${coreType.id} conflict budget is unexpectedly high`)
      }

      for (const rule of coreType.conflicts ?? []) {
        if (!Number.isFinite(rule.penalty) || rule.penalty <= 0 || rule.penalty > 15) {
          throw new Error(`${coreType.id} has an invalid conflict rule`)
        }

        assertSignalConditions(coreType.id, 'conflict', rule.whenAll)
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

        if (!noodleValues.includes(variant.noodle)) {
          throw new Error(`${coreType.id} has an unsupported noodle variant`)
        }

        if (seenNoodles.has(variant.noodle)) {
          throw new Error(`${coreType.id} repeats noodle variant ${variant.noodle}`)
        }

        seenNoodles.add(variant.noodle)
      }
    }
  }
}

export function assertCatalogDataset(
  catalogDataset: CatalogDataset,
  styleCatalog: readonly StyleDefinition[],
) {
  const storesById = new Map<string, CatalogDataset['stores'][number]>()
  const itemIds = new Set<string>()
  const stylesById = new Map(styleCatalog.map((style) => [style.id, style]))

  for (const store of catalogDataset.stores) {
    if (storesById.has(store.id)) {
      throw new Error(`duplicate store id: ${store.id}`)
    }

    if (!store.styleIds.length) {
      throw new Error(`${store.id} must declare at least one supported style id`)
    }

    if (store.styleIds.some((styleId) => !stylesById.has(styleId))) {
      throw new Error(`${store.id} declares an unknown style id`)
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

    const style = stylesById.get(item.styleId)

    if (!style) {
      throw new Error(`${item.id} points to an unknown style ${item.styleId}`)
    }

    const styleCoreTypeIds = new Set(style.coreTypes.map((coreType) => coreType.id))

    if (item.coreTypeIds?.some((coreTypeId) => !styleCoreTypeIds.has(coreTypeId))) {
      throw new Error(`${item.id} core type does not belong to style ${item.styleId}`)
    }

    const applicableCoreTypes = item.coreTypeIds?.length
      ? style.coreTypes.filter((coreType) => item.coreTypeIds?.includes(coreType.id))
      : style.coreTypes
    const applicableSubtypeIds = new Set(
      applicableCoreTypes.flatMap((coreType) =>
        coreType.noodleVariants.map((variant) => variant.id),
      ),
    )

    if (item.subtypeIds?.some((subtypeId) => !applicableSubtypeIds.has(subtypeId))) {
      throw new Error(`${item.id} subtype does not belong to style ${item.styleId}`)
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
  const restored = restoreUserAnswers(answers)

  return {
    ...restored,
    source: normalizeExclusiveValues(restored.source, 'unsure'),
    signature: normalizeExclusiveValues(restored.signature, 'no-preference'),
    exclusions: normalizeExclusiveValues(restored.exclusions, 'none'),
  }
}

function hasSelection(values: readonly string[]) {
  return values.length > 0
}

function hasAllowedQuestionResponse(
  questionId: QuestionId,
  values: readonly string[],
  archetype: ArchetypeOption,
) {
  const maxSelections = maxSelectionsByQuestion[questionId]
  const allowedValues = getAllowedQuestionValues(questionId, archetype)

  return (
    (maxSelections === undefined || values.length <= maxSelections) &&
    (!allowedValues || values.every((value) => allowedValues.includes(value)))
  )
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

  if (
    !normalized.tare ||
    !tareValues.includes(normalized.tare) ||
    !hasAllowedQuestionResponse('tare', [normalized.tare], normalized.archetype)
  ) {
    return null
  }

  if (
    !normalized.body ||
    !bodyValues.includes(normalized.body) ||
    !normalized.noodle ||
    !noodleValues.includes(normalized.noodle) ||
    !hasAllowedQuestionResponse('body', [normalized.body], normalized.archetype) ||
    !hasAllowedQuestionResponse('noodle', [normalized.noodle], normalized.archetype)
  ) {
    return null
  }

  if (
    !hasSelection(normalized.source) ||
    !normalized.source.every((value) => sourceValues.includes(value)) ||
    !hasAllowedQuestionResponse('source', normalized.source, normalized.archetype) ||
    !hasSelection(normalized.signature) ||
    !normalized.signature.every((value) => signatureValues.includes(value)) ||
    !hasAllowedQuestionResponse('signature', normalized.signature, normalized.archetype)
  ) {
    return null
  }

  const exclusions = normalized.exclusions.length
    ? normalized.exclusions
    : (['none'] satisfies ExclusionOption[])

  if (
    !exclusions.every((value) => exclusionValues.includes(value)) ||
    !hasAllowedQuestionResponse('exclusions', exclusions, normalized.archetype)
  ) {
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
