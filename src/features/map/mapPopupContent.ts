import type { FinderShop } from '../../domain/ramenMap'

function getText(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function appendLine(container: HTMLElement, value: string) {
  const line = document.createElement('div')
  line.textContent = value
  container.append(line)
}

export function createShopPopupContent(shop: FinderShop) {
  const content = document.createElement('div')
  const title = document.createElement('strong')

  title.textContent = getText(shop.name)
  content.append(title)

  appendLine(content, [getText(shop.style4char), getText(shop.styleFamily)].filter(Boolean).join(' · '))
  appendLine(
    content,
    [getText(shop.district), getText(shop.areaTag)].filter(Boolean).join(' · '),
  )

  return content
}
