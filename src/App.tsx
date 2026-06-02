import { startTransition, useEffect, useState } from 'react'
import './App.css'
import { questionBank, resolveQuestionOptions } from './config/questions'
import { QuestionStep } from './features/questionnaire/QuestionStep'
import { ResultsPanel } from './features/results/ResultsPanel'
import { toCompletedAnswers } from './domain/schema'
import type {
  QuestionId,
  ScoringOutcome,
  UserAnswers,
} from './domain/types'
import {
  getDictionary,
  localizeOption,
  localizeQuestion,
  locales,
  type Locale,
} from './i18n'
import { enrichScoringOutcome } from './lib/catalog/enricher'
import { scoreQuestionnaire } from './lib/scoring/scorer'

type AppPhase = 'intro' | 'questions' | 'results'

interface StoredState {
  phase: AppPhase
  stepIndex: number
  answers: UserAnswers
  locale: Locale
}

const STORAGE_KEY = 'ramen-style-today.state.v1'

const initialAnswers: UserAnswers = {
  source: [],
  signature: [],
  exclusions: ['none'],
}

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && locales.includes(value as Locale)
}

function getStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage ?? null
  } catch {
    return null
  }
}

function readStoredState(): StoredState {
  const fallback: StoredState = {
    phase: 'intro',
    stepIndex: 0,
    answers: initialAnswers,
    locale: 'zh-TW',
  }

  const storage = getStorage()

  if (!storage) {
    return fallback
  }

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as Partial<StoredState>

    return {
      phase: parsed.phase === 'questions' || parsed.phase === 'results' ? parsed.phase : 'intro',
      stepIndex:
        typeof parsed.stepIndex === 'number' && parsed.stepIndex >= 0
          ? parsed.stepIndex
          : 0,
      locale: isLocale(parsed.locale) ? parsed.locale : 'zh-TW',
      answers: {
        ...initialAnswers,
        ...parsed.answers,
        source: parsed.answers?.source ?? [],
        signature: parsed.answers?.signature ?? [],
        exclusions: parsed.answers?.exclusions?.length
          ? parsed.answers.exclusions
          : ['none'],
      },
    }
  } catch {
    return fallback
  }
}

function getSelectedValues(questionId: QuestionId, answers: UserAnswers) {
  switch (questionId) {
    case 'source':
      return answers.source
    case 'signature':
      return answers.signature
    case 'exclusions':
      return answers.exclusions
    case 'form':
      return answers.form ? [answers.form] : []
    case 'archetype':
      return answers.archetype ? [answers.archetype] : []
    case 'tare':
      return answers.tare ? [answers.tare] : []
    case 'body':
      return answers.body ? [answers.body] : []
    case 'noodle':
      return answers.noodle ? [answers.noodle] : []
  }
}

function hasMeaningfulAnswer(questionId: QuestionId, values: string[]) {
  if (questionId === 'exclusions') {
    return values.some((value) => value !== 'none')
  }

  return values.length > 0
}

