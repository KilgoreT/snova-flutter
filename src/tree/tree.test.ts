import { buildTree, FlatGroup, FlatToken } from "./tree"

// Упрощённое значение токена для тестов дерева — дереву всё равно, что за V.
type V = string

const g = (id: string, name: string, parentGroupId: string | null): FlatGroup => ({ id, name, parentGroupId })
const t = (id: string, name: string, parentGroupId: string, value: V): FlatToken<V> => ({ id, name, parentGroupId, value })

describe("buildTree", () => {
  it("пустой вход → пустое дерево", () => {
    expect(buildTree<V>([], [])).toEqual({ roots: [] })
  })

  it("одна корневая группа без токенов", () => {
    const tree = buildTree<V>([g("1", "bg", null)], [])
    expect(tree).toEqual({ roots: [{ id: "1", name: "bg", groups: [], tokens: [] }] })
  })

  it("вкладывает подгруппы в родителя", () => {
    const tree = buildTree<V>([g("1", "bg", null), g("2", "brand", "1")], [])
    expect(tree.roots).toHaveLength(1)
    expect(tree.roots[0].groups).toEqual([{ id: "2", name: "brand", groups: [], tokens: [] }])
  })

  it("раскладывает токены в их группы", () => {
    const tree = buildTree<V>([g("1", "bg", null)], [t("t1", "primary", "1", "#fff")])
    expect(tree.roots[0].tokens).toEqual([{ id: "t1", name: "primary", value: "#fff" }])
  })

  it("группа с ненайденным родителем становится корнем", () => {
    const tree = buildTree<V>([g("2", "brand", "missing")], [])
    expect(tree.roots).toEqual([{ id: "2", name: "brand", groups: [], tokens: [] }])
  })

  it("сортирует группы и токены по имени на каждом уровне (детерминизм)", () => {
    const tree = buildTree<V>(
      [g("1", "bg", null), g("z", "zeta", "1"), g("a", "alpha", "1")],
      [t("t2", "second", "1", "2"), t("t1", "first", "1", "1")],
    )
    expect(tree.roots[0].groups.map((x) => x.name)).toEqual(["alpha", "zeta"])
    expect(tree.roots[0].tokens.map((x) => x.name)).toEqual(["first", "second"])
  })

  it("сортирует и сами корни", () => {
    const tree = buildTree<V>([g("2", "text", null), g("1", "bg", null)], [])
    expect(tree.roots.map((x) => x.name)).toEqual(["bg", "text"])
  })

  it("бросает ошибку на токен с ненайденной группой (диагностика, не тихое выпадение)", () => {
    expect(() => buildTree<V>([], [t("t1", "primary", "missing", "#fff")])).toThrow(/group/i)
  })

  it("детерминированно упорядочивает группы с одинаковым именем (tie по имени)", () => {
    const tree = buildTree<V>([g("1", "bg", null), g("a", "dup", "1"), g("b", "dup", "1")], [])
    expect(tree.roots[0].groups.map((x) => x.name)).toEqual(["dup", "dup"])
    expect(tree.roots[0].groups.map((x) => x.id)).toEqual(["a", "b"])
  })

  it("строит многоуровневую иерархию", () => {
    const tree = buildTree<V>(
      [g("1", "bg", null), g("2", "brand", "1"), g("3", "hover", "2")],
      [t("t1", "zelenyi", "3", "#0f0")],
    )
    expect(tree.roots[0].groups[0].groups[0]).toEqual({
      id: "3",
      name: "hover",
      groups: [],
      tokens: [{ id: "t1", name: "zelenyi", value: "#0f0" }],
    })
  })
})
