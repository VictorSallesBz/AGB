import RootDiv from "@/components/rootdiv"
import { useEffect, useState } from "react"
import jsonData from "../../../../package.json"
import { invoke } from "@/lib/electron"
import Button from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import Toggle from "@/components/ui/Toggle"
import { toast } from "react-toastify"
import Card from "@/components/ui/Card"
import { DonateContent } from "@/components/DonateModal"
import { FeedbackContent } from "@/components/FeedbackModal"
import useLanguageStore, { availableLanguages } from "@/store/languageStore"
import { Sun, Moon, Laptop } from "lucide-react"

const themes = [
  { key: "themeSystem", value: "system", icon: Laptop },
  { key: "themeDark", value: "dark", icon: Moon },
  { key: "themeLight", value: "light", icon: Sun },
]

function Settings() {
  const { language, setLanguage, t } = useLanguageStore()
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme")
    if (stored === "dark" || stored === "light" || stored === "system") return stored
    if (stored === "gray" || stored === "purple" || stored === "classic") {
      localStorage.setItem("theme", "dark")
      return "dark"
    }
    return "system"
  })
  const [checking, setChecking] = useState(false)
  const [trayEnabled, setTrayEnabled] = useState(true)
  const [trayLoading, setTrayLoading] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const checkForUpdates = async () => {
    try {
      setChecking(true)
      const res = await invoke({ channel: "updater:check" })
      if (res?.ok && !res.updateInfo) {
        toast.success(language === "pt" ? "Você já possui a versão mais recente." : "You're up to date")
      } else if (res?.updateInfo) {
        toast.info(`${language === "pt" ? "Atualização disponível" : "Update available"}: ${res.updateInfo.version}`)
      }
    } catch (e) {
      toast.error(String(e))
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    document.body.classList.remove("light", "dark", "purple", "gray", "classic")
    let activeTheme = theme
    if (activeTheme === "gray" || activeTheme === "purple" || activeTheme === "classic") {
      activeTheme = "dark"
    }
    if (activeTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      document.body.classList.add(systemTheme)
      document.body.setAttribute("data-theme", systemTheme)
    } else if (activeTheme) {
      document.body.classList.add(activeTheme)
      document.body.setAttribute("data-theme", activeTheme)
    } else {
      document.body.classList.add("dark")
      document.body.setAttribute("data-theme", "dark")
    }
    localStorage.setItem("theme", activeTheme || "dark")
  }, [theme])

  useEffect(() => {
    invoke({ channel: "tray:get" }).then((status) => setTrayEnabled(status))
  }, [])

  const clearCache = async () => {
    await invoke({ channel: "clear-agb-cache" })
    localStorage.removeItem("agb:systemInfo")
    localStorage.removeItem("agb:tweakInfo")
    toast.success(language === "pt" ? "Cache do AGB limpo com sucesso!" : "AGB cache cleared successfully!")
  }

  const handleToggleTray = async () => {
    setTrayLoading(true)
    const newStatus = !trayEnabled
    await invoke({ channel: "tray:set", payload: newStatus })
    setTrayEnabled(newStatus)
    setTrayLoading(false)
  }

  return (
    <>
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="bg-agb-card border border-agb-border rounded-2xl p-4 shadow-2xl max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">{t("deleteLegacyBackupsTitle")}</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              {t("deleteLegacyBackupsConfirm")}
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDeleteModalOpen(false)
                invoke({ channel: "delete-old-agb-backups" })
              }}
            >
              {t("delete")}
            </Button>
          </div>
        </div>
      </Modal>
      <RootDiv>
        <div className="w-full pb-16">
          <div className="space-y-8">
            <SettingSection title={t("appearance")}>
              <SettingCard>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-agb-text">{t("theme")}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg">
                    {themes.map((tItem) => {
                      const ThemeIcon = tItem.icon
                      const isSelected = theme === tItem.value
                      return (
                        <label
                          key={tItem.value}
                          className={`flex items-center justify-center gap-2.5 cursor-pointer p-3 rounded-xl border transition-all duration-150 active:scale-95 ${
                            isSelected
                              ? "border-agb-primary bg-agb-primary/10 text-agb-primary font-semibold shadow-xs"
                              : "border-agb-border bg-agb-card text-agb-text-secondary hover:border-agb-border-secondary hover:text-agb-text"
                          }`}
                        >
                          <input
                            type="radio"
                            name="theme"
                            value={tItem.value}
                            checked={isSelected}
                            onChange={() => setTheme(tItem.value)}
                            className="sr-only"
                          />
                          <ThemeIcon className="w-4 h-4" />
                          <span className="text-sm">{t(tItem.key)}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title={t("updates")}>
              <SettingCard>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-agb-text mb-0.5">
                      AGB Optimizer
                    </h3>
                    <p className="text-xs text-agb-text-secondary">
                      {language === "pt" ? "Verificar atualizações do aplicativo no GitHub" : "Check for application updates on GitHub"}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={checkForUpdates} disabled={checking}>
                    {checking ? (language === "pt" ? "Verificando..." : "Checking...") : t("checkForUpdates")}
                  </Button>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title={t("dataManagement")}>
              <SettingCard>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-agb-border/40">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-agb-text mb-0.5">{t("legacyBackups")}</h3>
                    <p className="text-xs text-agb-text-secondary">
                      {t("legacyBackupsDesc")}
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)}>
                    {t("deleteBackups")}
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-agb-text mb-0.5">
                      {t("clearCache")}
                    </h3>
                    <p className="text-xs text-agb-text-secondary">
                      {t("clearCacheDesc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="secondary" size="sm" onClick={clearCache}>
                      {t("clearCacheBtn")}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        await invoke({ channel: "open-log-folder" })
                      }}
                    >
                      {language === "pt" ? "Abrir Pasta de Logs" : "Open Log Folder"}
                    </Button>
                  </div>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title={language === "pt" ? "Outros" : "Other"}>
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-agb-text mb-1">
                      {language === "pt" ? "Ícone na Bandeja do Sistema (Tray)" : "Show tray icon"}
                    </h3>
                    <p className="text-sm text-agb-text-secondary">
                      {language === "pt" ? "Permite que o aplicativo continue rodando na bandeja do sistema." : "Enable or disable AGB running in the system tray."}
                      <span className="inline-flex items-center gap-1 ml-2 text-yellow-500">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                        {t("requiresRestart")}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={trayEnabled}
                      onChange={handleToggleTray}
                      disabled={trayLoading}
                    />
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        trayEnabled
                          ? "text-green-400 bg-green-400/10"
                          : "text-agb-text-secondary bg-agb-border-secondary/20"
                      }`}
                    >
                      {trayEnabled ? t("enabled") : t("disabled")}
                    </span>
                  </div>
                </div>

              </SettingCard>
            </SettingSection>

            <SettingSection title={language === "pt" ? "Apoiar o Projeto" : "Support the Project"}>
              <SettingCard>
                <DonateContent />
              </SettingCard>
            </SettingSection>

            <SettingSection title={language === "pt" ? "Bugs e Solicitações (GitHub)" : "Bugs & Feature Requests (GitHub)"}>
              <SettingCard>
                <FeedbackContent />
              </SettingCard>
            </SettingSection>

            <SettingSection title={language === "pt" ? "Sobre" : "About"}>
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-agb-text mb-1">AGB - Advanced Gaming Booster</h3>
                    <p className="text-sm text-agb-text-secondary">
                      {t("version")} {jsonData.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-agb-text-secondary">
                        © {new Date().getFullYear()} AGB — {language === "pt" ? "Desenvolvido por Victor Salles" : "Developed by Victor Salles"}
                      </p>
                    </div>
                  </div>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title={t("language")}>
              <SettingCard>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-medium text-agb-text mb-1">
                      {t("language")}
                    </h3>
                    <p className="text-sm text-agb-text-secondary">
                      {t("languageDesc")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {availableLanguages.map((langItem) => (
                      <button
                        key={langItem.code}
                        onClick={() => setLanguage(langItem.code)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 ${
                          language === langItem.code
                            ? "border-agb-primary bg-agb-primary/10 text-agb-text font-semibold shadow-sm"
                            : "border-agb-border bg-agb-card text-agb-text-secondary hover:border-agb-border-secondary hover:text-agb-text"
                        }`}
                      >
                        <span className="text-2xl" role="img" aria-label={langItem.name}>
                          {langItem.flag}
                        </span>
                        <span className="text-sm">{langItem.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </SettingCard>
            </SettingSection>
          </div>
        </div>
      </RootDiv>
    </>
  )
}
const SettingCard = ({ children, className = "" }) => (
  <Card className={`p-4.5 rounded-xl ${className}`}>{children}</Card>
)

const SettingSection = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="text-sm font-bold uppercase tracking-wider text-agb-text flex items-center gap-2">
      <span className="w-1.5 h-3.5 rounded-full bg-agb-primary inline-block"></span>
      {title}
    </h2>
    {children}
  </div>
)
export default Settings
