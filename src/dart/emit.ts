/**
 * Эмиттер Dart: все темы → единый корневой класс с точечным доступом и автодополнением.
 *
 * Структура вывода:
 *   AppColors                — публичный корень:
 *     static const light/dark/sepia = _Light/_Dark/_Sepia._()   — доступ к теме явно
 *     static const bg/text/... = _<Default>Bg/..._()            — шорткаты дефолтной темы (без темы = дефолт)
 *   _Light, _LightBg, ...    — приватные классы каждой темы (instance-поля `final`)
 *
 * Детерминизм: темы и поля упорядочены по алфавиту; коллизии идентификаторов сиблингов
 * разводятся числовым суффиксом.
 */

import { toIdentifier } from "../naming/identifier"
import { GroupNode, TokenNode } from "../tree/tree"
import type { ThemeTree } from "../generate"

export type RenderedValue = { type: string; expr: string }
export type ValueRenderer<V> = (value: V) => RenderedValue

/** Прямой групповой член класса: имя поля и имя класса-подгруппы (для шорткатов корня). */
interface EmittedMember {
  fieldId: string
  className: string
}

export function emitThemes<V>(
  rootClassName: string,
  themes: Array<ThemeTree<V>>,
  defaultThemeName: string,
  renderValue: ValueRenderer<V>,
): string {
  const classes: string[] = []
  const sorted = [...themes].sort((a, b) =>
    a.themeName < b.themeName ? -1 : a.themeName > b.themeName ? 1 : 0,
  )

  const emitted = sorted.map((theme) => {
    const base = toIdentifier(theme.themeName, "pascal")
    const top = emitGroupClass(base, theme.tree.roots, [], renderValue, classes)
    return { name: theme.themeName, base, top }
  })

  const def = emitted.find((e) => e.name.toLowerCase() === defaultThemeName.toLowerCase()) ?? emitted[0]

  classes.unshift(buildRootClass(rootClassName, emitted, def))
  return classes.join("\n\n")
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function makeUniquifier(): (baseId: string) => string {
  const used = new Set<string>()
  return (baseId: string): string => {
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
}

type Member<V> =
  | { kind: "group"; sortKey: string; id: string; node: GroupNode<V> }
  | { kind: "token"; sortKey: string; id: string; node: TokenNode<V> }

/** Эмитит приватный класс `_base` (instance-поля `final`) и его потомков; возвращает прямые группы. */
function emitGroupClass<V>(
  base: string,
  groups: Array<GroupNode<V>>,
  tokens: Array<TokenNode<V>>,
  renderValue: ValueRenderer<V>,
  classes: string[],
): EmittedMember[] {
  const className = "_" + base

  const members: Array<Member<V>> = [
    ...groups.map((node): Member<V> => ({ kind: "group", sortKey: toIdentifier(node.name, "camel"), id: node.id, node })),
    ...tokens.map((node): Member<V> => ({ kind: "token", sortKey: toIdentifier(node.name, "camel"), id: node.id, node })),
  ]
  members.sort((a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  const uniquify = makeUniquifier()
  const lines: string[] = []
  const childRecurse: Array<{ childBase: string; node: GroupNode<V> }> = []
  const directGroups: EmittedMember[] = []

  for (const member of members) {
    const fieldId = uniquify(member.sortKey)
    if (member.kind === "group") {
      const childBase = base + capitalizeFirst(fieldId)
      const childClassName = "_" + childBase
      lines.push(`final ${childClassName} ${fieldId} = const ${childClassName}._();`)
      childRecurse.push({ childBase, node: member.node })
      directGroups.push({ fieldId, className: childClassName })
    } else {
      const value = renderValue(member.node.value)
      lines.push(`final ${value.type} ${fieldId} = const ${value.expr};`)
    }
  }

  classes.push(wrapClass(className, lines))

  for (const child of childRecurse) {
    emitGroupClass(child.childBase, child.node.groups, child.node.tokens, renderValue, classes)
  }

  return directGroups
}

/** Публичный корень: инстансы тем + шорткаты групп дефолтной темы (static const). */
function buildRootClass(
  rootClassName: string,
  emitted: Array<{ name: string; base: string; top: EmittedMember[] }>,
  def: { base: string; top: EmittedMember[] } | undefined,
): string {
  const rootBase = toIdentifier(rootClassName, "pascal")
  const uniquify = makeUniquifier()

  // Инстансы тем идут первыми — их имена приоритетны при коллизии.
  const themeMembers = emitted.map((e) => ({ fieldId: uniquify(toIdentifier(e.name, "camel")), expr: `_${e.base}._()` }))
  const shortcutMembers = def
    ? def.top.map((m) => ({ fieldId: uniquify(m.fieldId), expr: `${m.className}._()` }))
    : []

  const all = [...themeMembers, ...shortcutMembers].sort((a, b) =>
    a.fieldId < b.fieldId ? -1 : a.fieldId > b.fieldId ? 1 : 0,
  )
  const lines = all.map((m) => `static const ${m.fieldId} = ${m.expr};`)
  return wrapClass(rootBase, lines)
}

function wrapClass(className: string, lines: string[]): string {
  let body = `class ${className} {\n  const ${className}._();`
  if (lines.length > 0) {
    body += "\n\n" + lines.map((l) => "  " + l).join("\n")
  }
  body += "\n}"
  return body
}
