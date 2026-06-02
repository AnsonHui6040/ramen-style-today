import { questionBank } from '../../config/questions'
import { styleCatalog } from '../../config/styles'
import { buildBreakdown, buildCoreDescriptor } from './explainer'
import {
  scoredQuestionIds,
  type CompletedAnswers,
  type CoreTypeDefinition,
  type MatchRule,
  type MatchTier,
  type NoodleVariantDefinition,
  type RankedStyle,
  type ScoredQuestionId,
  type ScoringOutcome,
  type SignalCondition,
  type StyleDefinition,
} from '../../domain/types'

const weightByQuestion = new Map(
  questionBank.map((question) => [question.id, question.weight]),
)

function roundScore(value: number) {
  return Math.round(value * 10) / 10
}

function getAnswerValues(
  answers: CompletedAnswers,
  questionId: ScoredQuestionId,
) {
  switch (questionId) {
    case 'source':
      return answers.source
    case 'signature':
      return answers.signature
    default:
      return [answers[questionId]]
  }
}

function evaluateRule(
  rule: MatchRule,
  answerValues: readonly string[],
): { tier: MatchTier; ratio: number } {
  if (rule.exact?.some((candidate) => answerValues.includes(candidate))) {
    return { tier: 'exact', ratio: 1 }
  }

  if (rule.adjacent?.some((candidate) => answerValues.includes(candidate))) {
    return { tier: 'adjacent', ratio: 0.6 }
  }

  if (rule.partial?.some((candidate) => answerValues.includes(candidate))) {
    return { tier: 'partial', ratio: 0.4 }
  }

  return { tier: 'miss', ratio: 0 }
}

function matchesCondition(
  answers: CompletedAnswers,
  condition: SignalCondition,
) {
  return getAnswerValues(answers, condition.question).some((value) =>
    condition.anyOf.includes(value),
  )
}

function computeBonuses(style: StyleDefinition, answers: CompletedAnswers) {
  const reasons: string[] = []
  const baseRules = style.coreTypes[0]?.bonuses ?? []
  let points = 0

  for (const rule of baseRules) {
    const matched = rule.conditions.filter((condition) =>
      matchesCondition(answers, condition),
    ).length

    if (matched < rule.minMatches) {
      continue
    }

    const ratio = matched / rule.conditions.length
    const awarded = roundScore(rule.points * ratio)
    points += awarded
    reasons.push(`${rule.label} +${awarded}`)
  }

  return {
    points: Math.min(points, 5),
    reasons,
  }
}

function computePenalties(coreType: CoreTypeDefinition, answers: CompletedAnswers) {
  const reasons: string[] = []
  const rules = coreType.conflicts ?? []
  let points = 0

  for (const rule of rules) {
    const active = rule.whenAll.every((condition) =>
      matchesCondition(answers, condition),
    )

    if (!active) {
      continue
    }

    points += rule.penalty
    reasons.push(`${rule.label} -${rule.penalty}`)
  }

  return {
    points: Math.min(points, 15),
    reasons,
  }
}

function pickNoodleVariant(
  coreType: CoreTypeDefinition,
  answers: CompletedAnswers,
): NoodleVariantDefinition {
  return coreType.noodleVariants.find((variant) => variant.noodle === answers.noodle)
    ?? coreType.noodleVariants[0]
}

function blockedByExclusions(
  style: StyleDefinition,
  answers: CompletedAnswers,
) {
  if (answers.exclusions.includes('none')) {
    return []
  }

  return style.ingredients.filter((ingredient) =>
    answers.exclusions.includes(ingredient),
  )
}

