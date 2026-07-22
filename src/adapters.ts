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

export interface RawOverriddenToken {
  tokenType: string
  collectionId: string | null
}

/**
 * Тема релевантна экспорту цветов, только если она реально переопределяет хотя бы один
 * цветовой токен целевой коллекции. Отсекает темы ДС для других типов (напр. Desktop/Mobile
 * для размеров/типографики), которые иначе дали бы пустые дублирующие классы.
 */
export function themeOverridesCollectionColors(
  overriddenTokens: Array<RawOverriddenToken>,
  collection: { id: string; persistentId: string },
  colorType: string,
): boolean {
  return overriddenTokens.some((t) => {
    if (t.tokenType !== colorType) return false
    // Если у override не проставлена коллекция — не режем вслепую, считаем релевантным цветом.
    if (t.collectionId === null) return true
    return t.collectionId === collection.id || t.collectionId === collection.persistentId
  })
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
