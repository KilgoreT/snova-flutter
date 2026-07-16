/** Minimal structural shape of a Supernova color token value needed to render Dart. */
export type DartColorInput = {
  color: { r: number; g: number; b: number }
  opacity: { measure: number }
}

/** Clamp `n` into the inclusive [min, max] range. */
function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Render a single 0..255 channel as an upper-case, zero-padded 2-digit hex string. */
function channelHex(n: number): string {
  return clamp(Math.round(n), 0, 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase()
}

/**
 * Convert a Supernova color token value into a Flutter `Color(0xAARRGGBB)` literal.
 *
 * `color.{r,g,b}` are 0..255 channels; `opacity.measure` is a 0..1 alpha factor.
 * Out-of-range inputs are clamped.
 */
export function colorValueToDart(value: DartColorInput): string {
  const a = channelHex(clamp(value.opacity.measure, 0, 1) * 255)
  const r = channelHex(value.color.r)
  const g = channelHex(value.color.g)
  const b = channelHex(value.color.b)
  return `Color(0x${a}${r}${g}${b})`
}
