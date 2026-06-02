import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'

import App from './App'

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

    expect(screen.getByRole('heading', { name: 'Q8. 有過敏或一定不吃的嗎？' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /魚 \/ 魚介/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /貝類/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /蝦蟹/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^無/ }))
    await user.click(screen.getByRole('button', { name: '看結果' }))

    expect(await screen.findByRole('heading', { name: '今天先吃 家系' })).toBeInTheDocument()
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

  test('prunes dry tare options after Taiwan mazesoba is selected', async () => {
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
    expect(screen.queryByRole('button', { name: /味噌/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /鹽味/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /原味/ })).not.toBeInTheDocument()
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
})
