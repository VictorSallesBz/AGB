export type LanguageCode = "pt" | "en"

export interface LanguageInfo {
  code: LanguageCode
  name: string
  flag: string
}

export interface TweakTranslation {
  title: string
  description: string
  modal?: string
  warning?: string
}

export interface UtilityTranslation {
  name: string
  description: string
  buttonText?: string
}

export interface CleanupTranslation {
  label: string
  description: string
}

export interface DNSProviderTranslation {
  description: string
  features?: string[]
}

export interface LocaleData {
  ui: Record<string, string>
  tweaks: Record<string, TweakTranslation>
  utilities: Record<string, UtilityTranslation>
  cleanups: Record<string, CleanupTranslation>
  dns: Record<string, DNSProviderTranslation>
}
