import { describe, it, expect } from "vitest"
import {
  getTranslation,
  getTweakTranslation,
  getUtilityTranslation,
  getCleanupTranslation,
  getDnsTranslation,
  translateTweakWarning,
} from "../index"

describe("i18n translation system", () => {
  it("translates UI keys in Portuguese", () => {
    expect(getTranslation("pt", "navHome")).toBe("Painel")
    expect(getTranslation("pt", "navTweaks")).toBe("Ajustes")
    expect(getTranslation("pt", "save")).toBe("Salvar")
    expect(getTranslation("pt", "lastCleanedLabel")).toBe("Última limpeza:")
    expect(getTranslation("pt", "totalSizeLabel")).toBe("Tamanho total:")
    expect(getTranslation("pt", "totalFreedLabel")).toBe("Total liberado:")
  })

  it("translates UI keys in English", () => {
    expect(getTranslation("en", "navHome")).toBe("Dashboard")
    expect(getTranslation("en", "navTweaks")).toBe("Tweaks")
    expect(getTranslation("en", "save")).toBe("Save")
    expect(getTranslation("en", "lastCleanedLabel")).toBe("Last cleaned:")
    expect(getTranslation("en", "totalSizeLabel")).toBe("Total size:")
    expect(getTranslation("en", "totalFreedLabel")).toBe("Total freed:")
  })

  it("replaces parameters in translations", () => {
    const result = getTranslation("pt", "appliedTweaksCount", { count: "5" })
    expect(result).toContain("5")
  })

  it("translates tweaks with exact match", () => {
    const ptTweak = getTweakTranslation("pt", "disable-telemetry", "Disable Telemetry", "Description")
    expect(ptTweak.title).toBe("Desativar Telemetria e Coleta de Dados")
  })

  it("normalizes tweak keys with underscores to hyphens", () => {
    const ptTweak = getTweakTranslation("pt", "disable_telemetry", "Disable Telemetry", "Description")
    expect(ptTweak.title).toBe("Desativar Telemetria e Coleta de Dados")
  })

  it("translates agb-power-plan tweak in both locales", () => {
    const ptTweak = getTweakTranslation("pt", "agb-power-plan", "", "")
    expect(ptTweak.title).toBe("Plano de Energia Gamer AGB")
    const enTweak = getTweakTranslation("en", "agb-power-plan", "", "")
    expect(enTweak.title).toBe("AGB Ultimate Gaming Power Plan")
  })

  it("falls back to default if tweak is missing in all locales", () => {
    const fallback = getTweakTranslation("pt", "non-existent-tweak", "Custom Title", "Custom Desc")
    expect(fallback.title).toBe("Custom Title")
    expect(fallback.description).toBe("Custom Desc")
  })

  it("translates utilities in Portuguese", () => {
    const util = getUtilityTranslation("pt", "Disk Cleaner", "Disk Cleaner", "Desc", "Clean Now")
    expect(util.name).toBe("Limpeza de Disco")
  })

  it("translates cleanups in Portuguese", () => {
    const cleanup = getCleanupTranslation("pt", "temp", "Clean Temporary Files", "Desc")
    expect(cleanup.label).toBe("Limpar Arquivos Temporários")
  })

  it("translates DNS providers in Portuguese", () => {
    const dns = getDnsTranslation("pt", "cloudflare", "Desc", ["Fast"])
    expect(dns.description).toContain("privacidade")
  })

  it("translates DPC diagnostics utility, shadercache cleanup, uninstallComplete, and tweak warnings in Portuguese", () => {
    const dpcUtil = getUtilityTranslation("pt", "DPC Latency & Driver Diagnostics", "DPC", "Desc", "Diagnose")
    expect(dpcUtil.name).toBe("Diagnóstico de Latência DPC e Drivers")
    expect(dpcUtil.buttonText).toBe("Diagnosticar")

    const shaderClean = getCleanupTranslation("pt", "shadercache", "Deep Shader Cache Cleaner", "Desc")
    expect(shaderClean.label).toBe("Limpeza Profunda de Cache de Shaders")

    expect(getTranslation("pt", "uninstallComplete")).toBe("Desinstalação concluída com sucesso!")
    expect(translateTweakWarning("disable-hibernation", "Not Recommended for laptops!", "pt")).toBe(
      "Quando usar: PCs de mesa (Desktops) para liberar GB do SSD. Quando NÃO usar: notebooks que dependem da hibernação ao fechar a tampa.",
    )

    expect(getTweakTranslation("pt", "disable-mpo", "", "").title).toBe("Desativar Multiplane Overlay (MPO)")
    expect(translateTweakWarning("disable-sysmain", "SSD only", "pt")).toContain("SSD ou NVMe")
    expect(translateTweakWarning("disable-memory-compression", "16GB+ RAM", "pt")).toContain("16 GB")
    expect(translateTweakWarning("disable-core-isolation", "Anti-Cheat warning", "pt")).toContain("FACEIT")
    expect(getUtilityTranslation("pt", "Anti-Cheat Readiness Checker", "", "").name).toContain("Anti-Cheat")
    expect(getUtilityTranslation("pt", "Restore Per-Game Exe Optimizations", "", "").name).toContain("Reverter")
    expect(getTweakTranslation("pt", "enable-legacy-photo-viewer", "", "").title).toContain("Visualizador de Fotos")
    expect(getTweakTranslation("pt", "disable-xbox-services", "", "").title).toBe("Desativar Serviços Xbox")
    expect(getCleanupTranslation("pt", "browsercache", "", "").label).toBe("Limpar Cache de Navegadores")
  })
})
