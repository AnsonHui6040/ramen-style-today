import { lazy, Suspense, type CSSProperties, type RefObject } from 'react'
import { getOptionLabel } from '../../config/questions'
import type { MenuItemDefinition } from '../../domain/catalog'
import type { ScoringOutcome } from '../../domain/types'
import {
  formatCoreDescriptor,
  getDictionary,
  localizeAnswerLabel,
  localizeCatalogMatchReason,
  localizeMenuItem,
  localizeOptionLabel,
  localizeQuestionTitle,
  localizeReason,
  localizeStore,
  localizeStyle,
  type Locale,
} from '../../i18n'

const RamenFinderMap = lazy(async () => {
  const module = await import('../map/RamenFinderMap')
  return { default: module.RamenFinderMap }
})

const currencyFormatters = {
  JPY: new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }),
  TWD: new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }),
}

function formatItemPrice(item: MenuItemDefinition) {
  if (item.price === undefined || !item.currency) {
    return null
  }

  return currencyFormatters[item.currency].format(item.price)
}

interface ResultsPanelProps {
  outcome: ScoringOutcome
  locale: Locale
  headingRef?: RefObject<HTMLHeadingElement | null>
  onRestart: () => void
  onReviewAnswers: () => void
}

function AlternativeResults({
  outcome,
  locale,
}: Pick<ResultsPanelProps, 'outcome' | 'locale'>) {
  if (!outcome.alternativeResults.length) {
    return null
  }

  const dictionary = getDictionary(locale)

  return (
    <section className="alternative-section">
      <div className="section-heading">
        <p className="eyebrow">{dictionary.results.nearbyEyebrow}</p>
        <h3>{dictionary.results.nearbyTitle}</h3>
        <p>{dictionary.results.nearbyBody}</p>
      </div>

      <div className="alternative-list">
        {outcome.alternativeResults.map((result) => (
          <article
            key={result.coreType.id}
            className="alternative-card"
            style={{ '--accent-color': result.style.accent } as CSSProperties}
          >
            <div>
              <h4>{localizeStyle(result, locale).label}</h4>
              <p>{formatCoreDescriptor(result, locale)}</p>
            </div>
            <span>{result.confidence}%</span>
          </article>
        ))}
      </div>
    </section>
  )
}

