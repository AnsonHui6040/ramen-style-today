import catalogDatasetData from '../data/catalog.json'
import type { CatalogDataset } from '../domain/catalog'
import { assertCatalogDataset } from '../domain/schema'
import { styleCatalog } from './styles'

export const catalogDataset = catalogDatasetData as CatalogDataset

assertCatalogDataset(catalogDataset, styleCatalog)
