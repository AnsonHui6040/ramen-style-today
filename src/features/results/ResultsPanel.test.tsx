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
        onRestart={vi.fn()}
        onReviewAnswers={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: '今天先吃 家系' })).toBeInTheDocument()
    expect(screen.getByText('横浜家系ラーメン大和家')).toBeInTheDocument()
    expect(screen.getByText('631ラーメン 醤油')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '官方頁面' })[0]).toHaveAttribute(
      'href',
      'https://iekei-yamatoya.com/menu',
    )
  })

  test('renders the blocked-lead notice when exclusions remove a stronger match', () => {
    const outcome = enrichScoringOutcome(scoreQuestionnaire(conflictFixtures.porkBlockedIekei))

    render(
      <ResultsPanel
        outcome={outcome}
        onRestart={vi.fn()}
        onReviewAnswers={vi.fn()}
      />,
    )

    expect(screen.getByText('有高分風格被硬過濾擋掉')).toBeInTheDocument()
    expect(screen.getByText(/家系 原本分數也很高/)).toBeInTheDocument()
    expect(screen.getByText(/排除了 豬/)).toBeInTheDocument()
  })
})