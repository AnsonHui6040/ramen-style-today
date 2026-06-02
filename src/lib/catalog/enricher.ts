import { catalogDataset } from '../../config/catalog'
import type {
  CatalogRecommendation,
  MenuItemDefinition,
  StoreDefinition,
} from '../../domain/catalog'
import type { RankedStyle, ScoringOutcome } from '../../domain/types'

function getMatchWeight(item: MenuItemDefinition, result: RankedStyle) {
  let weight = 0

  if (item.styleId === result.style.id) {
    weight += 1
  }

  if (item.coreTypeIds?.includes(result.coreType.id)) {
    weight += 2
  }

  if (item.subtypeIds?.includes(result.subtype.id)) {
    weight += 3
  }

  return weight
}

function buildMatchReason(weight: number) {
  if (weight >= 6) {
    return '風格、核心型別與麵型都直接對上。'
  }

  if (weight >= 3) {
    return '風格與核心型別吻合，適合直接落到實際品項。'
  }

  return '至少對上前台風格，可以當作探索起點。'
}

function groupRecommendations(
  store: StoreDefinition,
  items: MenuItemDefinition[],
  strongestWeight: number,
): CatalogRecommendation {
  return {
    store,
    items,
    matchReason: buildMatchReason(strongestWeight),
  }
}

function recommendForResult(result: RankedStyle): CatalogRecommendation[] {
  const scoredItems = catalogDataset.items
    .map((item) => ({
      item,
      weight: getMatchWeight(item, result),
    }))
    .filter((entry) => entry.weight > 0)
    .sort((left, right) => right.weight - left.weight)

  const itemsByStore = new Map<
    string,
    { items: MenuItemDefinition[]; strongestWeight: number }
  >()

  for (const entry of scoredItems) {
    const existing = itemsByStore.get(entry.item.storeId) ?? {
      items: [],
      strongestWeight: 0,
    }

    if (existing.items.length >= 2) {
      continue
    }

    itemsByStore.set(entry.item.storeId, {
      items: [...existing.items, entry.item],
      strongestWeight: Math.max(existing.strongestWeight, entry.weight),
    })
  }

  return [...itemsByStore.entries()]
    .map(([storeId, payload]) => {
      const store = catalogDataset.stores.find((candidate) => candidate.id === storeId)

      return store
        ? groupRecommendations(store, payload.items, payload.strongestWeight)
        : null
    })
    .filter((recommendation): recommendation is CatalogRecommendation => Boolean(recommendation))
    .slice(0, 2)
}

function enrichResult(result: RankedStyle): RankedStyle {
  return {
    ...result,
    catalogRecommendations: recommendForResult(result),
  }
}

export function enrichScoringOutcome(outcome: ScoringOutcome): ScoringOutcome {
  return {
    ...outcome,
    results: outcome.results.map(enrichResult),
    alternativeResults: outcome.alternativeResults.map(enrichResult),
    blockedLead: outcome.blockedLead ? enrichResult(outcome.blockedLead) : null,
  }
}
