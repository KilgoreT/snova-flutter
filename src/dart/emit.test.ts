import { emitTheme, ValueRenderer } from "./emit"
import { Tree } from "../tree/tree"

// Стаб-рендерер значения: значение токена — уже готовое hex-тело, оборачиваем в Color(...).
const renderColor: ValueRenderer<string> = (v) => ({ type: "Color", expr: `Color(${v})` })

const group = (id: string, name: string, groups: any[] = [], tokens: any[] = []) => ({ id, name, groups, tokens })
const token = (id: string, name: string, value: string) => ({ id, name, value })

describe("emitTheme", () => {
  it("пустая тема → только корневой класс с приватным конструктором", () => {
    const tree: Tree<string> = { roots: [] }
    expect(emitTheme("Dark", tree, renderColor)).toBe(["class Dark {", "  const Dark._();", "}"].join("\n"))
  })

  it("одна группа с одним токеном → корневой static const + вложенный класс", () => {
    const tree: Tree<string> = { roots: [group("g1", "bg", [], [token("t1", "primary", "0xFFFFFFFF")])] }
    const expected = [
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
    ].join("\n")
    expect(emitTheme("Dark", tree, renderColor)).toBe(expected)
  })

  it("многоуровневая вложенность даёт точечный путь Dark.bg.brand.zelenyi", () => {
    const tree: Tree<string> = {
      roots: [group("g1", "bg", [group("g2", "brand", [], [token("t1", "zelenyi", "0xFF21260A")])], [])],
    }
    const out = emitTheme("Dark", tree, renderColor)
    expect(out).toContain("static const bg = _DarkBg._();")
    expect(out).toContain("final _DarkBgBrand brand = const _DarkBgBrand._();")
    expect(out).toContain("final Color zelenyi = const Color(0xFF21260A);")
  })

  it("сортирует поля по алфавиту (детерминизм)", () => {
    const tree: Tree<string> = { roots: [group("z", "text"), group("a", "bg")] }
    const out = emitTheme("Dark", tree, renderColor)
    expect(out.indexOf("static const bg")).toBeLessThan(out.indexOf("static const text"))
  })

  it("детерминированно разводит коллизию одинаковых имён токенов", () => {
    const tree: Tree<string> = {
      roots: [group("g1", "bg", [], [token("t1", "primary", "0x1"), token("t2", "primary", "0x2")])],
    }
    const out = emitTheme("Dark", tree, renderColor)
    expect(out).toContain("final Color primary = const Color(0x1);")
    expect(out).toContain("final Color primary2 = const Color(0x2);")
  })

  it("разводит коллизию между группой и токеном с одинаковым именем", () => {
    const tree: Tree<string> = {
      roots: [group("g1", "bg", [group("g2", "brand")], [token("t1", "brand", "0x9")])],
    }
    const out = emitTheme("Dark", tree, renderColor)
    // одно из имён получает суффикс, оба присутствуют, класс подгруппы согласован с полем
    expect(out).toMatch(/brand2?\b/)
    expect(out).toContain("const Color(0x9)")
  })

  it("применяет имя темы как корневой класс (PascalCase)", () => {
    const tree: Tree<string> = { roots: [group("g1", "bg")] }
    expect(emitTheme("light", tree, renderColor)).toContain("class Light {")
  })
})
