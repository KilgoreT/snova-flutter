import {
  flattenGroups,
  findCollection,
  tokensInCollection,
  toColorFlatTokens,
  themeOverridesCollectionColors,
  RawGroup,
} from "./adapters"

describe("flattenGroups", () => {
  it("исключает isRoot-группы и переподвешивает их детей на верхний уровень", () => {
    const groups: RawGroup[] = [
      { id: "r", name: "Color", parentGroupId: null, isRoot: true },
      { id: "bg", name: "bg", parentGroupId: "r", isRoot: false },
      { id: "brand", name: "brand", parentGroupId: "bg", isRoot: false },
    ]
    expect(flattenGroups(groups)).toEqual([
      { id: "bg", name: "bg", parentGroupId: null },
      { id: "brand", name: "brand", parentGroupId: "bg" },
    ])
  })
})

describe("findCollection", () => {
  const collections = [
    { id: "c1", persistentId: "p1", name: "Semantic Color" },
    { id: "c2", persistentId: "p2", name: "_Primitives Litnet Color" },
  ]

  it("находит коллекцию по имени", () => {
    expect(findCollection(collections, "Semantic Color").id).toBe("c1")
  })

  it("бросает ошибку с перечнем доступных, если не найдена", () => {
    expect(() => findCollection(collections, "Nope")).toThrow(/Semantic Color/)
  })
})

describe("tokensInCollection", () => {
  it("оставляет токены коллекции (по id или persistentId)", () => {
    const tokens = [
      { id: "t1", collectionId: "c1" },
      { id: "t2", collectionId: "p1" },
      { id: "t3", collectionId: "c2" },
      { id: "t4", collectionId: null },
    ]
    const result = tokensInCollection(tokens, { id: "c1", persistentId: "p1" })
    expect(result.map((t) => t.id)).toEqual(["t1", "t2"])
  })
})

describe("themeOverridesCollectionColors", () => {
  const collection = { id: "c1", persistentId: "p1" }

  it("true, если тема оверрайдит цветовой токен коллекции (по id или persistentId)", () => {
    expect(themeOverridesCollectionColors([{ tokenType: "Color", collectionId: "c1" }], collection, "Color")).toBe(true)
    expect(themeOverridesCollectionColors([{ tokenType: "Color", collectionId: "p1" }], collection, "Color")).toBe(true)
  })

  it("true для цветового оверрайда с непроставленной коллекцией (не режем вслепую)", () => {
    expect(themeOverridesCollectionColors([{ tokenType: "Color", collectionId: null }], collection, "Color")).toBe(true)
  })

  it("false для тем без цветовых оверрайдов в этой коллекции (Desktop/Mobile)", () => {
    expect(themeOverridesCollectionColors([{ tokenType: "Dimension", collectionId: "c1" }], collection, "Color")).toBe(false)
    expect(themeOverridesCollectionColors([{ tokenType: "Color", collectionId: "c2" }], collection, "Color")).toBe(false)
    expect(themeOverridesCollectionColors([{ tokenType: "Dimension", collectionId: null }], collection, "Color")).toBe(false)
    expect(themeOverridesCollectionColors([], collection, "Color")).toBe(false)
  })
})

describe("toColorFlatTokens", () => {
  it("маппит цветовой токен в FlatToken с DartColorInput", () => {
    const tokens = [
      {
        id: "t1",
        name: "primary",
        parentGroupId: "bg",
        collectionId: "c1",
        value: { color: { r: 1, g: 2, b: 3 }, opacity: { measure: 0.5 } },
      },
    ]
    expect(toColorFlatTokens(tokens)).toEqual([
      { id: "t1", name: "primary", parentGroupId: "bg", value: { color: { r: 1, g: 2, b: 3 }, opacity: { measure: 0.5 } } },
    ])
  })
})
