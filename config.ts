/**
 * Exporter configuration — type interface.
 *
 * The list of user-facing toggles ("галки" in the Supernova export UI) is declared
 * in `config.json` (key / type / default / title / description).
 * Local dev override values live in `config.local.json`.
 * Inside the code the resolved config is read via `Pulsar.exportConfig<ExporterConfiguration>()`.
 */
export type ExporterConfiguration = {
  /** Name of the token collection to export, e.g. "Semantic Color". */
  collectionName: string

  /** When enabled, prepend an auto-generated disclaimer comment to every generated file. */
  generateDisclaimer: boolean

  /** Base output directory (relative to repo root; repo root itself must NOT be included), e.g. "./packages/ui_kit_litnet_audio/lib/sam". */
  basePath: string

  /** Sub-path (relative to basePath) for the color file, e.g. "/colors". */
  colorPath: string

  /** File name (without extension) for the generated color file, e.g. "app_colors". */
  colorFileName: string

  /** Name of the public root class, e.g. "AppColors". */
  rootClassName: string

  /** Theme reachable without naming it (root shortcuts), e.g. "Light". */
  defaultThemeName: string
}
