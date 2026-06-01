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

    await user.click(screen.getByRole('button', { name: /^無/ }))
    await user.click(screen.getByRole('button', { name: '看結果' }))

    expect(await screen.findByRole('heading', { name: '今天先吃 家系' })).toBeInTheDocument()
    expect(screen.getByText('横浜家系ラーメン大和家')).toBeInTheDocument()
    expect(screen.getByText('631ラーメン 醤油')).toBeInTheDocument()
  })
})