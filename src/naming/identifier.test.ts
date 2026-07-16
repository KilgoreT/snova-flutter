import { toIdentifier } from "./identifier"

describe("toIdentifier — camelCase (поля Dart)", () => {
  it("оставляет простое имя как есть", () => {
    expect(toIdentifier("bg", "camel")).toBe("bg")
  })

  it("склеивает слова в camelCase", () => {
    expect(toIdentifier("brand default", "camel")).toBe("brandDefault")
  })

  it("разбивает по любым не-алфанумерик разделителям", () => {
    expect(toIdentifier("bg/brand", "camel")).toBe("bgBrand")
    expect(toIdentifier("green-500", "camel")).toBe("green500")
    expect(toIdentifier("text.primary_color", "camel")).toBe("textPrimaryColor")
  })

  it("нормализует уже-camelCase и ALLCAPS сегменты", () => {
    expect(toIdentifier("brandDefault", "camel")).toBe("brandDefault")
    expect(toIdentifier("HTMLParser", "camel")).toBe("htmlParser")
  })

  it("превращает & в слово And", () => {
    expect(toIdentifier("A & B", "camel")).toBe("aAndB")
  })
})

describe("toIdentifier — PascalCase (классы Dart)", () => {
  it("делает PascalCase", () => {
    expect(toIdentifier("bg", "pascal")).toBe("Bg")
    expect(toIdentifier("brand default", "pascal")).toBe("BrandDefault")
    expect(toIdentifier("A & B", "pascal")).toBe("AAndB")
  })
})

describe("toIdentifier — Dart-невалидные случаи", () => {
  it("префиксует сегмент, начинающийся с цифры (дефолт 'n')", () => {
    expect(toIdentifier("500", "camel")).toBe("n500")
    expect(toIdentifier("500", "pascal")).toBe("N500")
  })

  it("уважает кастомный leadingDigitPrefix", () => {
    expect(toIdentifier("500", "camel", { leadingDigitPrefix: "shade" })).toBe("shade500")
  })

  it("ремапит default → dflt по умолчанию (camel и pascal)", () => {
    expect(toIdentifier("default", "camel")).toBe("dflt")
    expect(toIdentifier("Default", "camel")).toBe("dflt")
    expect(toIdentifier("default", "pascal")).toBe("Dflt")
  })

  it("уважает кастомную таблицу ремапа", () => {
    expect(toIdentifier("default", "camel", { remap: { default: "base" } })).toBe("base")
  })

  it("добавляет суффикс-фолбэк прочим reserved-словам без ремапа (дефолт '$')", () => {
    expect(toIdentifier("class", "camel")).toBe("class$")
    expect(toIdentifier("new", "camel")).toBe("new$")
  })

  it("уважает кастомный reservedSuffix для не-ремапнутых слов", () => {
    expect(toIdentifier("class", "camel", { reservedSuffix: "Value" })).toBe("classValue")
  })

  it("не трогает не-зарезервированные слова, похожие на ключевые", () => {
    expect(toIdentifier("error", "camel")).toBe("error")
  })

  it("бросает ошибку, если из имени нельзя извлечь идентификатор", () => {
    expect(() => toIdentifier("___", "camel")).toThrow(/identifier/i)
    expect(() => toIdentifier("   ", "camel")).toThrow(/identifier/i)
  })
})
