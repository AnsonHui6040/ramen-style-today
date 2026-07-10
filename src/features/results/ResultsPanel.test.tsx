import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { conflictFixtures, canonicalFixtures } from '../../__tests__/lib/scoring/fixtures'
import { enrichScoringOutcome } from '../../lib/catalog/enricher'
import { scoreQuestionnaire } from '../../lib/scoring/scorer'
import { ResultsPanel } from './ResultsPanel'

describe('ResultsPanel', () => {
  test('renders real catalog recommendations and source links for the lead result', () => {
    const outcome = enrichScoringOutcome(scoreQuestionnaire(canonicalFixtures.iekei))

    render(
      <ResultsPanel
        outcome={outcome}
        locale="zh-TW"
        onRestart={vi.fn()}
        onReviewAnswers={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: '今天先吃 家系' })).toBeInTheDocument()
    expect(screen.getByText('横浜家系ラーメン大和家')).toBeInTheDocument()
    expect(screen.getByText('631ラーメン 醤油')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '官方頁面（在新分頁開啟）' })[0]).toHaveAttribute(
      'href',
      'https://iekei-yamatoya.com/menu',
    )
    expect(screen.getAllByText('為什麼會推這碗？')[0]).toBeInTheDocument()
    expect(screen.getAllByText(/你剛剛選了/)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/資料分 \+/)[0]).toBeInTheDocument()
  })

  test('renders the blocked-lead notice when exclusions remove a stronger match', () => {
    const outcome = enrichScoringOutcome(scoreQuestionnaire(conflictFixtures.porkBlockedIekei))

    render(
      <ResultsPanel
        outcome={outcome}
        locale="zh-TW"
        onRestart={vi.fn()}
        onReviewAnswers={vi.fn()}
      />,
    )

    expect(screen.getByText('有一碗本來很合，但被避開了')).toBeInTheDocument()
    expect(screen.getByText(/家系 原本也很接近/)).toBeInTheDocument()
    expect(screen.getByText(/標記了 豬/)).toBeInTheDocument()
  })

  test('keeps safe format-changing alternatives visible when all primary results are filtered out', () => {
    const outcome = enrichScoringOutcome(scoreQuestionnaire(conflictFixtures.fishBlockedKonbusui))

    expect(outcome.results).toHaveLength(0)
    expect(outcome.alternativeResults.length).toBeGreaterThan(0)

    render(
      <ResultsPanel
        outcome={outcome}
        locale="zh-TW"
        onRestart={vi.fn()}
        onReviewAnswers={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: '沒有可顯示的結果' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '相近替代' })).toBeInTheDocument()
  })
})
