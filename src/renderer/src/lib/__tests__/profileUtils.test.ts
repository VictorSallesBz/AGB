import { describe, it, expect } from "vitest"
import { getFilteredProfileTweaks, getExcessProfileTweaks, isProfileFullyActive } from "../profileUtils"

describe("getFilteredProfileTweaks", () => {
  const sampleTweaks = [
    "disable-telemetry",
    "enable-game-mode",
    "optimize-nvidia-settings",
    "optimize-amd-settings",
    "optimize-discord",
  ]

  it("includes optimize-nvidia-settings and excludes optimize-amd-settings when system has NVIDIA GPU", () => {
    const systemInfo = {
      isNvidia: true,
      isAmd: false,
      gpu_model: "NVIDIA GeForce RTX 4070 Ti",
    }

    const filtered = getFilteredProfileTweaks(sampleTweaks, systemInfo)
    expect(filtered).toContain("optimize-nvidia-settings")
    expect(filtered).not.toContain("optimize-amd-settings")
    expect(filtered).toContain("disable-telemetry")
    expect(filtered).toContain("enable-game-mode")
    expect(filtered).toContain("optimize-discord")
    expect(filtered).toHaveLength(4)
  })

  it("includes optimize-amd-settings and excludes optimize-nvidia-settings when system has AMD GPU", () => {
    const systemInfo = {
      isNvidia: false,
      isAmd: true,
      gpu_model: "AMD Radeon RX 7900 XTX",
    }

    const filtered = getFilteredProfileTweaks(sampleTweaks, systemInfo)
    expect(filtered).toContain("optimize-amd-settings")
    expect(filtered).not.toContain("optimize-nvidia-settings")
    expect(filtered).toHaveLength(4)
  })

  it("prioritizes dedicated NVIDIA GPU over integrated AMD GPU", () => {
    const systemInfo = {
      isNvidia: true,
      isAmd: false,
      gpu_model: "NVIDIA GeForce RTX 4080",
      integrated_gpu: "AMD Radeon(TM) Graphics",
    }

    const filtered = getFilteredProfileTweaks(sampleTweaks, systemInfo)
    expect(filtered).toContain("optimize-nvidia-settings")
    expect(filtered).not.toContain("optimize-amd-settings")
  })

  it("detects NVIDIA from gpu_model string fallback if boolean flags are missing", () => {
    const systemInfo = {
      gpu_model: "GeForce RTX 3060",
    }

    const filtered = getFilteredProfileTweaks(sampleTweaks, systemInfo)
    expect(filtered).toContain("optimize-nvidia-settings")
    expect(filtered).not.toContain("optimize-amd-settings")
  })

  it("detects AMD from gpu_model string fallback if boolean flags are missing", () => {
    const systemInfo = {
      gpu_model: "Radeon RX 6700 XT",
    }

    const filtered = getFilteredProfileTweaks(sampleTweaks, systemInfo)
    expect(filtered).toContain("optimize-amd-settings")
    expect(filtered).not.toContain("optimize-nvidia-settings")
  })

  it("excludes both GPU tweaks when system has Intel or unsupported GPU", () => {
    const systemInfo = {
      isNvidia: false,
      isAmd: false,
      gpu_model: "Intel Arc A770",
    }

    const filtered = getFilteredProfileTweaks(sampleTweaks, systemInfo)
    expect(filtered).not.toContain("optimize-nvidia-settings")
    expect(filtered).not.toContain("optimize-amd-settings")
    expect(filtered).toHaveLength(3)
  })

  it("handles empty or undefined tweaks and systemInfo safely", () => {
    expect(getFilteredProfileTweaks([])).toEqual([])
    expect(getFilteredProfileTweaks(sampleTweaks, undefined)).toEqual([
      "disable-telemetry",
      "enable-game-mode",
      "optimize-discord",
    ])
  })
})

describe("getExcessProfileTweaks & isProfileFullyActive", () => {
  const lightTweaks = ["tweak-a", "tweak-b"]
  const moderateTweaks = ["tweak-a", "tweak-b", "tweak-c", "tweak-d"]
  const aggressiveTweaks = ["tweak-a", "tweak-b", "tweak-c", "tweak-d", "tweak-e", "tweak-f"]
  const allProfileTweaks = new Set([...aggressiveTweaks])

  it("identifies excess tweaks when downgrading from aggressive to moderate", () => {
    const activeTweaks = [...aggressiveTweaks, "custom-tweak-1", "enable-dark-mode"]
    const excess = getExcessProfileTweaks(activeTweaks, moderateTweaks, allProfileTweaks)

    expect(excess).toEqual(["tweak-e", "tweak-f"])
    // Optional custom tweaks NOT in allProfileTweaks must NEVER be in excess
    expect(excess).not.toContain("custom-tweak-1")
    expect(excess).not.toContain("enable-dark-mode")
  })

  it("identifies excess tweaks when downgrading from moderate to light", () => {
    const activeTweaks = [...moderateTweaks, "24-hour-clock"]
    const excess = getExcessProfileTweaks(activeTweaks, lightTweaks, allProfileTweaks)

    expect(excess).toEqual(["tweak-c", "tweak-d"])
    expect(excess).not.toContain("24-hour-clock")
  })

  it("returns empty excess array when moving up or when already in target profile", () => {
    const activeTweaks = ["tweak-a", "tweak-b", "custom-tweak"]
    const excess = getExcessProfileTweaks(activeTweaks, moderateTweaks, allProfileTweaks)
    expect(excess).toEqual([])
  })

  it("correctly identifies if profile is strictly active", () => {
    // When aggressive is active (all 6 tweaks active)
    const aggressiveActive = [...aggressiveTweaks, "custom-tweak"]
    expect(isProfileFullyActive(aggressiveActive, aggressiveTweaks, allProfileTweaks)).toBe(true)
    // Moderate has its tweaks active, but has excess tweaks from aggressive, so isProfileFullyActive is false!
    expect(isProfileFullyActive(aggressiveActive, moderateTweaks, allProfileTweaks)).toBe(false)
    expect(isProfileFullyActive(aggressiveActive, lightTweaks, allProfileTweaks)).toBe(false)

    // When moderate is active (only a, b, c, d + custom)
    const moderateActive = [...moderateTweaks, "custom-tweak"]
    expect(isProfileFullyActive(moderateActive, aggressiveTweaks, allProfileTweaks)).toBe(false)
    expect(isProfileFullyActive(moderateActive, moderateTweaks, allProfileTweaks)).toBe(true)
    expect(isProfileFullyActive(moderateActive, lightTweaks, allProfileTweaks)).toBe(false)

    // When light is active (only a, b + custom)
    const lightActive = [...lightTweaks, "custom-tweak"]
    expect(isProfileFullyActive(lightActive, aggressiveTweaks, allProfileTweaks)).toBe(false)
    expect(isProfileFullyActive(lightActive, moderateTweaks, allProfileTweaks)).toBe(false)
    expect(isProfileFullyActive(lightActive, lightTweaks, allProfileTweaks)).toBe(true)
  })
})

