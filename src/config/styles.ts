import styleCatalogData from '../data/styles.json'
import { assertStyleCatalog } from '../domain/schema'
import type { StyleDefinition } from '../domain/types'

export const styleCatalog = styleCatalogData as readonly StyleDefinition[]

assertStyleCatalog(styleCatalog)