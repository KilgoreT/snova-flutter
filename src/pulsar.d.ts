/**
 * Ambient-декларация рантайм-глобала `Pulsar`, который инжектирует платформа Supernova
 * при запуске экспортёра. В коде его не импортируют — он доступен глобально.
 */
import type { Supernova, PulsarContext, AnyOutputFile } from "@supernovaio/sdk-exporters"

declare global {
  const Pulsar: {
    export(fn: (sdk: Supernova, context: PulsarContext) => Promise<Array<AnyOutputFile>>): void
    exportConfig<T extends object>(): T
  }
}

export {}