function App() {
  const storedState = readStoredState()
  const [phase, setPhase] = useState<AppPhase>(storedState.phase)
  const [stepIndex, setStepIndex] = useState(
    Math.min(storedState.stepIndex, questionBank.length - 1),
  )
  const [answers, setAnswers] = useState<UserAnswers>(storedState.answers)
  const [locale, setLocale] = useState<Locale>(storedState.locale)
  const [outcome, setOutcome] = useState<ScoringOutcome | null>(() => {
    const completed = toCompletedAnswers(storedState.answers)
    return storedState.phase === 'results' && completed
      ? enrichScoringOutcome(scoreQuestionnaire(completed))
      : null
  })

  useEffect(() => {
    const storage = getStorage()

    if (!storage) {
      return
    }

    const snapshot: StoredState = {
      phase,
      stepIndex,
      answers,
      locale,
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  }, [answers, locale, phase, stepIndex])

  const currentQuestion = questionBank[stepIndex]
  const currentOptions = currentQuestion
    ? resolveQuestionOptions(currentQuestion, answers.form)
    : []
  const currentQuestionView = currentQuestion
    ? localizeQuestion(currentQuestion, locale, answers.form)
    : null
  const currentOptionsView = currentQuestion
    ? currentOptions.map((option) =>
      localizeOption(currentQuestion.id, option, locale, answers.form),
    )
    : []
  const selectedValues = currentQuestion
    ? getSelectedValues(currentQuestion.id, answers)
    : []
  const canContinue =
    currentQuestion &&
    selectedValues.length >= currentQuestion.minSelections &&
    (currentQuestion.id !== 'archetype' || currentOptions.length > 0)

  function writeSingleValue(questionId: QuestionId, value: string) {
    setAnswers((previous) => {
      const next = { ...previous }

      switch (questionId) {
        case 'form':
          next.form = value as UserAnswers['form']
          if (
            previous.archetype &&
            !resolveQuestionOptions(questionBank[1], next.form).some(
              (option) => option.value === previous.archetype,
            )
          ) {
            next.archetype = undefined
          }
          return next
        case 'archetype':
          next.archetype = value as UserAnswers['archetype']
          return next
        case 'tare':
          next.tare = value as UserAnswers['tare']
          return next
        case 'body':
          next.body = value as UserAnswers['body']
          return next
        case 'noodle':
          next.noodle = value as UserAnswers['noodle']
          return next
        default:
          return previous
      }
    })
  }

  function writeMultipleValue(questionId: QuestionId, value: string) {
    if (!currentQuestion) {
      return
    }

    const options = resolveQuestionOptions(currentQuestion, answers.form)
    const exclusiveValues = options
      .filter((option) => option.exclusive)
      .map((option) => option.value)
    const isExclusive = exclusiveValues.includes(value)

    setAnswers((previous) => {
      const currentValues = getSelectedValues(questionId, previous)

      if (isExclusive) {
        if (questionId === 'source') {
          return { ...previous, source: [value] as UserAnswers['source'] }
        }

        if (questionId === 'signature') {
          return { ...previous, signature: [value] as UserAnswers['signature'] }
        }

        if (questionId === 'exclusions') {
          return { ...previous, exclusions: [value] as UserAnswers['exclusions'] }
        }
      }

      const withoutExclusive = currentValues.filter(
        (candidate) => !exclusiveValues.includes(candidate),
      )
      const alreadySelected = withoutExclusive.some(
        (candidate) => candidate === value,
      )
      const nextValues = alreadySelected
        ? withoutExclusive.filter((candidate) => candidate !== value)
        : withoutExclusive.length < currentQuestion.maxSelections
          ? [...withoutExclusive, value]
          : withoutExclusive

      if (questionId === 'source') {
        return { ...previous, source: nextValues as UserAnswers['source'] }
      }

      if (questionId === 'signature') {
        return {
          ...previous,
          signature: nextValues as UserAnswers['signature'],
        }
      }

      return {
        ...previous,
        exclusions: (nextValues.length ? nextValues : ['none']) as UserAnswers['exclusions'],
      }
    })
  }

  function handleSelect(value: string) {
    if (!currentQuestion) {
      return
    }

    if (currentQuestion.selectionType === 'single') {
      writeSingleValue(currentQuestion.id, value)
      return
    }

    writeMultipleValue(currentQuestion.id, value)
  }

  function handleContinue() {
    if (!currentQuestion || !canContinue) {
      return
    }

    if (stepIndex === questionBank.length - 1) {
      const completed = toCompletedAnswers(answers)
      if (!completed) {
        return
      }

      startTransition(() => {
        setOutcome(enrichScoringOutcome(scoreQuestionnaire(completed)))
        setPhase('results')
      })
      return
    }

    setStepIndex((previous) => previous + 1)
  }

  function handleBack() {
    if (phase === 'questions' && stepIndex === 0) {
      setPhase('intro')
      return
    }

    setStepIndex((previous) => Math.max(0, previous - 1))
  }

  function startFlow() {
    setPhase('questions')
  }

  function reviewAnswers() {
    setPhase('questions')
    setStepIndex(0)
  }

  function restart() {
    const storage = getStorage()

    setAnswers(initialAnswers)
    setOutcome(null)
    setStepIndex(0)
    setPhase('intro')
    storage?.removeItem(STORAGE_KEY)
  }

  const answeredCount = questionBank.filter((question) => {
    const values = getSelectedValues(question.id, answers)
    return hasMeaningfulAnswer(question.id, values)
  }).length
  const dictionary = getDictionary(locale)

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Ramen Style Today</p>
          <h1>{dictionary.app.headline}</h1>
          <p className="lede">
            {dictionary.app.lede}
          </p>
        </div>
        <div className="locale-switcher" aria-label="Language">
          {locales.map((candidate) => (
            <button
              key={candidate}
              type="button"
              className={candidate === locale ? 'active' : ''}
              aria-pressed={candidate === locale}
              onClick={() => setLocale(candidate)}
            >
              {getDictionary(candidate).localeLabel}
            </button>
          ))}
        </div>
        <div className="summary-pills">
          {dictionary.app.pills.map((pill) => (
            <span key={pill} className="pill">{pill}</span>
          ))}
        </div>
      </header>

      {phase === 'intro' ? (
        <section className="intro-panel">
          <div className="intro-copy">
            <h2>{dictionary.app.introTitle}</h2>
            <p>
              {dictionary.app.introBody}
            </p>
            <div className="intro-stats">
              <div>
                <strong>7-8</strong>
                <span>{dictionary.app.statSteps}</span>
              </div>
              <div>
                <strong>{answeredCount}</strong>
                <span>{dictionary.app.statSaved}</span>
              </div>
              <div>
                <strong>100</strong>
                <span>{dictionary.app.statWeight}</span>
              </div>
            </div>
          </div>

          <aside className="intro-card">
            <h3>{dictionary.app.implementedTitle}</h3>
            <ul>
              {dictionary.app.implemented.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="question-actions align-left">
              <button type="button" className="primary-button" onClick={startFlow}>
                {answeredCount > 0 ? dictionary.app.continue : dictionary.app.start}
              </button>
              {answeredCount > 0 ? (
                <button type="button" className="secondary-button" onClick={restart}>
                  {dictionary.app.clear}
                </button>
              ) : null}
            </div>
          </aside>
        </section>
      ) : null}

      {phase === 'questions' && currentQuestion && currentQuestionView ? (
        <QuestionStep
          question={currentQuestionView}
          options={currentOptionsView}
          form={answers.form}
          locale={locale}
          selectedValues={selectedValues}
          stepNumber={stepIndex + 1}
          totalSteps={questionBank.length}
          canContinue={Boolean(canContinue)}
          isLast={stepIndex === questionBank.length - 1}
          onSelect={handleSelect}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      ) : null}

      {phase === 'results' && outcome ? (
        <ResultsPanel
          outcome={outcome}
          locale={locale}
          onRestart={restart}
          onReviewAnswers={reviewAnswers}
        />
      ) : null}
    </div>
  )
}

export default App
