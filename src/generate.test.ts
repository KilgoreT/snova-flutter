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
  rootClassName: "AppColors",
  defaultThemeName: "Light",
}

describe("generateColors", () => {
  it("собирает файл: импорт + AppColors + классы тем, путь и имя из конфига", () => {
    const themes: Array<ThemeTree<DartColorInput>> = [
      { themeName: "Light", tree: bgTree(white) },
      { themeName: "Dark", tree: bgTree(black) },
    ]
    const file = generateColors(themes, config)

    expect(file.relativePath).toBe("./kw/colors")
    expect(file.fileName).toBe("app_colors.dart")
    expect(file.content.startsWith("import 'package:flutter/material.dart';")).toBe(true)
    expect(file.content).toContain("class AppColors {")
    expect(file.content).toContain("static const bg = _LightBg._();") // дефолт Light
    expect(file.content).toContain("static const dark = _Dark._();")
    expect(file.content).toContain("static const light = _Light._();")
    expect(file.content).toContain("final Color primary = const Color(0xFFFFFFFF);") // light bg.primary
    expect(file.content).toContain("final Color primary = const Color(0xFF000000);") // dark bg.primary
  })

  it("добавляет дисклеймер, когда включён", () => {
    const themes: Array<ThemeTree<DartColorInput>> = [{ themeName: "Light", tree: bgTree(white) }]
    const file = generateColors(themes, { ...config, generateDisclaimer: true })
    expect(file.content.startsWith("//")).toBe(true)
    expect(file.content).toContain("import 'package:flutter/material.dart';")
  })

  it("темы не конфликтуют по именам вложенных классов", () => {
    const themes: Array<ThemeTree<DartColorInput>> = [
      { themeName: "Dark", tree: bgTree(black) },
      { themeName: "Light", tree: bgTree(white) },
    ]
    const out = generateColors(themes, config).content
    expect(out).toContain("class _DarkBg {")
    expect(out).toContain("class _LightBg {")
  })
})
