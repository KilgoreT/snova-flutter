import { emitThemes, ValueRenderer } from "./emit"
import { ThemeTree } from "../generate"

const renderColor: ValueRenderer<string> = (v) => ({ type: "Color", expr: `Color(${v})` })

const group = (id: string, name: string, groups: any[] = [], tokens: any[] = []) => ({ id, name, groups, tokens })
const token = (id: string, name: string, value: string) => ({ id, name, value })

const bgTree = (primary: string): ThemeTree<string>["tree"] => ({
  roots: [group("g1", "bg", [], [token("t1", "primary", primary)])],
})

describe("emitThemes", () => {
  it("строит AppColors: шорткаты дефолтной темы + инстансы всех тем, и приватные классы тем", () => {
    const themes: Array<ThemeTree<string>> = [
      { themeName: "Light", tree: bgTree("0x1") },
      { themeName: "Dark", tree: bgTree("0x2") },
    ]
    const expected = [
      "class AppColors {",
      "  const AppColors._();",
      "",
      "  static const bg = _LightBg._();",
      "  static const dark = _Dark._();",
      "  static const light = _Light._();",
      "}",
      "",
      "class _Dark {",
      "  const _Dark._();",
      "",
      "  final _DarkBg bg = const _DarkBg._();",
      "}",
      "",
      "class _DarkBg {",
      "  const _DarkBg._();",
      "",
      "  final Color primary = const Color(0x2);",
      "}",
      "",
      "class _Light {",
      "  const _Light._();",
      "",
      "  final _LightBg bg = const _LightBg._();",
      "}",
      "",
      "class _LightBg {",
      "  const _LightBg._();",
      "",
      "  final Color primary = const Color(0x1);",
      "}",
    ].join("\n")
    expect(emitThemes("AppColors", themes, "Light", renderColor)).toBe(expected)
  })

  it("шорткат без темы указывает на классы дефолтной темы (Light), dark/sepia — только через тему", () => {
    const themes: Array<ThemeTree<string>> = [
      { themeName: "Light", tree: bgTree("0x1") },
      { themeName: "Dark", tree: bgTree("0x2") },
      { themeName: "Sepia", tree: bgTree("0x3") },
    ]
    const out = emitThemes("AppColors", themes, "Light", renderColor)
    expect(out).toContain("static const bg = _LightBg._();") // AppColors.bg → Light
    expect(out).toContain("static const light = _Light._();")
    expect(out).toContain("static const dark = _Dark._();")
    expect(out).toContain("static const sepia = _Sepia._();")
    // нет статик-шортката dark/sepia групп на корне (только через тему)
    expect(out).not.toContain("static const bg = _DarkBg._();")
    expect(out).not.toContain("static const bg = _SepiaBg._();")
  })

  it("уважает кастомное имя корня и другую дефолтную тему", () => {
    const themes: Array<ThemeTree<string>> = [
      { themeName: "Light", tree: bgTree("0x1") },
      { themeName: "Dark", tree: bgTree("0x2") },
    ]
    const out = emitThemes("Palette", themes, "Dark", renderColor)
    expect(out).toContain("class Palette {")
    expect(out).toContain("static const bg = _DarkBg._();") // дефолт теперь Dark
  })

  it("если дефолтной темы нет среди экспортируемых — берёт первую по алфавиту", () => {
    const themes: Array<ThemeTree<string>> = [
      { themeName: "Light", tree: bgTree("0x1") },
      { themeName: "Dark", tree: bgTree("0x2") },
    ]
    const out = emitThemes("AppColors", themes, "Nonexistent", renderColor)
    expect(out).toContain("static const bg = _DarkBg._();") // Dark — первая по алфавиту
  })
})
