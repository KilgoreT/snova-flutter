/**
 * Обрезка пустых веток дерева: группа выбрасывается, если у неё нет ни токенов,
 * ни выживших подгрупп. Нужно, чтобы группы чужой коллекции (без семантических
 * токенов) не давали пустые классы в выводе. Возвращает новое дерево, не мутируя вход.
 */

import { GroupNode, Tree } from "./tree"

function pruneGroups<V>(nodes: Array<GroupNode<V>>): Array<GroupNode<V>> {
  const result: Array<GroupNode<V>> = []
  for (const node of nodes) {
    const groups = pruneGroups(node.groups)
    if (groups.length > 0 || node.tokens.length > 0) {
      result.push({ ...node, groups })
    }
  }
  return result
}

export function pruneEmpty<V>(tree: Tree<V>): Tree<V> {
  return { roots: pruneGroups(tree.roots) }
}
