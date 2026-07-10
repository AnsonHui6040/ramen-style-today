import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'

import App from './App'

const storageKey = 'ramen-style-today.state.v1'

function installStorage() {
  const values = new Map<string, string>()
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  }

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  })

  return storage
}

function installUnavailableStorage() {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      clear: () => undefined,
      getItem: () => null,
      key: () => null,
      length: 0,
      removeItem: () => {
        throw new Error('Storage unavailable')
      },
      setItem: () => {
        throw new Error('Storage unavailable')
      },
    },
  })
}

describe('App questionnaire flow', () => {
  test('walks a user from the intro screen to an Iekei result with real catalog data', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '開始問卷' }))

    await user.click(screen.getByRole('button', { name: /湯拉麵/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))

    expect(screen.getByRole('heading', { name: 'Q2. 這碗最接近哪種輪廓？' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /清湯/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /油そば/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /白湯/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))

    await user.click(screen.getByRole('button', { name: /醬油/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))

    await user.click(screen.getByRole('button', { name: /^豬/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))

    await user.click(screen.getByRole('button', { name: /背脂重口/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))

    await user.click(screen.getByRole('button', { name: /中粗直/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))

    await user.click(screen.getByRole('button', { name: /海苔 \+ 菠菜/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))

    expect(screen.getByRole('heading', { name: 'Q8. 有沒有過敏或嚴格不吃的食材？' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /魚 \/ 魚介/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /貝類/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /蝦蟹/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^無/ }))
    await user.click(screen.getByRole('button', { name: '看結果' }))

    const resultHeading = await screen.findByRole('heading', { name: '今天先吃 家系' })
    expect(resultHeading).toHaveFocus()
    expect(screen.getByText('横浜家系ラーメン大和家')).toBeInTheDocument()
    expect(screen.getByText('631ラーメン 醤油')).toBeInTheDocument()
  })

  test('uses dipping-sauce copy after the user chooses tsukemen', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '開始問卷' }))

    await user.click(screen.getByRole('button', { name: /沾麵/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))

    expect(screen.getByRole('heading', { name: 'Q2. 這碗最接近哪種輪廓？' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /清爽昆布水/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^清湯/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /清爽昆布水/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))

    expect(screen.getByRole('heading', { name: 'Q3. 沾汁調味想偏哪邊？' })).toBeInTheDocument()
    expect(screen.getByText('這題用來區分醬油、鹽味、味噌、辣麻或不強調調味的沾汁。')).toBeInTheDocument()
  })

  test('lets users change a single-choice answer before continuing', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '開始問卷' }))

    const soup = screen.getByRole('button', { name: /湯拉麵/ })
    const tsukemen = screen.getByRole('button', { name: /沾麵/ })

    await user.click(tsukemen)
    expect(tsukemen).toHaveAttribute('aria-pressed', 'true')
    expect(soup).toBeEnabled()

    await user.click(soup)
    expect(soup).toHaveAttribute('aria-pressed', 'true')
    expect(tsukemen).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: '下一題' }))

    expect(screen.getByRole('button', { name: /^清湯/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /清爽昆布水/ })).not.toBeInTheDocument()
  })

  test('switches questionnaire copy between English and Japanese', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: 'EN' }))

    expect(screen.getByRole('heading', { name: 'What bowl fits today?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(screen.getByRole('button', { name: /Tsukemen/ }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: /Light kombu-water/ }))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByRole('heading', { name: 'Q3. Which dipping-sauce seasoning do you want?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '日本語' }))

    expect(screen.getByRole('heading', { name: 'Q3. つけ汁の味付けはどちら寄りですか？' })).toBeInTheDocument()
  })

  test('uses dry-sauce copy after the user chooses a dry style', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '開始問卷' }))

    await user.click(screen.getByRole('button', { name: /乾拌麵 \/ 油拌麵/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))
    await user.click(screen.getByRole('button', { name: /台灣拌麵（台灣まぜそば）/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))

    expect(screen.getByRole('heading', { name: 'Q3. 拌醬調味想偏哪邊？' })).toBeInTheDocument()
    expect(screen.getByText('這題用來區分醬油、鹽味、味噌、辣麻或不強調調味的乾拌醬感。')).toBeInTheDocument()
  })

  test('keeps the plain-tare option reachable for Taiwan mazesoba confidence handling', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '開始問卷' }))

    await user.click(screen.getByRole('button', { name: /乾拌麵 \/ 油拌麵/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))
    await user.click(screen.getByRole('button', { name: /台灣拌麵（台灣まぜそば）/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))

    expect(screen.getByRole('heading', { name: 'Q3. 拌醬調味想偏哪邊？' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /辣味 \/ 芝麻/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /醬油/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /原味/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /味噌/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /鹽味/ })).not.toBeInTheDocument()
  })

  test('auto-skips fixed tare after soupless tantanmen is selected', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '開始問卷' }))

    await user.click(screen.getByRole('button', { name: /乾拌麵 \/ 油拌麵/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))
    await user.click(screen.getByRole('button', { name: /無湯擔擔麵（汁なし担々）/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))

    expect(await screen.findByRole('heading', { name: 'Q4. 你想讓哪種香氣或主角最明顯？' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /醬油/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /味噌/ })).not.toBeInTheDocument()
  })

  test('auto-skips fixed tare after rich miso tsukemen is selected', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '開始問卷' }))

    await user.click(screen.getByRole('button', { name: /沾麵/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))
    await user.click(screen.getByRole('button', { name: /濃厚味噌/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))

    expect(await screen.findByRole('heading', { name: 'Q4. 你想讓沾汁或昆布水的哪種主角最明顯？' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Q3. 沾汁調味想偏哪邊？' })).not.toBeInTheDocument()
  })

  test('lets users replace exclusive multi-select answers with concrete choices', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '開始問卷' }))

    await user.click(screen.getByRole('button', { name: /湯拉麵/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))
    await user.click(screen.getByRole('button', { name: /白湯/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))
    await user.click(screen.getByRole('button', { name: /醬油/ }))
    await user.click(screen.getByRole('button', { name: '下一題' }))

    const unsure = screen.getByRole('button', { name: /不確定/ })
    await user.click(unsure)
    expect(unsure).toHaveAttribute('aria-pressed', 'true')

    const pork = screen.getByRole('button', { name: /^豬/ })
    await user.click(pork)

    expect(pork).toHaveAttribute('aria-pressed', 'true')
    expect(unsure).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: '下一題' }))

    expect(screen.getByRole('heading', { name: 'Q5. 你想要湯體多重口？' })).toBeInTheDocument()
  })

  test('recovers to a usable intro when a saved results snapshot is incomplete', () => {
    const storage = installStorage()
    storage.setItem(
      storageKey,
      JSON.stringify({
        phase: 'results',
        stepIndex: 7,
        locale: 'zh-TW',
        answers: {
          form: 'soup',
          archetype: 'paitan',
          tare: 'shoyu',
          source: [],
          body: 'rich',
          noodle: 'medium-thick-straight',
          signature: [],
          exclusions: ['none'],
        },
      }),
    )

    render(<App />)

    expect(screen.getByRole('heading', { name: '不用想太多，照著今天的胃口選就好。' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '繼續作答' })).toBeInTheDocument()
  })

  test('does not render a saved result that bypasses a conditional question branch', () => {
    const storage = installStorage()
    storage.setItem(
      storageKey,
      JSON.stringify({
        phase: 'results',
        stepIndex: 7,
        locale: 'zh-TW',
        answers: {
          form: 'tsukemen',
          archetype: 'miso-rich',
          tare: 'shoyu',
          source: ['pork'],
          body: 'rich',
          noodle: 'extra-thick',
          signature: ['corn-butter'],
          exclusions: ['none'],
        },
      }),
    )

    render(<App />)

    expect(screen.getByRole('heading', { name: '不用想太多，照著今天的胃口選就好。' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /今天先吃/ })).not.toBeInTheDocument()
  })

  test('normalizes a fractional saved question index instead of rendering an empty shell', () => {
    const storage = installStorage()
    storage.setItem(
      storageKey,
      JSON.stringify({
        phase: 'questions',
        stepIndex: 1.5,
        locale: 'zh-TW',
        answers: {
          form: 'soup',
          source: [],
          signature: [],
          exclusions: ['none'],
        },
      }),
    )

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Q1. 你今天想吃哪一種？' })).toBeInTheDocument()
  })

  test('updates the document language, title, and focus after a locale or step change', async () => {
    const user = userEvent.setup()

    render(<App />)

    expect(document.documentElement.lang).toBe('zh-Hant-TW')
    expect(document.title).toContain('今天想吃哪一碗？')

    await user.click(screen.getByRole('button', { name: 'EN' }))

    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toContain('What bowl fits today?')

    await user.click(screen.getByRole('button', { name: 'Start' }))

    const questionHeading = screen.getByRole('heading', { name: 'Q1. What do you want today?' })
    await waitFor(() => expect(questionHeading).toHaveFocus())
  })

  test('provides a keyboard skip link to the questionnaire content', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: '前往主要內容' })).toHaveAttribute(
      'href',
      '#main-content',
    )
  })

  test('associates each answer choice with its live selection guidance', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: '開始問卷' }))

    const choiceGroup = screen.getByRole('group', { name: 'Q1. 你今天想吃哪一種？' })
    const selectionStatus = document.getElementById('selection-meta-form')
    const soupChoice = screen.getByRole('button', { name: /湯拉麵/ })

    expect(selectionStatus).toHaveAttribute('role', 'status')
    expect(choiceGroup).toHaveAttribute('aria-describedby', 'selection-meta-form')
    expect(soupChoice).toHaveAttribute('aria-describedby', 'selection-meta-form')
  })

  test('keeps the questionnaire usable when local storage writes fail', async () => {
    const user = userEvent.setup()
    installUnavailableStorage()

    render(<App />)

    expect(await screen.findByRole('status')).toHaveTextContent(
      '無法儲存本機作答；你仍可繼續，但重新整理後不會保留進度。',
    )

    await user.click(screen.getByRole('button', { name: '開始問卷' }))

    expect(screen.getByRole('heading', { name: 'Q1. 你今天想吃哪一種？' })).toBeInTheDocument()
  })
})
