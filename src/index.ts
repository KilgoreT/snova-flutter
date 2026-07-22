import {
  Supernova,
  PulsarContext,
  RemoteVersionIdentifier,
  AnyOutputFile,
  TokenType,
  Token,
  ColorToken,
} from "@supernovaio/sdk-exporters"
import { FileHelper } from "@supernovaio/export-helpers"
import { ExporterConfiguration } from "../config"
import { findCollection, RawColorToken, RawGroup, themeOverridesCollectionColors } from "./adapters"
import { buildColorFile, ThemeColorTokens } from "./pipeline"

/** SDK-токены → минимальные RawColorToken ядра (только цвет). */
function toRawColorTokens(tokens: Array<Token>): Array<RawColorToken> {
  return tokens
    .filter((t) => t.tokenType === TokenType.color)
    .map((t) => {
      const ct = t as ColorToken
      return {
        id: ct.id,
        name: ct.name,
        parentGroupId: ct.parentGroupId,
        collectionId: ct.collectionId,
        value: {
          color: { r: ct.value.color.r, g: ct.value.color.g, b: ct.value.color.b },
          opacity: { measure: ct.value.opacity.measure },
        },
      }
    })
}

/**
 * Точка входа экспортёра. Тонкая склейка: достаёт данные из sdk, применяет темы,
 * маппит в Raw-типы и передаёт в чистый конвейер buildColorFile.
 */
Pulsar.export(async (sdk: Supernova, context: PulsarContext): Promise<Array<AnyOutputFile>> => {
  const from: RemoteVersionIdentifier = {
    designSystemId: context.dsId,
    versionId: context.versionId,
  }

  const collections = await sdk.tokens.getTokenCollections(from)
  let allTokens = await sdk.tokens.getTokens(from)
  let groups = await sdk.tokens.getTokenGroups(from, { type: TokenType.color })

  // Фильтр по бренду, если задан платформой.
  if (context.brandId) {
    const brands = await sdk.brands.getBrands(from)
    const brand = brands.find((b) => b.id === context.brandId || b.idInVersion === context.brandId)
    if (!brand) {
      throw new Error(`Unable to find brand ${context.brandId}.`)
    }
    allTokens = allTokens.filter((t) => t.brandId === brand.id)
    groups = groups.filter((g) => g.brandId === brand.id)
  }

  const rawGroups: Array<RawGroup> = groups.map((g) => ({
    id: g.id,
    name: g.name,
    parentGroupId: g.parentGroupId,
    isRoot: g.isRoot,
  }))

  // Темы: выбранные платформой, иначе все.
  let themes = await sdk.tokens.getTokenThemes(from)
  if (context.themeIds && context.themeIds.length > 0) {
    const wanted = context.themeIds
    themes = themes.filter((th) => wanted.includes(th.id) || wanted.includes(th.idInVersion))
  }

  // Отсекаем темы, не переопределяющие цвета целевой коллекции (напр. Desktop/Mobile для размеров).
  const collection = findCollection(collections, exportConfiguration.collectionName)

  // Диагностика формы overriddenTokens (видно в логе экспорта).
  for (const th of themes) {
    const colorOverrides = th.overriddenTokens.filter((t) => t.tokenType === TokenType.color).length
    const sampleCollectionId = th.overriddenTokens[0]?.collectionId ?? "n/a"
    console.log(
      `[snova-flutter] theme "${th.name}": ${th.overriddenTokens.length} overrides, ${colorOverrides} color; sample collectionId=${sampleCollectionId} (target ${collection.id} / ${collection.persistentId})`,
    )
  }

  const relevantThemes = themes.filter((th) =>
    themeOverridesCollectionColors(th.overriddenTokens, collection, TokenType.color),
  )

  // Страховка: фильтр НИКОГДА не должен обнулять вывод. Если отсёк всё — экспортируем все темы.
  const themesToExport = relevantThemes.length > 0 ? relevantThemes : themes
  if (relevantThemes.length === 0 && themes.length > 0) {
    console.log(
      `[snova-flutter] Color-override filter matched 0 of ${themes.length} themes — falling back to ALL themes so colors are not lost.`,
    )
  } else {
    const skipped = themes.filter((th) => !themesToExport.includes(th))
    if (skipped.length > 0) {
      console.log(`[snova-flutter] Skipping ${skipped.length} theme(s) with no color overrides: ${skipped.map((t) => t.name).join(", ")}`)
    }
  }

  const themeColorTokens: Array<ThemeColorTokens> = themesToExport.map((theme) => {
    const themed = sdk.tokens.computeTokensByApplyingThemes(allTokens, allTokens, [theme])
    return { name: theme.name, tokens: toRawColorTokens(themed) }
  })

  const file = buildColorFile(exportConfiguration.collectionName, collections, rawGroups, themeColorTokens, {
    generateDisclaimer: exportConfiguration.generateDisclaimer,
    basePath: exportConfiguration.basePath,
    colorPath: exportConfiguration.colorPath,
    colorFileName: exportConfiguration.colorFileName,
  })

  // ВРЕМЕННАЯ диагностика: пишем прямо в шапку файла, т.к. console.log в лог Supernova не попадает.
  const debugLines = themes.map((th) => {
    const colorOverrides = th.overriddenTokens.filter((t) => t.tokenType === TokenType.color).length
    const sample = th.overriddenTokens[0]
    return `//   ${th.name}: ${th.overriddenTokens.length} overrides, ${colorOverrides} color, sampleType=${sample?.tokenType ?? "n/a"}, sampleCollectionId=${sample?.collectionId ?? "n/a"}`
  })
  const debugBlock = [
    `// [snova-debug] target collection id=${collection.id} persistentId=${collection.persistentId}`,
    `// [snova-debug] themes fetched=${themes.length}, exported=${themesToExport.length}`,
    ...debugLines,
    "",
    "",
  ].join("\n")

  return [
    FileHelper.createTextFile({
      relativePath: file.relativePath,
      fileName: file.fileName,
      content: debugBlock + file.content,
    }),
  ]
})

/** Резолвнутая конфигурация экспортёра (дефолты из config.json + оверрайды пользователя). */
export const exportConfiguration = Pulsar.exportConfig<ExporterConfiguration>()
