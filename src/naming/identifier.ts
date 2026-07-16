/**
 * Превращение произвольного имени токена/группы в валидный Dart-идентификатор.
 *
 * Детерминированно и без молчаливых выпадений: если из имени нельзя извлечь ни одного
 * буквенно-цифрового слова — бросается ошибка (диагностика вместо тихого null).
 */

export type IdentifierStyle = "camel" | "pascal"

export interface IdentifierOptions {
  /** Множество зарезервированных слов Dart, которые нельзя использовать как идентификатор. */
  reserved?: ReadonlySet<string>
  /**
   * Таблица переименования: ключ — идентификатор в нижнем регистре, значение — замена.
   * Даёт красивые имена для частых коллизий (напр. `default` → `dflt`) вместо суффикса.
   */
  remap?: Readonly<Record<string, string>>
  /** Префикс для сегментов, начинающихся с цифры (Dart-идентификатор не может начинаться с цифры). */
  leadingDigitPrefix?: string
  /** Суффикс-фолбэк для reserved-слова, которого нет в таблице ремапа. */
  reservedSuffix?: string
}

/**
 * Зарезервированные слова Dart, которые НЕ могут быть идентификаторами.
 * (Built-in identifiers вроде `dynamic`, `factory` разрешены как имена и сюда не входят.)
 */
export const DART_RESERVED: ReadonlySet<string> = new Set([
  "assert", "await", "break", "case", "catch", "class", "const", "continue",
  "default", "do", "else", "enum", "extends", "false", "final", "finally",
  "for", "if", "in", "is", "new", "null", "rethrow", "return", "super",
  "switch", "this", "throw", "true", "try", "var", "void", "while", "with",
  "yield",
])

const DEFAULT_LEADING_DIGIT_PREFIX = "n"
const DEFAULT_RESERVED_SUFFIX = "$"

/** Ремап по умолчанию: частые в дизайн-системах имена, совпадающие с ключевыми словами Dart. */
export const DEFAULT_REMAP: Readonly<Record<string, string>> = {
  default: "dflt",
}

/** Разбивает строку на буквенно-цифровые слова, уважая границы регистра и акронимы. */
function splitWords(raw: string): string[] {
  const normalized = raw.replace(/&/g, " and ")
  const matches = normalized.match(/[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g)
  return matches ?? []
}

/** Первая буква — заглавная, остальные — строчные. */
function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

export function toIdentifier(rawName: string, style: IdentifierStyle, opts: IdentifierOptions = {}): string {
  const reserved = opts.reserved ?? DART_RESERVED
  const remap = opts.remap ?? DEFAULT_REMAP
  const leadingDigitPrefix = opts.leadingDigitPrefix ?? DEFAULT_LEADING_DIGIT_PREFIX
  const reservedSuffix = opts.reservedSuffix ?? DEFAULT_RESERVED_SUFFIX

  const words = splitWords(rawName)
  if (words.length === 0) {
    throw new Error(`Cannot derive a Dart identifier from name: ${JSON.stringify(rawName)}`)
  }

  let identifier = words
    .map((word, index) => (style === "camel" && index === 0 ? word.toLowerCase() : capitalize(word)))
    .join("")

  if (/^[0-9]/.test(identifier)) {
    const prefix =
      style === "pascal"
        ? leadingDigitPrefix.charAt(0).toUpperCase() + leadingDigitPrefix.slice(1)
        : leadingDigitPrefix.charAt(0).toLowerCase() + leadingDigitPrefix.slice(1)
    identifier = prefix + identifier
  }

  // Ремап красивых замен (напр. default → dflt) имеет приоритет над суффиксом.
  const replacement = remap[identifier.toLowerCase()]
  if (replacement !== undefined) {
    return style === "pascal" ? capitalize(replacement) : replacement
  }

  if (reserved.has(identifier.toLowerCase())) {
    identifier = identifier + reservedSuffix
  }

  return identifier
}
