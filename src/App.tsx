import { startTransition, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import './App.css'
import { questionBank, resolveQuestionOptions } from './config/questions'
import { QuestionStep } from './features/questionnaire/QuestionStep'
import { ResultsPanel } from './features/results/ResultsPanel'
import { restoreUserAnswers, toCompletedAnswers } from './domain/schema'
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
const storageAvailabilityListeners = new Set<() => void>()
let storageIsAvailable = true

function createInitialAnswers(): UserAnswers {
  return {
    source: [],
    signature: [],
    exclusions: ['none'],
  }
}

const localeLanguageTags: Record<Locale, string> = {
  'zh-TW': 'zh-Hant-TW',
  en: 'en',
  ja: 'ja',
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

function isStoredState(value: unknown): value is Partial<StoredState> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getStoredStepIndex(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? Math.min(value, questionBank.length - 1)
    : 0
}

function saveStoredState(snapshot: StoredState) {
  const storage = getStorage()

  if (!storage) {
    return false
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    return true
  } catch {
    return false
  }
}

function clearStoredState() {
  const storage = getStorage()

  if (!storage) {
    return false
  }

  try {
    storage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

function subscribeToStorageAvailability(listener: () => void) {
  storageAvailabilityListeners.add(listener)

  return () => {
    storageAvailabilityListeners.delete(listener)
  }
}

function getStorageAvailabilitySnapshot() {
  return storageIsAvailable
}

function reportStorageAvailability(isAvailable: boolean) {
  if (storageIsAvailable === isAvailable) {
    return
  }

  storageIsAvailable = isAvailable
  storageAvailabilityListeners.forEach((listener) => listener())
}

function readStoredState(): StoredState {
  const fallback: StoredState = {
    phase: 'intro',
    stepIndex: 0,
    answers: createInitialAnswers(),
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

    const parsed: unknown = JSON.parse(raw)

    if (!isStoredState(parsed)) {
      return fallback
    }

    const answers = restoreUserAnswers(parsed.answers)
    const phase = parsed.phase === 'questions' || parsed.phase === 'results'
      ? parsed.phase
      : 'intro'

    const restoredState: StoredState = {
      phase,
      stepIndex: getStoredStepIndex(parsed.stepIndex),
      locale: isLocale(parsed.locale) ? parsed.locale : 'zh-TW',
      answers,
    }

    if (restoredState.phase === 'results' && !toCompletedAnswers(restoredState.answers)) {
      return {
        ...fallback,
        answers: restoredState.answers,
        locale: restoredState.locale,
      }
    }

    if (restoredState.phase !== 'questions') {
      return restoredState
    }

    const normalizedState = applyForcedAnswersFromStep(
      restoredState.answers,
      Math.min(restoredState.stepIndex, questionBank.length - 1),
    )

    return {
      ...restoredState,
      ...normalizedState,
    }
  } catch {
    return fallback
  }
}

function getSelectedValues(questionId: QuestionId, answers: UserAnswers): string[] {
  switch (questionId) {
    case 'source':
      return [...answers.source]
    case 'signature':
      return [...answers.signature]
    case 'exclusions':
      return [...answers.exclusions]
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

function resetPreferenceAnswers(answers: UserAnswers): UserAnswers {
  return {
    ...answers,
    tare: undefined,
    source: [],
    body: undefined,
    noodle: undefined,
    signature: [],
  }
}

function writeForcedQuestionValue(
  answers: UserAnswers,
  questionId: QuestionId,
  value: string,
): UserAnswers {
  switch (questionId) {
    case 'form':
      return resetPreferenceAnswers({
        ...answers,
        form: value as UserAnswers['form'],
        archetype: undefined,
      })
    case 'archetype':
      return resetPreferenceAnswers({
        ...answers,
        archetype: value as UserAnswers['archetype'],
      })
    case 'tare':
      return { ...answers, tare: value as UserAnswers['tare'] }
    case 'source':
      return { ...answers, source: [value] as UserAnswers['source'] }
    case 'body':
      return { ...answers, body: value as UserAnswers['body'] }
    case 'noodle':
      return { ...answers, noodle: value as UserAnswers['noodle'] }
    case 'signature':
      return { ...answers, signature: [value] as UserAnswers['signature'] }
    case 'exclusions':
      return { ...answers, exclusions: [value] as UserAnswers['exclusions'] }
  }
}

function getForcedQuestionValue(stepIndex: number, answers: UserAnswers) {
  if (stepIndex <= 1 || stepIndex >= questionBank.length - 1) {
    return undefined
  }

  const question = questionBank[stepIndex]

  if (!question) {
    return undefined
  }

  const options = resolveQuestionOptions(
    question,
    answers.form,
    answers.archetype,
  )
  const [onlyOption] = options

  return options.length === 1 ? onlyOption?.value : undefined
}

function applyForcedAnswersFromStep(
  answers: UserAnswers,
  stepIndex: number,
) {
  let nextAnswers = answers
  let nextStepIndex = stepIndex

  while (nextStepIndex < questionBank.length) {
    const question = questionBank[nextStepIndex]
    const forcedValue = getForcedQuestionValue(nextStepIndex, nextAnswers)

    if (!question || !forcedValue) {
      break
    }

    nextAnswers = writeForcedQuestionValue(
      nextAnswers,
      question.id,
      forcedValue,
    )
    nextStepIndex += 1
  }

  return {
    answers: nextAnswers,
    stepIndex: Math.min(nextStepIndex, questionBank.length - 1),
  }
}

function getPreviousInteractiveStep(stepIndex: number, answers: UserAnswers) {
  let previousStepIndex = Math.max(0, stepIndex - 1)

  while (previousStepIndex > 1 && getForcedQuestionValue(previousStepIndex, answers)) {
    previousStepIndex -= 1
  }

  return previousStepIndex
}

function App() {
  const [storedState] = useState(readStoredState)
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
  const storageUnavailable = !useSyncExternalStore(
    subscribeToStorageAvailability,
    getStorageAvailabilitySnapshot,
    getStorageAvailabilitySnapshot,
  )
  const introHeadingRef = useRef<HTMLHeadingElement>(null)
  const questionHeadingRef = useRef<HTMLHeadingElement>(null)
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null)
  const shouldMoveFocus = useRef(false)
  const dictionary = getDictionary(locale)

  useEffect(() => {
    const snapshot: StoredState = {
      phase,
      stepIndex,
      answers,
      locale,
    }

    reportStorageAvailability(saveStoredState(snapshot))
  }, [answers, locale, phase, stepIndex])

  useEffect(() => {
    document.documentElement.lang = localeLanguageTags[locale]
    document.title = `Ramen Style Today — ${dictionary.app.headline}`
  }, [dictionary.app.headline, locale])

  useEffect(() => {
    if (!shouldMoveFocus.current) {
      return
    }

    const target = phase === 'intro'
      ? introHeadingRef.current
      : phase === 'questions'
        ? questionHeadingRef.current
        : resultsHeadingRef.current

    target?.focus()
    shouldMoveFocus.current = false
  }, [phase, stepIndex])

  const currentQuestion = questionBank[stepIndex]
  const currentOptions = currentQuestion
    ? resolveQuestionOptions(currentQuestion, answers.form, answers.archetype)
    : []
  const currentOptionValues = new Set(currentOptions.map((option) => option.value))
  const currentQuestionView = currentQuestion
    ? localizeQuestion(currentQuestion, locale, answers.form)
    : null
  const currentOptionsView = currentQuestion
    ? currentOptions.map((option) =>
      localizeOption(currentQuestion.id, option, locale, answers.form),
    )
    : []
  const selectedValues = currentQuestion
    ? getSelectedValues(currentQuestion.id, answers).filter((value) =>
      currentOptionValues.has(value),
    )
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
          if (previous.form === value) {
            return previous
          }

          return resetPreferenceAnswers({
            ...next,
            form: value as UserAnswers['form'],
            archetype: undefined,
          })
        case 'archetype':
          if (previous.archetype === value) {
            return previous
          }

          return resetPreferenceAnswers({
            ...next,
            archetype: value as UserAnswers['archetype'],
          })
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

    const options = resolveQuestionOptions(
      currentQuestion,
      answers.form,
      answers.archetype,
    )
    const allowedValues = options.map((option) => option.value)
    const exclusiveValues = options
      .filter((option) => option.exclusive)
      .map((option) => option.value)
    const isExclusive = exclusiveValues.includes(value)

    setAnswers((previous) => {
      const currentValues = getSelectedValues(questionId, previous).filter(
        (candidate) => allowedValues.includes(candidate),
      )

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
        shouldMoveFocus.current = true
        setOutcome(enrichScoringOutcome(scoreQuestionnaire(completed)))
        setPhase('results')
      })
      return
    }

    const nextState = applyForcedAnswersFromStep(answers, stepIndex + 1)
    shouldMoveFocus.current = true

    if (nextState.answers !== answers) {
      setAnswers(nextState.answers)
    }

    setStepIndex(nextState.stepIndex)
  }

  function handleBack() {
    shouldMoveFocus.current = true

    if (phase === 'questions' && stepIndex === 0) {
      setPhase('intro')
      return
    }

    setStepIndex((previous) => getPreviousInteractiveStep(previous, answers))
  }

  function startFlow() {
    shouldMoveFocus.current = true
    setPhase('questions')
  }

  function reviewAnswers() {
    shouldMoveFocus.current = true
    setPhase('questions')
    setStepIndex(0)
  }

  function restart() {
    shouldMoveFocus.current = true
    setAnswers(createInitialAnswers())
    setOutcome(null)
    setStepIndex(0)
    setPhase('intro')
    reportStorageAvailability(clearStoredState())
  }

  const answeredCount = questionBank.filter((question) => {
    const values = getSelectedValues(question.id, answers)
    return hasMeaningfulAnswer(question.id, values)
  }).length
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {dictionary.app.skipToContent}
      </a>
      <header className="app-header">
        <div>
          <p className="eyebrow">Ramen Style Today</p>
          <h1>{dictionary.app.headline}</h1>
          <p className="lede">
            {dictionary.app.lede}
          </p>
        </div>
        <div className="locale-switcher" aria-label={dictionary.app.language}>
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

      <main id="main-content" tabIndex={-1}>
        {storageUnavailable ? (
          <p className="storage-notice" role="status">
            {dictionary.app.storageUnavailable}
          </p>
        ) : null}

        {phase === 'intro' ? (
          <section className="intro-panel">
            <div className="intro-copy">
              <h2 ref={introHeadingRef} tabIndex={-1}>{dictionary.app.introTitle}</h2>
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
                  <strong>{dictionary.app.statWeightValue}</strong>
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
            headingRef={questionHeadingRef}
            onSelect={handleSelect}
            onBack={handleBack}
            onContinue={handleContinue}
          />
        ) : null}

        {phase === 'results' && outcome ? (
          <ResultsPanel
            outcome={outcome}
            locale={locale}
            headingRef={resultsHeadingRef}
            onRestart={restart}
            onReviewAnswers={reviewAnswers}
          />
        ) : null}
      </main>
    </div>
  )
}

export default App
