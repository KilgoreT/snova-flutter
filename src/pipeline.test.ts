import { buildColorFile, ThemeColorTokens } from "./pipeline"
import { RawCollection, RawGroup, RawColorToken } from "./adapters"
import { GenerateColorsConfig } from "./generate"

const collections: RawCollection[] = [
  { id: "c1", persistentId: "p1", name: "Semantic Color" },
  { id: "c2", persistentId: "p2", name: "_Primitives Litnet Color" },
]

// Виртуальный корень + bg/brand + группа примитивов, которая должна отсеяться (прунингом).
const groups: RawGroup[] = [
  { id: "r", name: "Color", parentGroupId: null, isRoot: true },
  { id: "bg", name: "bg", parentGroupId: "r", isRoot: false },
  { id: "brand", name: "brand", parentGroupId: "bg", isRoot: false },
  { id: "prim", name: "primitives", parentGroupId: "r", isRoot: false },
]

const semanticToken = (id: string, value: RawColorToken["value"]): RawColorToken => ({
  id,
  name: "zelenyi",
  parentGroupId: "brand",
  collectionId: "c1",
  value,
})
const primitiveToken: RawColorToken = {
  id: "prim1",
  name: "green500",
  parentGroupId: "prim",
  collectionId: "c2",
  value: { color: { r: 0, g: 128, b: 0 }, opacity: { measure: 1 } },
}

const config: GenerateColorsConfig = {
  generateDisclaimer: false,
  basePath: "./kw",
  colorPath: "/colors",
  colorFileName: "app_colors",
  rootClassName: "AppColors",
  defaultThemeName: "Light",
}

describe("buildColorFile (сквозной конвейер)", () => {
  it("генерит темы, скоупит по коллекции и режет чужие ветки", () => {
    const themes: ThemeColorTokens[] = [
      {
        name: "Dark",
        tokens: [semanticToken("t1", { color: { r: 33, g: 38, b: 10 }, opacity: { measure: 1 } }), primitiveToken],
      },
      {
        name: "Light",
        tokens: [semanticToken("t1", { color: { r: 200, g: 220, b: 120 }, opacity: { measure: 1 } }), primitiveToken],
      },
    ]
    const file = buildColorFile("Semantic Color", collections, groups, themes, config)

    // единый корень AppColors + приватные классы тем, вложенность bg.brand.zelenyi
    expect(file.content).toContain("class AppColors {")
    expect(file.content).toContain("class _Dark {")
    expect(file.content).toContain("class _Light {")
    expect(file.content).toContain("final _DarkBgBrand brand = const _DarkBgBrand._();")
    expect(file.content).toContain("final Color zelenyi = const Color(0xFF21260A);")
    expect(file.content).toContain("final Color zelenyi = const Color(0xFFC8DC78);")

    // шорткат без темы указывает на Light (дефолт)
    expect(file.content).toContain("static const bg = _LightBg._();")
    expect(file.content).toContain("static const dark = _Dark._();")
    expect(file.content).toContain("static const light = _Light._();")

    // примитивы из другой коллекции исключены
    expect(file.content).not.toContain("primitives")
    expect(file.content).not.toContain("green500")
  })

  it("бросает ошибку на несуществующую коллекцию", () => {
    expect(() => buildColorFile("Nope", collections, groups, [], config)).toThrow(/Nope/)
  })
})
