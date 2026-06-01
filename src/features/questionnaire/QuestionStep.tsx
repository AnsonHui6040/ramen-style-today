import type { ChoiceOption, QuestionDefinition } from '../../domain/types'

interface QuestionStepProps {
  question: QuestionDefinition
  options: readonly ChoiceOption[]
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
  selectedValues,
  stepNumber,
  totalSteps,
  canContinue,
  isLast,
  onSelect,
  onBack,
  onContinue,
}: QuestionStepProps) {
  const exclusiveValues = options
    .filter((option) => option.exclusive)
    .map((option) => option.value)
  const hasExclusiveSelected = selectedValues.some((value) =>
    exclusiveValues.includes(value),
  )
  const selectionCapReached = selectedValues.length >= question.maxSelections

  return (
    <section className="question-card">
      <header className="question-header">
        <p className="eyebrow">Step {stepNumber} / {totalSteps}</p>
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${(stepNumber / totalSteps) * 100}%` }} />
        </div>
        <h2>{question.title}</h2>
        <p className="question-description">{question.description}</p>
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
              <span className="choice-card__description">{option.description}</span>
            </button>
          )
        })}
      </div>

      <footer className="question-footer">
        <div className="selection-meta">
          {question.selectionType === 'multiple'
            ? `可選 ${question.maxSelections} 個，目前 ${selectedValues.length} 個`
            : '單選題'}
        </div>

        <div className="question-actions">
          <button type="button" className="secondary-button" onClick={onBack}>
            上一步
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!canContinue}
            onClick={onContinue}
          >
            {isLast ? '看結果' : '下一題'}
          </button>
        </div>
      </footer>
    </section>
  )
}