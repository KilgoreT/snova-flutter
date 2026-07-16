/**
 * Чистые адаптеры между данными Supernova SDK и внутренним ядром.
 * Вынесены отдельно (а не в index.ts) ради тестируемости — index.ts остаётся тонкой склейкой.
 */

import { DartColorInput } from "./dart/color"
import { FlatGroup, FlatToken } from "./tree/tree"

export interface RawGroup {
  id: string
  name: string
  parentGroupId: string | null
  isRoot: boolean
}

/**
 * Схлопывает виртуальные корневые группы (`isRoot`): их дети переподвешиваются на верхний
 * уровень (parentGroupId = null), а сами корни выбрасываются — иначе в выводе появляется
 * лишний класс-обёртка.
 */
export function flattenGroups(groups: Array<RawGroup>): Array<FlatGroup> {
  const rootIds = new Set(groups.filter((g) => g.isRoot).map((g) => g.id))
  return groups
    .filter((g) => !g.isRoot)
    .map((g) => ({
      id: g.id,
      name: g.name,
      parentGroupId: g.parentGroupId !== null && !rootIds.has(g.parentGroupId) ? g.parentGroupId : null,
    }))
}

export interface RawCollection {
  id: string
  persistentId: string
  name: string
}

/** Находит коллекцию по имени; при отсутствии — ошибка со списком доступных (диагностика). */
export function findCollection(collections: Array<RawCollection>, name: string): RawCollection {
  const found = collections.find((c) => c.name === name)
  if (!found) {
    throw new Error(`Collection ${JSON.stringify(name)} not found. Available: ${collections.map((c) => c.name).join(", ")}`)
  }
  return found
}

/** Оставляет токены, принадлежащие коллекции (сопоставление по id или persistentId — надёжнее). */
export function tokensInCollection<T extends { collectionId: string | null }>(
  tokens: Array<T>,
  collection: { id: string; persistentId: string },
): Array<T> {
  return tokens.filter((t) => t.collectionId === collection.id || t.collectionId === collection.persistentId)
}

export interface RawColorToken {
  id: string
  name: string
  parentGroupId: string
  collectionId: string | null
  value: { color: { r: number; g: number; b: number }; opacity: { measure: number } }
}

/** Маппит цветовые токены SDK в FlatToken ядра с извлечённым DartColorInput. */
export function toColorFlatTokens(tokens: Array<RawColorToken>): Array<FlatToken<DartColorInput>> {
  return tokens.map((t) => ({
    id: t.id,
    name: t.name,
    parentGroupId: t.parentGroupId,
    value: {
      color: { r: t.value.color.r, g: t.value.color.g, b: t.value.color.b },
      opacity: { measure: t.value.opacity.measure },
    },
  }))
}
