import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.d.ts", "src/index.ts"],
      thresholds: {
        // Строгое покрытие генерирующего слоя — приоритет пользователя.
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
})
