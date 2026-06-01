import { getOptionLabel, getQuestionById } from '../../config/questions'
import {
  scoredQuestionIds,
  type CompletedAnswers,
  type MatchTier,
} from '../../domain/types'

const tierNotes: Record<MatchTier, string> = {
  exact: '核心訊號對上。',
  adjacent: '方向接近，但不是最典型。',
  partial: '只命中部分線索。',
  miss: '這題和該風格距離較遠。',
}

function answerLabelFromValue(values: readonly string[], questionId: keyof CompletedAnswers, form: CompletedAnswers['form']) {
  return values
    .map((value) => getOptionLabel(questionId, value, form))
    .join(' / ')
}

export function getAnswerLabel(questionId: keyof CompletedAnswers, answers: CompletedAnswers) {
  switch (questionId) {
    case 'source':
    case 'signature':
    case 'exclusions':
      return answerLabelFromValue(answers[questionId], questionId, answers.form)
    default:
      return getOptionLabel(questionId, answers[questionId], answers.form)
  }
}

export function buildCoreDescriptor(
  styleLabel: string,
  coreLabel: string,
  noodleLabel: string,
) {
  return `${styleLabel} / ${coreLabel} / ${noodleLabel}`
}

export function buildBreakdown(
  answers: CompletedAnswers,
  tiers: Record<(typeof scoredQuestionIds)[number], MatchTier>,
  points: Record<(typeof scoredQuestionIds)[number], number>,
) {
  return scoredQuestionIds.map((questionId) => ({
    questionId,
    questionLabel: getQuestionById(questionId)?.title ?? questionId,
    answerLabel: getAnswerLabel(questionId, answers),
    tier: tiers[questionId],
    points: points[questionId],
    note: tierNotes[tiers[questionId]],
  }))
}