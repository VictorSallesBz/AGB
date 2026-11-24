import { LanguageCode, LanguageInfo, LocaleData } from "./types"
import { en } from "./locales/en"
import { pt } from "./locales/pt"

export * from "./types"

/**
 * All registered locales. To add a new language, create a new file in ./locales/
 * and register it here.
 */
export const locales: Record<LanguageCode, LocaleData> = {
  pt,
  en,
}

export const availableLanguages: LanguageInfo[] = [
  { code: "pt", name: "Português (BR)", flag: "🇧🇷" },
  { code: "en", name: "English (US)", flag: "🇺🇸" },
]

export function getTranslation(
  lang: LanguageCode,
  key: string,
  params?: Record<string, string | number>,
): string {
  const currentLocale = locales[lang] || locales.pt
  let text = currentLocale.ui[key] || locales.pt.ui[key] || locales.en.ui[key] || key

  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal))
    })
  }

  return text
}

export function getTweakTranslation(
  lang: LanguageCode,
  name: string,
  defaultTitle: string,
  defaultDesc: string,
): { title: string; description: string } {
  const currentLocale = locales[lang] || locales.pt
  let tweak = currentLocale.tweaks[name] || locales.pt.tweaks[name] || locales.en.tweaks[name]

  if (!tweak && name) {
    const normalizedName = name.toLowerCase().replace(/_/g, "-")
    tweak =
      currentLocale.tweaks[normalizedName] ||
      locales.pt.tweaks[normalizedName] ||
      locales.en.tweaks[normalizedName]
  }

  if (tweak) {
    return {
      title: tweak.title,
      description: tweak.description,
    }
  }

  return {
    title: defaultTitle,
    description: defaultDesc,
  }
}

export function translateTweakModal(
  name: string,
  defaultModal: string | undefined,
  lang: LanguageCode,
): string {
  if (!defaultModal) return ""
  const currentLocale = locales[lang] || locales.pt
  let tweak = currentLocale.tweaks[name] || locales.pt.tweaks[name] || locales.en.tweaks[name]

  if (!tweak && name) {
    const normalizedName = name.toLowerCase().replace(/_/g, "-")
    tweak =
      currentLocale.tweaks[normalizedName] ||
      locales.pt.tweaks[normalizedName] ||
      locales.en.tweaks[normalizedName]
  }

  return tweak?.modal || defaultModal
}

export function translateTweakWarning(
  name: string,
  defaultWarning: string | undefined,
  lang: LanguageCode,
): string {
  if (!defaultWarning) return ""
  const currentLocale = locales[lang] || locales.pt
  let tweak = currentLocale.tweaks[name] || locales.pt.tweaks[name] || locales.en.tweaks[name]

  if (!tweak && name) {
    const normalizedName = name.toLowerCase().replace(/_/g, "-")
    tweak =
      currentLocale.tweaks[normalizedName] ||
      locales.pt.tweaks[normalizedName] ||
      locales.en.tweaks[normalizedName]
  }

  return tweak?.warning || defaultWarning
}

export function getUtilityTranslation(
  lang: LanguageCode,
  name: string,
  defaultName: string,
  defaultDesc: string,
  defaultBtn?: string,
): { name: string; description: string; buttonText?: string } {
  const currentLocale = locales[lang] || locales.pt
  const util = currentLocale.utilities[name] || locales.pt.utilities[name] || locales.en.utilities[name]

  if (util) {
    return {
      name: util.name,
      description: util.description,
      buttonText: util.buttonText || defaultBtn,
    }
  }

  return {
    name: defaultName,
    description: defaultDesc,
    buttonText: defaultBtn,
  }
}

export function getCleanupTranslation(
  lang: LanguageCode,
  id: string,
  defaultLabel: string,
  defaultDesc: string,
): { label: string; description: string } {
  const currentLocale = locales[lang] || locales.pt
  const cleanup = currentLocale.cleanups[id] || locales.pt.cleanups[id] || locales.en.cleanups[id]

  if (cleanup) {
    return {
      label: cleanup.label,
      description: cleanup.description,
    }
  }

  return {
    label: defaultLabel,
    description: defaultDesc,
  }
}

export function getDnsTranslation(
  lang: LanguageCode,
  id: string,
  defaultDesc: string,
  defaultFeatures?: string[],
): { description: string; features?: string[] } {
  const currentLocale = locales[lang] || locales.pt
  const dnsItem = currentLocale.dns[id] || locales.pt.dns[id] || locales.en.dns[id]

  if (dnsItem) {
    return {
      description: dnsItem.description,
      features: dnsItem.features || defaultFeatures,
    }
  }

  return {
    description: defaultDesc,
    features: defaultFeatures,
  }
}
