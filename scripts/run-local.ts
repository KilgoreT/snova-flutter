/**
 * Локальный прогон экспортёра БЕЗ платформы и API.
 *
 * Подаёт фикстуры (структура семантических цветов + темы Dark/Light/Sepia) в чистый
 * конвейер `buildColorFile`, пишет настоящий Dart в `output/`, затем валидирует его
 * через `dart analyze` (импорт flutter подменяется на stub `Color`, чтобы анализатор
 * работал без Flutter-окружения).
 *
 * Запуск: `npm run gen`
 */
import { execFileSync } from "node:child_process"
import * as fs from "node:fs"
import * as path from "node:path"
import { buildColorFile, ThemeColorTokens } from "../src/pipeline"
import { RawCollection, RawColorToken, RawGroup } from "../src/adapters"

const collections: RawCollection[] = [{ id: "c1", persistentId: "p1", name: "Semantic Color" }]

// Виртуальный корень + иерархия групп семантических цветов.
const groups: RawGroup[] = [
  { id: "r", name: "Color", parentGroupId: null, isRoot: true },
  { id: "bg", name: "bg", parentGroupId: "r", isRoot: false },
  { id: "brand", name: "brand", parentGroupId: "bg", isRoot: false },
  { id: "neutral", name: "neutral", parentGroupId: "bg", isRoot: false },
  { id: "text", name: "text", parentGroupId: "r", isRoot: false },
  { id: "border", name: "border", parentGroupId: "r", isRoot: false },
]

type RGB = { r: number; g: number; b: number }
const tok = (id: string, name: string, parentGroupId: string, c: RGB, measure = 1): RawColorToken => ({
  id,
  name,
  parentGroupId,
  collectionId: "c1",
  value: { color: c, opacity: { measure } },
})

// Разные значения на тему — так виден смысл тем в выводе.
function themeTokens(prefix: string, shift: number): RawColorToken[] {
  return [
    tok(`${prefix}-1`, "default", "brand", { r: 33 + shift, g: 38, b: 10 }),
    tok(`${prefix}-2`, "subtle", "neutral", { r: 50, g: 57 + shift, b: 14 }),
    tok(`${prefix}-3`, "primary", "text", { r: 255 - shift, g: 255, b: 255 }),
    tok(`${prefix}-4`, "error", "border", { r: 200, g: 30, b: 30 + shift }, 0.9),
  ]
}

const themes: ThemeColorTokens[] = [
  { name: "Dark", tokens: themeTokens("d", 0) },
  { name: "Light", tokens: themeTokens("l", 20) },
  { name: "Sepia", tokens: themeTokens("s", 40) },
]

const file = buildColorFile("Semantic Color", collections, groups, themes, {
  generateDisclaimer: true,
  basePath: "./kw",
  colorPath: "/colors",
  colorFileName: "app_colors",
})

// --- Запись в output/ ---
const outRoot = path.resolve(__dirname, "..", "output")
const relDir = file.relativePath.replace(/^\.\//, "")
const outDir = path.join(outRoot, relDir)
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, file.fileName)
fs.writeFileSync(outPath, file.content, "utf8")

console.log(`\n=== Сгенерирован ${path.relative(process.cwd(), outPath)} ===\n`)
console.log(file.content)

// --- Валидация через dart analyze (stub Color вместо flutter) ---
const analyzeDir = path.join(outRoot, ".analyze")
fs.mkdirSync(path.join(analyzeDir, "lib"), { recursive: true })
fs.writeFileSync(
  path.join(analyzeDir, "pubspec.yaml"),
  "name: snova_analyze\nenvironment:\n  sdk: '>=3.0.0 <4.0.0'\n",
  "utf8",
)
const stub = "class Color {\n  final int value;\n  const Color(this.value);\n}\n\n"
const analyzable = stub + file.content.replace("import 'package:flutter/material.dart';\n", "")
fs.writeFileSync(path.join(analyzeDir, "lib", "app_colors.dart"), analyzable, "utf8")

console.log("=== dart analyze ===")
try {
  const out = execFileSync("dart", ["analyze"], { cwd: analyzeDir, encoding: "utf8" })
  console.log(out.trim() || "No issues found!")
} catch (e: any) {
  console.error(e.stdout?.toString() ?? "")
  console.error(e.stderr?.toString() ?? "")
  process.exitCode = 1
}
