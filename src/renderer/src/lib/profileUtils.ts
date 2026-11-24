/**
 * Utility functions for optimization profiles
 */

/**
 * Filters profile tweaks to only include tweaks that are compatible with the system's hardware.
 * Specifically handles GPU vendor-specific optimizations (NVIDIA vs AMD).
 *
 * @param tweakNames Array of tweak IDs in the profile
 * @param systemInfo System information object from useSystemStore
 * @returns Array of tweak IDs compatible with the detected system hardware
 */
export function getFilteredProfileTweaks(tweakNames: string[], systemInfo?: any): string[] {
  if (!tweakNames || tweakNames.length === 0) return []

  const isNvidia = Boolean(
    systemInfo?.isNvidia ||
    (typeof systemInfo?.gpu_model === "string" && /nvidia|geforce|rtx|gtx/i.test(systemInfo.gpu_model))
  )

  const isAmd = Boolean(
    systemInfo?.isAmd ||
    (typeof systemInfo?.gpu_model === "string" && /amd|radeon/i.test(systemInfo.gpu_model)) ||
    (typeof systemInfo?.integrated_gpu === "string" && /amd|radeon/i.test(systemInfo.integrated_gpu))
  )

  return tweakNames.filter((name) => {
    // NVIDIA-specific tweak: only include if user has an NVIDIA GPU
    if (name === "optimize-nvidia-settings") {
      return isNvidia
    }

    // AMD-specific tweak: only include if user has an AMD GPU and no dedicated NVIDIA GPU
    if (name === "optimize-amd-settings") {
      return isAmd && !isNvidia
    }

    return true
  })
}

/**
 * Identifies active tweaks that belong to profile tiers higher than the target profile,
 * while ignoring optional custom tweaks that do not belong to any profile.
 *
 * @param activeTweaks Array of currently active tweak IDs
 * @param targetProfileTweaks Array of tweak IDs in the target profile
 * @param allProfileTweaks Set of all tweak IDs across all profiles
 * @returns Array of excess tweak IDs that should be unapplied
 */
export function getExcessProfileTweaks(
  activeTweaks: string[],
  targetProfileTweaks: string[],
  allProfileTweaks: Set<string>,
): string[] {
  return activeTweaks.filter((name) => allProfileTweaks.has(name) && !targetProfileTweaks.includes(name))
}

/**
 * Checks if a profile is strictly active: all its tweaks are active AND no higher-tier profile tweaks are active.
 *
 * @param activeTweaks Array of currently active tweak IDs
 * @param profileTweaks Array of tweak IDs in this profile
 * @param allProfileTweaks Set of all tweak IDs across all profiles
 * @returns True if the profile is currently active and has no excess profile tweaks
 */
export function isProfileFullyActive(
  activeTweaks: string[],
  profileTweaks: string[],
  allProfileTweaks: Set<string>,
): boolean {
  if (profileTweaks.length === 0) return false
  const allActive = profileTweaks.every((name) => activeTweaks.includes(name))
  if (!allActive) return false
  const hasExcess = activeTweaks.some((name) => allProfileTweaks.has(name) && !profileTweaks.includes(name))
  return !hasExcess
}
