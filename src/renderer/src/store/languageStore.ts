import { create } from "zustand"
import {
  LanguageCode,
  LanguageInfo,
  availableLanguages,
  getTranslation,
  getTweakTranslation,
  translateTweakModal,
  translateTweakWarning,
  getUtilityTranslation,
  getCleanupTranslation,
  getDnsTranslation,
} from "../i18n"

export type Language = LanguageCode
export type { LanguageInfo }

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
  tTweak: (name: string, defaultTitle: string, defaultDesc: string) => { title: string; description: string }
  tUtility: (name: string, defaultName: string, defaultDesc: string, defaultBtn?: string) => { name: string; description: string; buttonText?: string }
  tCleanup: (id: string, defaultLabel: string, defaultDesc: string) => { label: string; description: string }
  tDns: (id: string, defaultDesc: string, defaultFeatures?: string[]) => { description: string; features?: string[] }
}

export { availableLanguages, translateTweakModal, translateTweakWarning }

export function translateTweakTitle(name: string, defaultTitle: string, lang: Language): string {
  return getTweakTranslation(lang, name, defaultTitle, "").title
}

export function translateTweakDesc(name: string, defaultDesc: string, lang: Language): string {
  return getTweakTranslation(lang, name, "", defaultDesc).description
}

const useLanguageStore = create<LanguageState>((set, get) => ({
  language:
    (typeof localStorage !== "undefined" &&
      (localStorage.getItem("agb:language") as Language)) ||
    "pt",

  setLanguage: (lang: Language) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("agb:language", lang)
    }
    set({ language: lang })
  },

  t: (key: string, params?: Record<string, string | number>) => {
    const lang = get().language || "pt"
    return getTranslation(lang, key, params)
  },

  tTweak: (name: string, defaultTitle: string, defaultDesc: string) => {
    const lang = get().language || "pt"
    return getTweakTranslation(lang, name, defaultTitle, defaultDesc)
  },

  tUtility: (name: string, defaultName: string, defaultDesc: string, defaultBtn?: string) => {
    const lang = get().language || "pt"
    return getUtilityTranslation(lang, name, defaultName, defaultDesc, defaultBtn)
  },

  tCleanup: (id: string, defaultLabel: string, defaultDesc: string) => {
    const lang = get().language || "pt"
    return getCleanupTranslation(lang, id, defaultLabel, defaultDesc)
  },

  tDns: (id: string, defaultDesc: string, defaultFeatures?: string[]) => {
    const lang = get().language || "pt"
    return getDnsTranslation(lang, id, defaultDesc, defaultFeatures)
  },
}))

export default useLanguageStore
