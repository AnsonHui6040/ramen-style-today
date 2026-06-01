export type CatalogCurrency = 'JPY' | 'TWD'

export interface StoreDefinition {
  id: string
  name: string
  location: string
  summary: string
  styleIds: readonly string[]
  sourceUrl?: string
}

export interface MenuItemDefinition {
  id: string
  storeId: string
  name: string
  summary: string
  price?: number
  currency?: CatalogCurrency
  styleId: string
  coreTypeIds?: readonly string[]
  subtypeIds?: readonly string[]
}

export interface CatalogRecommendation {
  store: StoreDefinition
  items: readonly MenuItemDefinition[]
  matchReason: string
}

export interface CatalogDataset {
  stores: readonly StoreDefinition[]
  items: readonly MenuItemDefinition[]
}