function computeConfidence(
  result: RankedStyle,
  nextScore: number,
  answers: CompletedAnswers,
) {
  const base = (result.score / 105) * 100
  const gapBoost = Math.min(10, Math.max(0, result.score - nextScore) * 1.4)
  let uncertaintyPenalty = 0

  if (answers.source.includes('unsure')) {
    uncertaintyPenalty += 6
  }

  if (answers.signature.includes('no-preference')) {
    uncertaintyPenalty += 4
  }

  if (result.penaltyReasons.length) {
    uncertaintyPenalty += Math.min(8, result.penaltyReasons.length * 4)
  }

  return Math.max(24, Math.min(99, Math.round(base + gapBoost - uncertaintyPenalty)))
}

function scoreCoreType(
  style: StyleDefinition,
  coreType: CoreTypeDefinition,
  answers: CompletedAnswers,
): RankedStyle {
  const tiers = {} as Record<ScoredQuestionId, MatchTier>
  const questionPoints = {} as Record<ScoredQuestionId, number>
  let score = 0

  for (const questionId of scoredQuestionIds) {
    const weight = weightByQuestion.get(questionId) ?? 0
    const { ratio, tier } = evaluateRule(
      coreType.rules[questionId],
      getAnswerValues(answers, questionId),
    )

    tiers[questionId] = tier
    questionPoints[questionId] = roundScore(weight * ratio)
    score += questionPoints[questionId]
  }

  const bonus = computeBonuses({ ...style, coreTypes: [coreType] }, answers)
  const penalty = computePenalties(coreType, answers)
  const blockedBy = blockedByExclusions(style, answers)
  const subtype = pickNoodleVariant(coreType, answers)

  score = roundScore(Math.max(0, score + bonus.points - penalty.points))

  return {
    style,
    coreType,
    subtype,
    score,
    confidence: 0,
    coreDescriptor: buildCoreDescriptor(style.label, coreType.label, subtype.label),
    questionPoints,
    breakdown: buildBreakdown(answers, tiers, questionPoints),
    bonusReasons: bonus.reasons,
    penaltyReasons: penalty.reasons,
    blockedBy,
    catalogRecommendations: [],
  }
}

function collapseByDisplayStyle(results: RankedStyle[]) {
  const bestResults = new Map<string, RankedStyle>()

  for (const result of results) {
    const previous = bestResults.get(result.style.id)

    if (!previous || result.score > previous.score) {
      bestResults.set(result.style.id, result)
    }
  }

  return [...bestResults.values()].sort((left, right) => right.score - left.score)
}

function withConfidence(
  results: RankedStyle[],
  answers: CompletedAnswers,
) {
  return results.map((result, index) => ({
    ...result,
    confidence: computeConfidence(
      result,
      results[index + 1]?.score ?? result.score - 4,
      answers,
    ),
  }))
}

export function scoreQuestionnaire(
  answers: CompletedAnswers,
): ScoringOutcome {
  const scored = styleCatalog.flatMap((style) =>
    style.coreTypes.map((coreType) => scoreCoreType(style, coreType, answers)),
  )
  const visible = collapseByDisplayStyle(
    scored.filter((result) => result.blockedBy.length === 0),
  )
  const blocked = collapseByDisplayStyle(
    scored.filter((result) => result.blockedBy.length > 0),
  )

  const visiblePrimary = visible.filter(
    (result) => result.style.family === answers.form,
  )
  const visibleAlternatives = visible.filter(
    (result) => result.style.family !== answers.form,
  )
  const blockedPrimary = blocked.filter(
    (result) => result.style.family === answers.form,
  )

  const topResults = withConfidence(visiblePrimary.slice(0, 3), answers)
  const alternativeResults = withConfidence(visibleAlternatives.slice(0, 3), answers)

  const lowConfidence =
    !topResults.length ||
    topResults[0].confidence < 72 ||
    topResults[0].score - (topResults[1]?.score ?? 0) < 5

  const blockedLead =
    blockedPrimary[0] && (!topResults[0] || blockedPrimary[0].score >= topResults[0].score)
      ? blockedPrimary[0]
      : null

  return {
    results: topResults,
    alternativeResults,
    blockedLead,
    lowConfidence,
  }
}
