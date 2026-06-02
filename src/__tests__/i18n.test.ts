import { describe, expect, test } from 'vitest'

import { questionBank, resolveQuestionOptions } from '../config/questions'
import { catalogDataset } from '../config/catalog'
import { styleCatalog } from '../config/styles'
import { formValues } from '../domain/types'
import {
  dictionaries,
  localizeQuestion,
  localizeCatalogMatchReason,
  localizeMenuItem,
  localizeStore,
} from '../i18n'

describe('i18n dictionaries', () => {
  test.each(['en', 'ja'] as const)('%s covers all questions, options, and display styles', (locale) => {
    const dictionary = dictionaries[locale]

    for (const question of questionBank) {
      expect(dictionary.questions[question.id]?.title).toBeTruthy()
      expect(dictionary.questions[question.id]?.description).toBeTruthy()

      const options = question.branchOptions
        ? formValues.flatMap((form) => resolveQuestionOptions(question, form))
        : resolveQuestionOptions(question)

      for (const option of options) {
        expect(dictionary.options[question.id]?.[option.value]?.label).toBeTruthy()
        expect(dictionary.options[question.id]?.[option.value]?.description).toBeTruthy()
      }
    }

    for (const style of styleCatalog) {
      expect(dictionary.styles[style.id]?.label).toBeTruthy()
      expect(dictionary.styles[style.id]?.summary).toBeTruthy()
    }

    for (const store of catalogDataset.stores) {
      const localized = localizeStore(store, locale)
      expect(localized.name).toBeTruthy()
      expect(localized.location).toBeTruthy()
      expect(localized.summary).toBeTruthy()
    }

    for (const item of catalogDataset.items) {
      const localized = localizeMenuItem(item, locale)
      expect(localized.name).toBeTruthy()
      expect(localized.summary).toBeTruthy()
    }

    expect(localizeCatalogMatchReason('至少對上前台風格，可以當作探索起點。', locale))
      .not.toBe('至少對上前台風格，可以當作探索起點。')
  })

  test.each(['tare', 'source', 'body', 'noodle'] as const)('%s has form-aware copy for soup, tsukemen, and dry', (questionId) => {
    const question = questionBank.find((candidate) => candidate.id === questionId)

    expect(question).toBeDefined()

    if (!question) {
      return
    }

    for (const locale of ['zh-TW', 'en', 'ja'] as const) {
      const copies = formValues.map((form) => localizeQuestion(question, locale, form).title)

      expect(new Set(copies).size).toBe(formValues.length)
    }
  })
})
