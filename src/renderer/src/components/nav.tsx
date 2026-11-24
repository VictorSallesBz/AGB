import { invoke } from "@/lib/electron"
import { broom } from "@lucide/lab"
import { clsx } from "clsx"
import {
  Box,
  EthernetPort,
  Folder,
  Home,
  Icon,
  RotateCw,
  Settings,
  Wrench,
  WifiOff,
  Bubbles,
  Heart,
  Bug,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import info from "../../../../package.json"
import useRestartStore from "../store/restartState"
import DiscordIcon from "./discordicon"
import GithubIcon from "./githubicon"
import DonateModal from "./DonateModal"
import FeedbackModal from "./FeedbackModal"
import Button from "./ui/button"
import Modal from "./ui/modal"
import useOnlineStore from "../store/online"
import useLanguageStore from "../store/languageStore"

const tabIcons = {
  home: <Home size={20} />,
  tweaks: <Wrench size={20} />,
  debloat: <Bubbles size={20} />,
  clean: <Icon iconNode={broom} size={20} />,
  backup: <Folder size={20} />,
  utilities: <Box size={20} />,
  dns: <EthernetPort size={20} />,
  settings: <Settings size={20} />,
}

function Nav({ collapsed }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { needsRestart } = useRestartStore()
  const { t, language } = useLanguageStore()

  const tabs = {
    home: { label: t("navHome"), path: "/" },
    tweaks: { label: t("navTweaks"), path: "/tweaks" },
    debloat: { label: t("navDebloat"), path: "/debloat" },
    utilities: { label: t("navUtilities"), path: "/utilities" },
    clean: { label: t("navCleaner"), path: "/clean" },
    backup: { label: t("navRestore"), path: "/backup" },
    dns: { label: t("navDns"), path: "/dns" },
    settings: { label: t("navSettings"), path: "/settings" },
  }

  const tabRefs = useRef<Record<string, HTMLElement | null>>({})
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 })
  const [showRestartModal, setShowRestartModal] = useState(false)
  const [showOfflineModal, setShowOfflineModal] = useState(false)
  const [hasShownOfflineModal, setHasShownOfflineModal] = useState(false)
  const [showDonateModal, setShowDonateModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const { online, checkOnline } = useOnlineStore()

  const disabledTabs = ["dns"]

  useEffect(() => {
    checkOnline()
    const interval = setInterval(checkOnline, 5000)
    return () => clearInterval(interval)
  }, [checkOnline])

  useEffect(() => {
    if (!online && !hasShownOfflineModal) {
      setShowOfflineModal(true)
      setHasShownOfflineModal(true)
    } else if (online) {
      setHasShownOfflineModal(false)
    }
  }, [online, hasShownOfflineModal])

  const getActiveTab = () => {
    const path = location.pathname
    if (path === "/") return "home"
    const match = Object.entries(tabs).find(([, { path: p }]) => p === path)
    return match ? match[0] : ""
  }

  const activeTab = getActiveTab()

  useEffect(() => {
    const updateIndicator = () => {
      const ref = tabRefs.current[activeTab]
      const container = containerRef.current
      if (ref && ref instanceof HTMLElement && container) {
        const tabRect = ref.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        setIndicatorStyle({
          top: tabRect.top - containerRect.top,
          height: tabRect.height,
        })
      }
    }
    updateIndicator()
    window.addEventListener("resize", updateIndicator)
    return () => window.removeEventListener("resize", updateIndicator)
  }, [activeTab])

  return (
    <nav
      className={`h-screen text-agb-text fixed left-0 top-0 flex flex-col py-6 z-40  transition-all duration-300 ease-in-out ${collapsed ? "w-16" : "w-52"}`}
    >
      <div className="flex-1 flex flex-col gap-2 px-3 mt-10 relative" ref={containerRef}>
        <div
          className="absolute left-0 w-1 bg-agb-primary rounded-sm transition-all duration-300"
          style={{
            top: indicatorStyle.top,
            height: indicatorStyle.height,
            transition: "top 0.2s ease, height 0.2s ease",
          }}
        />
        {Object.entries(tabs).map(([id, { label, path }]) => {
          const isDisabled = !online && disabledTabs.includes(id)
          return (
            <Button
              variant=""
              key={id}
              ref={(el) => (tabRefs.current[id] = el)}
              onClick={() => {
                if (isDisabled) {
                  setShowOfflineModal(true)
                } else {
                  navigate(path)
                }
              }}
              disabled={isDisabled}
              className={clsx(
                `flex items-center gap-3 py-2 rounded-lg transition-all duration-200 border relative ${collapsed ? "px-2 justify-center" : "px-3"}`,
                activeTab === id
                  ? "border-transparent text-agb-primary"
                  : isDisabled
                    ? "opacity-50 cursor-not-allowed text-agb-text-secondary border-transparent"
                    : "text-agb-text-secondary hover:bg-agb-border-secondary hover:text-agb-text border-transparent",
              )}
            >
              <div>{tabIcons[id]}</div>
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">{label}</span>
                </div>
              )}
            </Button>
          )
        })}
      </div>
      {needsRestart && (
        <button
          className={clsx(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 border m-3",
            "bg-agb-card text-agb-text border-agb-border-secondary hover:bg-agb-border-secondary hover:text-agb-text",
          )}
          onClick={() => setShowRestartModal(true)}
        >
          <span
            className={`flex text-center items-center gap-2 text-red-500 ${collapsed ? "justify-center" : ""}`}
            title={language === "pt" ? "Reinicie o Windows para aplicar algumas alterações" : "Restart Windows to apply some changes"}
          >
            <RotateCw size={16} /> {!collapsed && (language === "pt" ? "Reinicialização Necessária" : "Restart Required")}
          </span>
        </button>
      )}
      <Modal open={showRestartModal} onOpenChange={setShowRestartModal}>
        <div className="bg-agb-card p-4 rounded-2xl border border-agb-border text-agb-text w-[90vw] max-w-md">
          <h2 className="text-lg font-semibold mb-2">{language === "pt" ? "Confirmar Reinicialização" : "Confirm Restart"}</h2>
          <p className="text-agb-text-secondary mb-4">
            {language === "pt" ? "Tem certeza de que deseja reiniciar o computador agora?" : "Are you sure you want to restart your computer now?"}
          </p>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setShowRestartModal(false)} variant="secondary">
              {t("cancel")}
            </Button>
            <Button
              onClick={() => {
                setShowRestartModal(false)
                invoke({ channel: "restart" })
              }}
              variant="danger"
            >
              {language === "pt" ? "Reiniciar" : "Restart"}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal open={showOfflineModal} onOpenChange={setShowOfflineModal}>
        <div className="bg-agb-card p-4 rounded-2xl border border-agb-border text-agb-text w-[90vw] max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 rounded-full">
              <WifiOff className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold">
              {language === "pt" ? "Você está Offline" : "You're Offline"}
            </h2>
          </div>
          <p className="text-agb-text-secondary mb-4">
            {language === "pt"
              ? "Alguns recursos necessitam de conexão com a internet para funcionar. Os seguintes recursos foram temporariamente desativados:"
              : "Some features require an internet connection to work. The following features have been disabled:"}
          </p>
          <ul className="list-disc list-inside text-agb-text-secondary mb-4 space-y-1">
            <li>
              <span className="font-medium text-agb-text">
                {language === "pt" ? "Gerenciador de DNS" : "DNS Manager"}
              </span>{" "}
              - {language === "pt" ? "Requer internet para alterar os servidores DNS" : "Requires internet to change DNS servers"}
            </li>
            <li>
              <span className="font-medium text-agb-text">
                {language === "pt" ? "Alguns Ajustes" : "Some Tweaks"}
              </span>{" "}
              - {language === "pt" ? "Podem falhar sem internet" : "May fail without internet"}
            </li>
            <li>
              <span className="font-medium text-agb-text">
                {language === "pt" ? "Atualizações Automáticas" : "Auto Updates"}
              </span>{" "}
              - {language === "pt" ? "Falharão sem conexão com a internet" : "Will fail without internet"}
            </li>
          </ul>
          <p className="text-sm text-agb-text-secondary mb-4">
            {language === "pt"
              ? "Por favor, reconecte-se à internet para usar esses recursos."
              : "Please reconnect to the internet to use these features."}
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setShowOfflineModal(false)} variant="secondary">
              {language === "pt" ? "Entendido" : "Understood"}
            </Button>
          </div>
        </div>
      </Modal>
      <DonateModal open={showDonateModal} onClose={() => setShowDonateModal(false)} />
      <FeedbackModal open={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
      <div className="px-3 pt-3 border-t border-agb-border/50 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setShowDonateModal(true)}
          title={language === "pt" ? "Apoiar o AGB" : "Support AGB"}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-pink-500/35 bg-gradient-to-r from-pink-500/15 to-rose-500/15 hover:from-pink-500/25 hover:to-rose-500/25 text-pink-300 hover:text-pink-200 shadow-sm shadow-pink-500/10 transition-all duration-200 active:scale-95 cursor-pointer ${
            collapsed ? "px-2" : "px-3"
          }`}
        >
          <Heart size={15} className="text-pink-400 fill-pink-500/30 shrink-0" />
          {!collapsed && (
            <span className="text-xs font-semibold tracking-wide truncate">
              {language === "pt" ? "Apoiar o AGB" : "Support AGB"}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setShowFeedbackModal(true)}
          title={language === "pt" ? "Reportar Bug / Sugerir Função" : "Report Bug / Request Feature"}
          className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-xl border border-agb-border bg-agb-card/70 hover:bg-agb-accent hover:border-agb-primary/40 text-agb-text-secondary hover:text-agb-text transition-all duration-200 active:scale-95 cursor-pointer ${
            collapsed ? "px-2" : "px-3"
          }`}
        >
          <Bug size={14} className="text-agb-primary shrink-0" />
          {!collapsed && (
            <span className="text-xs font-medium tracking-wide truncate">
              {language === "pt" ? "Bugs e Sugestões" : "Bugs & Ideas"}
            </span>
          )}
        </button>
        <div
          className={`flex items-center justify-center gap-3 pt-0.5 ${collapsed ? "flex-col" : ""}`}
        >
          <a href="https://github.com/VictorSallesBz/AGB" target="_blank" rel="noreferrer" title="GitHub">
            <GithubIcon className="w-5 fill-agb-primary hover:opacity-80 transition" />
          </a>
          <a href="https://discord.gg/b3HekDzKGS" target="_blank" rel="noreferrer" title="Discord">
            <DiscordIcon className="w-5 fill-agb-primary hover:opacity-80 transition" />
          </a>
        </div>
        <p className="text-agb-primary text-center text-xs font-semibold tracking-wider">AGB v{info.version}</p>
      </div>
    </nav>
  )
}

export default Nav
