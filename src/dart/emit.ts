/**
 * Эмиттер Dart для одной темы: дерево токенов → набор вложенных классов с точечным доступом
 * (`Dark.bg.brand.zelenyi`) и автодополнением.
 *
 * Детерминизм: поля и классы упорядочены по алфавиту (по идентификатору) на каждом уровне.
 * Коллизии идентификаторов сиблингов (два разных имени → один идентификатор) разводятся
 * детерминированным числовым суффиксом — данные не теряются и Dart компилируется.
 */

import { toIdentifier } from "../naming/identifier"
import { GroupNode, TokenNode, Tree } from "../tree/tree"

/** Как отрендерить значение токена в Dart: тип поля и константное выражение. */
export type RenderedValue = { type: string; expr: string }
export type ValueRenderer<V> = (value: V) => RenderedValue

export function emitTheme<V>(themeName: string, tree: Tree<V>, renderValue: ValueRenderer<V>): string {
  const classes: string[] = []
  const rootBase = toIdentifier(themeName, "pascal")
  emitClass(rootBase, true, tree.roots, [], renderValue, classes)
  return classes.join("\n\n")
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type Member<V> =
  | { kind: "group"; sortKey: string; id: string; node: GroupNode<V> }
  | { kind: "token"; sortKey: string; id: string; node: TokenNode<V> }

function emitClass<V>(
  base: string,
  isRoot: boolean,
  groups: Array<GroupNode<V>>,
  tokens: Array<TokenNode<V>>,
  renderValue: ValueRenderer<V>,
  classes: string[],
): void {
  const className = isRoot ? base : "_" + base

  const members: Array<Member<V>> = [
    ...groups.map((node): Member<V> => ({ kind: "group", sortKey: toIdentifier(node.name, "camel"), id: node.id, node })),
    ...tokens.map((node): Member<V> => ({ kind: "token", sortKey: toIdentifier(node.name, "camel"), id: node.id, node })),
  ]
  members.sort((a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  const used = new Set<string>()
  const uniquify = (baseId: string): string => {
    if (!used.has(baseId)) {
      used.add(baseId)
      return baseId
    }
    let n = 2
    while (used.has(`${baseId}${n}`)) n++
    const id = `${baseId}${n}`
    used.add(id)
    return id
  }

  const lines: string[] = []
  const childRecurse: Array<{ childBase: string; node: GroupNode<V> }> = []

  for (const member of members) {
    const fieldId = uniquify(member.sortKey)
    if (member.kind === "group") {
      const childBase = base + capitalizeFirst(fieldId)
      const childClassName = "_" + childBase
      lines.push(
        isRoot
          ? `static const ${fieldId} = ${childClassName}._();`
          : `final ${childClassName} ${fieldId} = const ${childClassName}._();`,
      )
      childRecurse.push({ childBase, node: member.node })
    } else {
      // Инвариант: токены никогда не являются прямыми членами корневого класса темы
      // (корень содержит только группы — токены всегда лежат в группах).
      /* v8 ignore next 3 */
      if (isRoot) {
        throw new Error(`Unexpected token ${JSON.stringify(member.node.name)} directly in theme root class`)
      }
      const value = renderValue(member.node.value)
      lines.push(`final ${value.type} ${fieldId} = const ${value.expr};`)
    }
  }

  let body = `class ${className} {\n  const ${className}._();`
  if (lines.length > 0) {
    body += "\n\n" + lines.map((l) => "  " + l).join("\n")
  }
  body += "\n}"
  classes.push(body)

  for (const child of childRecurse) {
    emitClass(child.childBase, false, child.node.groups, child.node.tokens, renderValue, classes)
  }
}
