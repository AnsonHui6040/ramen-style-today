import questionBankData from '../data/questions.json'
import { assertQuestionBank, isArchetypeAllowed } from '../domain/schema'
import type {
  ChoiceOption,
  FormOption,
  QuestionDefinition,
  QuestionId,
} from '../domain/types'

export const questionBank = questionBankData as readonly QuestionDefinition[]

assertQuestionBank(questionBank)

const questionMap = new Map(questionBank.map((question) => [question.id, question]))

export function getQuestionById(questionId: QuestionId) {
  return questionMap.get(questionId)
}

export function resolveQuestionOptions(
  question: QuestionDefinition,
  form?: FormOption,
): readonly ChoiceOption[] {
  if (!question.branchOptions) {
    return question.options ?? []
  }

  if (!form) {
    return []
  }

  return question.branchOptions[form]
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