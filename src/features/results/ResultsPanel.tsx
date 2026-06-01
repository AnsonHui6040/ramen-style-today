import { getOptionLabel } from '../../config/questions'
import type { MenuItemDefinition } from '../../domain/catalog'
import type { ScoringOutcome } from '../../domain/types'

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
  onRestart: () => void
  onReviewAnswers: () => void
}

export function ResultsPanel({
  outcome,
  onRestart,
  onReviewAnswers,
}: ResultsPanelProps) {
  const lead = outcome.results[0]

  if (!lead) {
    return (
      <section className="results-shell">
        <div className="notice-card warning">
          <h2>沒有可顯示的結果</h2>
          <p>目前所有高分風格都被硬過濾擋掉了，請回去調整 Q8 或其他訊號。</p>
        </div>
        <div className="question-actions align-left">
          <button type="button" className="secondary-button" onClick={onReviewAnswers}>
            回去調整
          </button>
          <button type="button" className="primary-button" onClick={onRestart}>
            重新開始
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="results-shell">
      <header className="results-hero">
        <p className="eyebrow">Top Match</p>
        <h2>今天先吃 {lead.style.label}</h2>
        <p className="results-summary">{lead.style.summary}</p>

        <div className="hero-metrics">
          <div className="metric-card">
            <span className="metric-label">信心分數</span>
            <strong>{lead.confidence}%</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">組合結果</span>
            <strong>{lead.coreDescriptor}</strong>
          </div>
        </div>

        {outcome.lowConfidence ? (
          <div className="notice-card warning">
            <h3>這次結果偏探索型</h3>
            <p>第一名和第二名距離不大，代表你的答案跨了兩條以上的風格線。</p>
          </div>
        ) : null}

        {outcome.blockedLead ? (
          <div className="notice-card info">
            <h3>有高分風格被硬過濾擋掉</h3>
            <p>
              {outcome.blockedLead.style.label} 原本分數也很高，但因為排除了
              {' '}
              {outcome.blockedLead.blockedBy
                .map((value) => getOptionLabel('exclusions', value))
                .join(' / ')}
              ，所以沒有出現在正式推薦裡。
            </p>
          </div>
        ) : null}

        <div className="question-actions align-left">
          <button type="button" className="secondary-button" onClick={onReviewAnswers}>
            調整答案
          </button>
          <button type="button" className="primary-button" onClick={onRestart}>
            重新開始
          </button>
        </div>
      </header>

      <div className="results-grid">
        {outcome.results.map((result, index) => (
          <article
            key={result.coreType.id}
            className="result-card"
            style={{ '--accent-color': result.style.accent } as React.CSSProperties}
          >
            <div className="result-card__topline">
              <span className="rank-badge">#{index + 1}</span>
              <span className="confidence-pill">{result.confidence}%</span>
            </div>

            <h3>{result.style.label}</h3>
            <p className="result-card__descriptor">{result.coreDescriptor}</p>
            <p className="result-card__summary">{result.style.summary}</p>

            <div className="support-list">
              {result.bonusReasons.length ? (
                <p>加分: {result.bonusReasons.join(' / ')}</p>
              ) : null}
              {result.penaltyReasons.length ? (
                <p>扣分: {result.penaltyReasons.join(' / ')}</p>
              ) : null}
            </div>

            <div className="catalog-block">
              <p className="catalog-block__title">推薦店家 / 品項</p>

              {result.catalogRecommendations.length ? (
                <ul className="catalog-list">
                  {result.catalogRecommendations.map((recommendation) => (
                    <li key={recommendation.store.id} className="catalog-card">
                      <div>
                        <div className="catalog-card__headline">
                          <strong>{recommendation.store.name}</strong>
                          {recommendation.store.sourceUrl ? (
                            <a href={recommendation.store.sourceUrl} target="_blank" rel="noreferrer">
                              官方頁面
                            </a>
                          ) : null}
                        </div>
                        <p>
                          {recommendation.store.location}
                          {' · '}
                          {recommendation.store.summary}
                        </p>
                        <p>{recommendation.matchReason}</p>
                      </div>

                      <ul className="catalog-items">
                        {recommendation.items.map((item) => (
                          <li key={item.id}>
                            <div className="catalog-item__headline">
                              <span>{item.name}</span>
                              {formatItemPrice(item) ? <span>{formatItemPrice(item)}</span> : null}
                            </div>
                            <small>{item.summary}</small>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="catalog-empty">這個結果已經有風格判斷，但目前還沒掛上對應店家資料。</p>
              )}
            </div>

            <details className="breakdown-panel" open={index === 0}>
              <summary>為什麼是這一碗</summary>
              <ul className="breakdown-list">
                {result.breakdown.map((item) => (
                  <li key={item.questionId} className={`tier-${item.tier}`}>
                    <span className="breakdown-question">{item.questionLabel}</span>
                    <span className="breakdown-answer">{item.answerLabel}</span>
                    <span className="breakdown-note">{item.note} +{item.points}</span>
                  </li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </div>
    </section>
  )
}