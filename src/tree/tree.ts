/**
 * Построение иерархического дерева токенов из плоских списков групп и токенов.
 *
 * Дерево канонизируется: группы и токены на каждом уровне сортируются по имени —
 * это часть требования детерминизма (стабильный порядок → нет шумных diff в MR).
 * Токен, чья группа не найдена, порождает ошибку (явная диагностика, не тихое выпадение).
 */

export interface FlatGroup {
  id: string
  name: string
  parentGroupId: string | null
}

export interface FlatToken<V> {
  id: string
  name: string
  parentGroupId: string
  value: V
}

export interface TokenNode<V> {
  id: string
  name: string
  value: V
}

export interface GroupNode<V> {
  id: string
  name: string
  groups: Array<GroupNode<V>>
  tokens: Array<TokenNode<V>>
}

export interface Tree<V> {
  roots: Array<GroupNode<V>>
}

/** Стабильное сравнение по имени в порядке кодовых точек (детерминизм, независимо от локали). */
function byName(a: { name: string }, b: { name: string }): number {
  if (a.name < b.name) return -1
  if (a.name > b.name) return 1
  return 0
}

export function buildTree<V>(groups: Array<FlatGroup>, tokens: Array<FlatToken<V>>): Tree<V> {
  const nodeById = new Map<string, GroupNode<V>>()
  for (const group of groups) {
    nodeById.set(group.id, { id: group.id, name: group.name, groups: [], tokens: [] })
  }

  const roots: Array<GroupNode<V>> = []
  for (const group of groups) {
    const node = nodeById.get(group.id)!
    const parent = group.parentGroupId !== null ? nodeById.get(group.parentGroupId) : undefined
    if (parent) {
      parent.groups.push(node)
    } else {
      roots.push(node)
    }
  }

  for (const token of tokens) {
    const parent = nodeById.get(token.parentGroupId)
    if (!parent) {
      throw new Error(`Token ${JSON.stringify(token.name)} (${token.id}) references unknown group ${JSON.stringify(token.parentGroupId)}`)
    }
    parent.tokens.push({ id: token.id, name: token.name, value: token.value })
  }

  sortRecursively(roots)
  return { roots }
}

function sortRecursively<V>(nodes: Array<GroupNode<V>>): void {
  nodes.sort(byName)
  for (const node of nodes) {
    node.tokens.sort(byName)
    sortRecursively(node.groups)
  }
}
