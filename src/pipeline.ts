/**
 * Чистый сквозной конвейер генерации цветового файла — без зависимостей от Pulsar/SDK,
 * поэтому тестируется целиком. index.ts лишь достаёт данные из sdk и зовёт эту функцию.
 */

import {
  findCollection,
  flattenGroups,
  RawColorToken,
  RawCollection,
  RawGroup,
  toColorFlatTokens,
  tokensInCollection,
} from "./adapters"
import { buildTree } from "./tree/tree"
import { pruneEmpty } from "./tree/prune"
import { generateColors, GenerateColorsConfig, OutputFile, ThemeTree } from "./generate"
import { DartColorInput } from "./dart/color"

/** Одна тема: имя (→ верхний класс) и все её цветовые токены (ещё не скоупленные по коллекции). */
export interface ThemeColorTokens {
  name: string
  tokens: Array<RawColorToken>
}

export function buildColorFile(
  collectionName: string,
  collections: Array<RawCollection>,
  groups: Array<RawGroup>,
  themes: Array<ThemeColorTokens>,
  config: GenerateColorsConfig,
): OutputFile {
  const collection = findCollection(collections, collectionName)
  const flatGroups = flattenGroups(groups)

  const themeTrees: Array<ThemeTree<DartColorInput>> = themes.map((theme) => {
    const scoped = tokensInCollection(theme.tokens, collection)
    const flatTokens = toColorFlatTokens(scoped)
    const tree = pruneEmpty(buildTree(flatGroups, flatTokens))
    return { themeName: theme.name, tree }
  })

  return generateColors(themeTrees, config)
}
