import type { CatalogRecommendation } from './catalog'

export const formValues = ['soup', 'tsukemen', 'dry'] as const
export const archetypeValues = [
  'chintan',
  'paitan',
  'konbusui-light',
  'gyokai-rich',
  'miso-rich',
  'tsukemen-other',
  'aburasoba',
  'taiwan-mazesoba',
  'soupless-tantan',
  'dry-other',
] as const
export const tareValues = [
  'shoyu',
  'shio',
  'miso',
  'spicy-sesame',
  'none',
] as const
export const sourceValues = [
  'pork',
  'chicken',
  'duck',
  'beef',
  'fish-seafood',
  'shellfish',
  'shrimp-crab',
  'vegetable',
  'mixed',
  'unsure',
] as const
export const bodyValues = [
  'light',
  'balanced',
  'rich',
  'backfat-heavy',
  'ultra-heavy',
] as const
export const coreIntensityValues = ['clean', 'standard', 'heavy'] as const
export const noodleValues = [
  'thin-straight',
  'medium-thin-straight',
  'medium-thick-straight',
  'medium-thick-wavy',
  'extra-thick',
] as const
export const signatureValues = [
  'nori-spinach',
  'corn-butter',
  'bean-sprout-garlic-backfat',
  'fish-kombu',
  'yuzu-citrus',
  'no-preference',
] as const
export const exclusionValues = [
  'pork',
  'chicken',
  'duck',
  'beef',
  'seafood',
  'dairy',
  'none',
] as const

export const questionIds = [
  'form',
  'archetype',
  'tare',
  'source',
  'body',
  'noodle',
  'signature',
  'exclusions',
] as const

export const scoredQuestionIds = [
  'form',
  'archetype',
  'tare',
  'source',
  'body',
  'noodle',
  'signature',
] as const

export type FormOption = (typeof formValues)[number]
export type ArchetypeOption = (typeof archetypeValues)[number]
export type TareOption = (typeof tareValues)[number]
export type SourceOption = (typeof sourceValues)[number]
export type BodyOption = (typeof bodyValues)[number]
export type CoreIntensity = (typeof coreIntensityValues)[number]
export type NoodleOption = (typeof noodleValues)[number]
export type SignatureOption = (typeof signatureValues)[number]
export type ExclusionOption = (typeof exclusionValues)[number]
export type QuestionId = (typeof questionIds)[number]
export type ScoredQuestionId = (typeof scoredQuestionIds)[number]

export interface ChoiceOption<Value extends string = string> {
  value: Value
  label: string
  description: string
  descriptionByForm?: Partial<Record<FormOption, string>>
  exclusive?: boolean
}

export interface QuestionCopy {
  title: string
  description: string
}

export interface QuestionDefinition<Id extends QuestionId = QuestionId> {
  id: Id
  title: string
  description: string
  copyByForm?: Partial<Record<FormOption, QuestionCopy>>
  selectionType: 'single' | 'multiple'
  minSelections: number
  maxSelections: number
  weight: number
  options?: readonly ChoiceOption[]
  branchOptions?: Record<FormOption, readonly ChoiceOption<ArchetypeOption>[]>
}

export interface UserAnswers {
  form?: FormOption
  archetype?: ArchetypeOption
  tare?: TareOption
  source: SourceOption[]
  body?: BodyOption
  noodle?: NoodleOption
  signature: SignatureOption[]
  exclusions: ExclusionOption[]
}

export interface CompletedAnswers {
  form: FormOption
  archetype: ArchetypeOption
  tare: TareOption
  source: SourceOption[]
  body: BodyOption
  noodle: NoodleOption
  signature: SignatureOption[]
  exclusions: ExclusionOption[]
}

export interface MatchRule {
  exact?: readonly string[]
  adjacent?: readonly string[]
  partial?: readonly string[]
}

export interface SignalCondition {
  question: ScoredQuestionId
  anyOf: readonly string[]
}

export interface BonusRule {
  id: string
  label: string
  points: number
  minMatches: number
  conditions: readonly SignalCondition[]
}

export interface ConflictRule {
  id: string
  label: string
  penalty: number
  whenAll: readonly SignalCondition[]
}

export interface NoodleVariantDefinition {
  id: string
  noodle: NoodleOption
  label: string
  summary: string
}

export interface CoreTypeDefinition {
  id: string
  label: string
  summary: string
  intensity: CoreIntensity
  rules: Record<ScoredQuestionId, MatchRule>
  bonuses?: readonly BonusRule[]
  conflicts?: readonly ConflictRule[]
  noodleVariants: readonly NoodleVariantDefinition[]
}

export interface StyleDefinition {
  id: string
  label: string
  summary: string
  family: FormOption
  accent: string
  ingredients: readonly ExclusionOption[]
  coreTypes: readonly CoreTypeDefinition[]
}

export type MatchTier = 'exact' | 'adjacent' | 'partial' | 'miss'

export interface BreakdownItem {
  questionId: ScoredQuestionId
  questionLabel: string
  answerValues: readonly string[]
  answerLabel: string
  tier: MatchTier
  points: number
  note: string
}

export interface RankedStyle {
  style: StyleDefinition
  coreType: CoreTypeDefinition
  subtype: NoodleVariantDefinition
  score: number
  confidence: number
  coreDescriptor: string
  questionPoints: Record<ScoredQuestionId, number>
  breakdown: BreakdownItem[]
  bonusReasons: string[]
  penaltyReasons: string[]
  blockedBy: ExclusionOption[]
  catalogRecommendations: CatalogRecommendation[]
}

export interface ScoringOutcome {
  results: RankedStyle[]
  alternativeResults: RankedStyle[]
  blockedLead: RankedStyle | null
  lowConfidence: boolean
}
