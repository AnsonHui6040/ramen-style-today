import questionBankData from '../data/questions.json'
import { getAllowedQuestionValues } from '../domain/questionRules'
import { assertQuestionBank } from '../domain/schema'
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
  const allowedValues = getAllowedQuestionValues(question.id, archetype)

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
