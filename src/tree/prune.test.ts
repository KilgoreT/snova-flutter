import { pruneEmpty } from "./prune"
import { Tree } from "./tree"

const g = (id: string, name: string, groups: any[] = [], tokens: any[] = []) => ({ id, name, groups, tokens })
const tok = (id: string, name: string) => ({ id, name, value: "v" })

describe("pruneEmpty", () => {
  it("удаляет группу без токенов и подгрупп", () => {
    const tree: Tree<string> = { roots: [g("1", "empty")] }
    expect(pruneEmpty(tree)).toEqual({ roots: [] })
  })

  it("сохраняет группу с токенами", () => {
    const tree: Tree<string> = { roots: [g("1", "bg", [], [tok("t1", "primary")])] }
    expect(pruneEmpty(tree)).toEqual(tree)
  })

  it("сохраняет предков, ведущих к токену, но режет пустые ветки рядом", () => {
    const tree: Tree<string> = {
      roots: [g("1", "bg", [g("2", "brand", [], [tok("t1", "x")]), g("3", "emptySub")], [])],
    }
    const pruned = pruneEmpty(tree)
    expect(pruned.roots[0].groups.map((n) => n.name)).toEqual(["brand"])
  })

  it("удаляет ветку из одних пустых подгрупп", () => {
    const tree: Tree<string> = { roots: [g("1", "bg", [g("2", "a"), g("3", "b")], [])] }
    expect(pruneEmpty(tree)).toEqual({ roots: [] })
  })

  it("не мутирует исходное дерево", () => {
    const tree: Tree<string> = { roots: [g("1", "bg", [g("2", "empty")], [tok("t1", "x")])] }
    const snapshot = JSON.stringify(tree)
    pruneEmpty(tree)
    expect(JSON.stringify(tree)).toBe(snapshot)
  })
})
