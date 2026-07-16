import { generateColors, ThemeTree, GenerateColorsConfig } from "./generate"
import { DartColorInput } from "./dart/color"
import { Tree } from "./tree/tree"

const white: DartColorInput = { color: { r: 255, g: 255, b: 255 }, opacity: { measure: 1 } }
const black: DartColorInput = { color: { r: 0, g: 0, b: 0 }, opacity: { measure: 1 } }

const bgTree = (value: DartColorInput): Tree<DartColorInput> => ({
  roots: [{ id: "g1", name: "bg", groups: [], tokens: [{ id: "t1", name: "primary", value }] }],
})

const config: GenerateColorsConfig = {
  generateDisclaimer: false,
  basePath: "./kw",
  colorPath: "/colors",
  colorFileName: "app_colors",
}

describe("generateColors", () => {
  it("собирает файл: импорт + классы темы, путь и имя из конфига", () => {
    const themes: Array<ThemeTree<DartColorInput>> = [{ themeName: "Dark", tree: bgTree(white) }]
    const file = generateColors(themes, config)

    expect(file.relativePath).toBe("./kw/colors")
    expect(file.fileName).toBe("app_colors.dart")
    expect(file.content).toBe(
      [
        "import 'package:flutter/material.dart';",
        "",
        "class Dark {",
        "  const Dark._();",
        "",
        "  static const bg = _DarkBg._();",
        "}",
        "",
        "class _DarkBg {",
        "  const _DarkBg._();",
        "",
        "  final Color primary = const Color(0xFFFFFFFF);",
        "}",
        "",
      ].join("\n"),
    )
  })

  it("добавляет дисклеймер, когда включён", () => {
    const themes: Array<ThemeTree<DartColorInput>> = [{ themeName: "Dark", tree: bgTree(white) }]
    const file = generateColors(themes, { ...config, generateDisclaimer: true })
    expect(file.content.startsWith("//")).toBe(true)
    expect(file.content).toContain("import 'package:flutter/material.dart';")
  })

  it("сортирует темы по имени (детерминизм)", () => {
    const themes: Array<ThemeTree<DartColorInput>> = [
      { themeName: "Light", tree: bgTree(white) },
      { themeName: "Dark", tree: bgTree(black) },
    ]
    const out = generateColors(themes, config).content
    expect(out.indexOf("class Dark")).toBeLessThan(out.indexOf("class Light"))
  })

  it("несколько тем не конфликтуют по именам вложенных классов", () => {
    const themes: Array<ThemeTree<DartColorInput>> = [
      { themeName: "Dark", tree: bgTree(black) },
      { themeName: "Light", tree: bgTree(white) },
    ]
    const out = generateColors(themes, config).content
    expect(out).toContain("class _DarkBg {")
    expect(out).toContain("class _LightBg {")
  })
})
