import { colorValueToDart } from "./color"

describe("colorValueToDart", () => {
  it("formats an opaque red as Color(0xFFFF0000)", () => {
    expect(colorValueToDart({ color: { r: 255, g: 0, b: 0 }, opacity: { measure: 1 } })).toBe("Color(0xFFFF0000)")
  })

  it("formats opaque black as Color(0xFF000000)", () => {
    expect(colorValueToDart({ color: { r: 0, g: 0, b: 0 }, opacity: { measure: 1 } })).toBe("Color(0xFF000000)")
  })

  it("zero-pads single-digit channels", () => {
    expect(colorValueToDart({ color: { r: 1, g: 2, b: 3 }, opacity: { measure: 1 } })).toBe("Color(0xFF010203)")
  })

  it("encodes 50% opacity as alpha 0x80 (rounds 127.5 up)", () => {
    expect(colorValueToDart({ color: { r: 255, g: 0, b: 0 }, opacity: { measure: 0.5 } })).toBe("Color(0x80FF0000)")
  })

  it("encodes fully transparent white as Color(0x00FFFFFF)", () => {
    expect(colorValueToDart({ color: { r: 255, g: 255, b: 255 }, opacity: { measure: 0 } })).toBe("Color(0x00FFFFFF)")
  })

  it("clamps out-of-range channel and opacity values", () => {
    expect(colorValueToDart({ color: { r: 300, g: -5, b: 128 }, opacity: { measure: 2 } })).toBe("Color(0xFFFF0080)")
  })

  it("uppercases hex digits", () => {
    expect(colorValueToDart({ color: { r: 171, g: 205, b: 239 }, opacity: { measure: 1 } })).toBe("Color(0xFFABCDEF)")
  })
})
