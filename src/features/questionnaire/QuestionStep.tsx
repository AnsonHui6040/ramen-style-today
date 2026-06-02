import type { ChoiceOption, FormOption, QuestionDefinition } from '../../domain/types'
import { getDictionary, type Locale } from '../../i18n'

interface QuestionStepProps {
  question: QuestionDefinition
  options: readonly ChoiceOption[]
  form?: FormOption
  locale: Locale
  selectedValues: string[]
  stepNumber: number
  totalSteps: number
  canContinue: boolean
  isLast: boolean
  onSelect: (value: string) => void
  onBack: () => void
  onContinue: () => void
}

export function QuestionStep({
  question,
  options,
  form,
  locale,
  selectedValues,
  stepNumber,
  totalSteps,
  canContinue,
  isLast,
  onSelect,
  onBack,
  onContinue,
}: QuestionStepProps) {
  const dictionary = getDictionary(locale)
  const questionCopy = form ? question.copyByForm?.[form] : undefined
  const exclusiveValues = options
    .filter((option) => option.exclusive)
    .map((option) => option.value)
  const hasExclusiveSelected = selectedValues.some((value) =>
    exclusiveValues.includes(value),
  )
  const selectionCapReached =
    question.selectionType === 'multiple' &&
    selectedValues.length >= question.maxSelections

  return (
    <section className="question-card">
      <header className="question-header">
        <p className="eyebrow">{dictionary.questionUi.step(stepNumber, totalSteps)}</p>
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${(stepNumber / totalSteps) * 100}%` }} />
        </div>
        <h2>{questionCopy?.title ?? question.title}</h2>
        <p className="question-description">
          {questionCopy?.description ?? question.description}
        </p>
      </header>

      <div className="choice-grid">
        {options.map((option) => {
          const selected = selectedValues.includes(option.value)
          const disabled =
            !selected &&
            !option.exclusive &&
            selectionCapReached &&
            !hasExclusiveSelected

          return (
            <button
              key={option.value}
              type="button"
              className={`choice-card${selected ? ' selected' : ''}`}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onSelect(option.value)}
            >
              <span className="choice-card__title">{option.label}</span>
              <span className="choice-card__description">
                {(form ? option.descriptionByForm?.[form] : undefined) ?? option.description}
              </span>
            </button>
          )
        })}
      </div>

      <footer className="question-footer">
        <div className="selection-meta">
          {question.selectionType === 'multiple'
            ? dictionary.questionUi.multipleMeta(question.maxSelections, selectedValues.length)
            : dictionary.questionUi.singleMeta}
        </div>

        <div className="question-actions">
          <button type="button" className="secondary-button" onClick={onBack}>
            {dictionary.questionUi.back}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!canContinue}
            onClick={onContinue}
          >
            {isLast ? dictionary.questionUi.results : dictionary.questionUi.next}
          </button>
        </div>
      </footer>
    </section>
  )
}