export function ResultsPanel({
  outcome,
  locale,
  headingRef,
  onRestart,
  onReviewAnswers,
}: ResultsPanelProps) {
  const dictionary = getDictionary(locale)
  const lead = outcome.results[0]
  const leadStyle = lead ? localizeStyle(lead, locale) : null

  if (!lead) {
    return (
      <section className="results-shell">
        <div className="notice-card warning">
          <h2 ref={headingRef} tabIndex={-1}>{dictionary.results.noResultsTitle}</h2>
          <p>{dictionary.results.noResultsBody}</p>
        </div>
        <AlternativeResults outcome={outcome} locale={locale} />
        <div className="question-actions align-left">
          <button type="button" className="secondary-button" onClick={onReviewAnswers}>
            {dictionary.results.adjust}
          </button>
          <button type="button" className="primary-button" onClick={onRestart}>
            {dictionary.results.restart}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="results-shell">
      <header className="results-hero">
        <p className="eyebrow">{dictionary.results.topMatch}</p>
        <h2 ref={headingRef} tabIndex={-1}>{dictionary.results.eatToday(leadStyle?.label ?? lead.style.label)}</h2>
        <p className="results-summary">{leadStyle?.summary ?? lead.style.summary}</p>

        <div className="hero-metrics">
          <div className="metric-card">
            <span className="metric-label">{dictionary.results.confidence}</span>
            <strong>{lead.confidence}%</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">{dictionary.results.descriptor}</span>
            <strong>{formatCoreDescriptor(lead, locale)}</strong>
          </div>
        </div>

        {outcome.lowConfidence ? (
          <div className="notice-card warning">
            <h3>{dictionary.results.lowConfidenceTitle}</h3>
            <p>{dictionary.results.lowConfidenceBody}</p>
          </div>
        ) : null}

        {outcome.blockedLead ? (
          <div className="notice-card info">
            <h3>{dictionary.results.blockedTitle}</h3>
            <p>
              {dictionary.results.blockedBody(
                localizeStyle(outcome.blockedLead, locale).label,
                outcome.blockedLead.blockedBy
                  .map((value) =>
                    localizeOptionLabel(
                      'exclusions',
                      value,
                      getOptionLabel('exclusions', value),
                      locale,
                    ),
                  )
                  .join(' / '),
              )}
            </p>
          </div>
        ) : null}

        <div className="question-actions align-left">
          <button type="button" className="secondary-button" onClick={onReviewAnswers}>
            {dictionary.results.adjust}
          </button>
          <button type="button" className="primary-button" onClick={onRestart}>
            {dictionary.results.restart}
          </button>
        </div>
      </header>

      <Suspense
        fallback={(
          <section className="ramen-finder" aria-busy="true" aria-live="polite">
            <p>{dictionary.results.map.loading}</p>
          </section>
        )}
      >
        <RamenFinderMap result={lead} locale={locale} />
      </Suspense>

      <div className="results-grid">
        {outcome.results.map((result, index) => (
          <article
            key={result.coreType.id}
            className="result-card"
            style={{ '--accent-color': result.style.accent } as CSSProperties}
          >
            <div className="result-card__topline">
              <span className="rank-badge">#{index + 1}</span>
              <span className="confidence-pill">{result.confidence}%</span>
            </div>

            <h3>{localizeStyle(result, locale).label}</h3>
            <p className="result-card__descriptor">{formatCoreDescriptor(result, locale)}</p>
            <p className="result-card__summary">{localizeStyle(result, locale).summary}</p>

            <div className="support-list">
              {result.bonusReasons.length ? (
                <p>
                  {dictionary.results.bonus}:{' '}
                  {result.bonusReasons.map((reason) => localizeReason(reason, locale)).join(' / ')}
                </p>
              ) : null}
              {result.penaltyReasons.length ? (
                <p>
                  {dictionary.results.penalty}:{' '}
                  {result.penaltyReasons.map((reason) => localizeReason(reason, locale)).join(' / ')}
                </p>
              ) : null}
            </div>

            <div className="catalog-block">
              <p className="catalog-block__title">{dictionary.results.catalogTitle}</p>

              {result.catalogRecommendations.length ? (
                <ul className="catalog-list">
                  {result.catalogRecommendations.map((recommendation) => {
                    const store = localizeStore(recommendation.store, locale)

                    return (
                      <li key={recommendation.store.id} className="catalog-card">
                        <div>
                          <div className="catalog-card__headline">
                            <strong>{store.name}</strong>
                            {store.sourceUrl ? (
                              <a
                                href={store.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={dictionary.app.opensInNewTab(dictionary.results.officialPage)}
                              >
                                {dictionary.results.officialPage}
                              </a>
                            ) : null}
                          </div>
                          <p>
                            {store.location}
                            {' · '}
                            {store.summary}
                          </p>
                          <p>{localizeCatalogMatchReason(recommendation.matchReason, locale)}</p>
                        </div>

                        <ul className="catalog-items">
                          {recommendation.items.map((item) => {
                            const localizedItem = localizeMenuItem(item, locale)

                            return (
                              <li key={item.id}>
                                <div className="catalog-item__headline">
                                  <span>{localizedItem.name}</span>
                                  {formatItemPrice(item) ? <span>{formatItemPrice(item)}</span> : null}
                                </div>
                                <small>{localizedItem.summary}</small>
                              </li>
                            )
                          })}
                        </ul>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="catalog-empty">{dictionary.results.catalogEmpty}</p>
              )}
            </div>

            <details className="breakdown-panel" open={index === 0}>
              <summary>{dictionary.results.why}</summary>
              <ul className="breakdown-list">
                {result.breakdown.map((item) => (
                  <li key={item.questionId} className={`tier-${item.tier}`}>
                    <span className="breakdown-question">
                      {localizeQuestionTitle(item.questionId, item.questionLabel, locale)}
                    </span>
                    <span className="breakdown-answer">
                      {dictionary.results.answerPhrase(
                        localizeAnswerLabel(item.questionId, item.answerValues, item.answerLabel, locale),
                      )}
                    </span>
                    <span className="breakdown-note">
                      {dictionary.results.tierNotes[item.tier]}
                    </span>
                    <span className="breakdown-score">
                      {dictionary.results.scoreLabel(item.points)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </div>

      <AlternativeResults outcome={outcome} locale={locale} />
    </section>
  )
}
