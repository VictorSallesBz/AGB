import { useState, useEffect, useMemo, useRef } from "react"
import {
  Wrench,
  Search,
  AlertTriangle,
  Monitor,
  Shield,
  Gamepad,
  Network,
  Zap,
  Paintbrush,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  CircleSlash,
  Download,
  Upload,
  FileCode,
} from "lucide-react"
import { toast } from "react-toastify"
import RootDiv from "@/components/rootdiv"
import Tooltip from "@/components/ui/tooltip"
import Modal from "@/components/ui/modal"
import { invoke } from "@/lib/electron"
import useRestartStore from "@/store/restartState"
import useSystemStore from "@/store/systemInfo"
import useLanguageStore, {
  translateTweakTitle,
  translateTweakDesc,
  translateTweakModal,
  translateTweakWarning,
} from "@/store/languageStore"
import Button from "@/components/ui/button"
import Toggle from "@/components/ui/Toggle"
import log from "electron-log/renderer"
import Card from "@/components/ui/Card"
import { Gpu, Plus, RotateCw } from "lucide-react"
import { LargeInput } from "@/components/ui/input"
import { isNewInCurrentVersion, isUpdatedInCurrentVersion, CURRENT_VERSION } from "@/lib/version"
import { Star } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Tweak } from "@/types/index"

function Tweaks() {
  const { t, language } = useLanguageStore()
  const [tweaks, setTweaks] = useState<Tweak[]>([])
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({})
  const [pendingTweaks, setPendingTweaks] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "favorites">("all")
  const [favoriteTweaks, setFavoriteTweaks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("agb:favoriteTweaks")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [detailsTweak, setDetailsTweak] = useState<Tweak | null>(null)
  const [modalContent, setModalContent] = useState<string | boolean | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTweak, setSelectedTweak] = useState<Tweak | null>(null)
  const [isNvidiaModalOpen, setIsNvidiaModalOpen] = useState(false)
  const [selectedNvidiaTweak, setSelectedNvidiaTweak] = useState<Tweak | null>(null)
  const [selectedNvidiaIndex, setSelectedNvidiaIndex] = useState<number>(-1)
  const [isAltHeld, setIsAltHeld] = useState(false)

  const { setNeedsRestart } = useRestartStore()
  const systemInfo = useSystemStore((state) => state.systemInfo)

  const isTweakCompatible = (tweak) => {
    if (!systemInfo || Object.keys(systemInfo).length === 0) {
      return { compatible: true }
    }

    if (tweak.name !== "disable-mpo" && tweak.category && tweak.category.includes("GPU")) {
      if (!systemInfo.hasGPU) {
        return {
          compatible: false,
          reason: language === "pt" ? "Requer uma GPU dedicada" : "Requires a dedicated GPU",
        }
      }
    }

    if (tweak.name === "optimize-nvidia-settings") {
      if (!systemInfo.isNvidia) {
        return {
          compatible: false,
          reason: language === "pt" ? "Requer uma GPU NVIDIA" : "Requires an NVIDIA GPU",
        }
      }
    }

    if (tweak.name === "optimize-amd-settings") {
      if (!systemInfo.isAmd) {
        return {
          compatible: false,
          reason: language === "pt" ? "Requer uma GPU AMD Radeon" : "Requires an AMD Radeon GPU",
        }
      }
    }

    return { compatible: true }
  }

  const handleStatusFilterChange = (newStatus: "all" | "active" | "inactive" | "favorites") => {
    setStatusFilter(newStatus)
    if (newStatus === "active" && activeCategory !== "All") {
      const hasActiveInCategory = tweaks.some(
        (t: any) => !!toggleStates[t.name] && t.category && t.category.includes(activeCategory),
      )
      if (!hasActiveInCategory) {
        setActiveCategory("All")
      }
    }
  }

  const toggleFavorite = (tweakName: string) => {
    setFavoriteTweaks((prev) => {
      const next = prev.includes(tweakName)
        ? prev.filter((name) => name !== tweakName)
        : [...prev, tweakName]
      localStorage.setItem("agb:favoriteTweaks", JSON.stringify(next))
      return next
    })
  }

  const handleExportProfile = () => {
    const activeList = Object.keys(toggleStates).filter((k) => toggleStates[k])
    const payload = {
      app: "AGB - Advanced Gaming Booster",
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      activeTweaks: activeList,
      favoriteTweaks,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `agb-profile-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(
      language === "pt"
        ? `Perfil exportado (${activeList.length} ajustes ativos)!`
        : `Profile exported (${activeList.length} active tweaks)!`,
    )
  }

  const handleImportProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed.activeTweaks)) {
        throw new Error(language === "pt" ? "Arquivo de perfil inválido." : "Invalid profile file.")
      }
      if (Array.isArray(parsed.favoriteTweaks)) {
        const validFavs = parsed.favoriteTweaks.filter((f: any) => typeof f === "string")
        setFavoriteTweaks(validFavs)
        localStorage.setItem("agb:favoriteTweaks", JSON.stringify(validFavs))
      }

      const targetSet = new Set<string>(parsed.activeTweaks)
      const validNames = new Set(tweaks.map((t) => t.name))
      const toApply = tweaks
        .filter((t) => targetSet.has(t.name) && !toggleStates[t.name] && t.reversible !== false)
        .map((t) => t.name)
      const toUnapply = tweaks
        .filter(
          (t) =>
            validNames.has(t.name) &&
            !targetSet.has(t.name) &&
            !!toggleStates[t.name] &&
            t.reversible !== false,
        )
        .map((t) => t.name)

      const toastId = toast.loading(
        language === "pt" ? "Importando e aplicando perfil..." : "Importing and applying profile...",
      )
      if (toUnapply.length > 0) {
        await invoke({ channel: "tweak:unapply-batch", payload: toUnapply })
      }
      if (toApply.length > 0) {
        await invoke({ channel: "tweak:apply-batch", payload: toApply })
      }
      await loadToggleStates()
      if (toApply.length > 0 || toUnapply.length > 0) {
        setNeedsRestart(true)
      }
      toast.update(toastId, {
        render:
          language === "pt"
            ? `Perfil importado! ${toApply.length} aplicado(s), ${toUnapply.length} revertido(s).`
            : `Profile imported! ${toApply.length} applied, ${toUnapply.length} reverted.`,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      })
    } catch (err: any) {
      toast.error(
        language === "pt"
          ? `Erro ao importar perfil: ${err?.message || err}`
          : `Failed to import profile: ${err?.message || err}`,
      )
    }
  }

  useEffect(() => {
    loadTweaks()
    loadToggleStates()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) setIsAltHeld(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey) setIsAltHeld(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  const loadTweaks = async () => {
    try {
      const fetchedTweaks = await invoke({
        channel: "tweaks:fetch",
      })
      setTweaks(fetchedTweaks)
    } catch (error) {
      console.error("Error fetching tweaks:", error)
      log.error("Error fetching tweaks:", error)
    }
  }

  const loadToggleStates = async () => {
    try {
      const savedStates = await invoke({
        channel: "tweak-states:load",
      })

      if (savedStates) {
        setToggleStates(JSON.parse(savedStates))
      }
    } catch (error) {
      console.error("Error loading toggle states:", error)
      log.error("Error loading toggle states:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const runTweakChange = async (tweak: Tweak, targetState: boolean, reversible = true) => {
    if (pendingTweaks[tweak.name]) return
    const previousState = !!toggleStates[tweak.name]
    const tweakTitle = translateTweakTitle(tweak.name, tweak.title || tweak.name, language)

    setPendingTweaks((prev) => ({ ...prev, [tweak.name]: true }))
    setToggleStates((prev) => ({ ...prev, [tweak.name]: targetState }))

    const loadingToastId = toast.loading(
      `${targetState ? (language === "pt" ? "Aplicando" : "Applying") : (language === "pt" ? "Desativando" : "Unapplying")} ${tweakTitle}...`,
    )

    try {
      const result = await invoke({
        channel: targetState ? "tweak:apply" : "tweak:unapply",
        payload: tweak.name,
      })
      if (result?.success === false) {
        throw new Error(
          result.error || `Failed to ${targetState ? "apply" : "unapply"} tweak: ${tweakTitle}`,
        )
      }
      if (tweak.restart) {
        setNeedsRestart(true)
      }
      toast.update(loadingToastId, {
        render: `${tweakTitle} ${
          targetState
            ? language === "pt"
              ? "aplicado com sucesso"
              : "applied"
            : language === "pt"
              ? "desativado"
              : "unapplied"
        }`,
        type: targetState ? "success" : "info",
        isLoading: false,
        autoClose: 3000,
      })
    } catch (error) {
      console.error(`Error ${targetState ? "applying" : "unapplying"} tweak ${tweakTitle}:`, error)
      log.error(`Error ${targetState ? "applying" : "unapplying"} tweak ${tweakTitle}:`, error)

      setToggleStates((prev) => ({ ...prev, [tweak.name]: previousState }))
      toast.update(loadingToastId, {
        render: `${
          reversible
            ? language === "pt"
              ? "Falha ao alterar ajuste"
              : "Failed to toggle tweak"
            : language === "pt"
              ? "Falha ao aplicar ajuste"
              : "Failed to apply tweak"
        }: ${tweakTitle}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    } finally {
      setPendingTweaks((prev) => {
        const next = { ...prev }
        delete next[tweak.name]
        return next
      })
    }
  }

  const applyTweak = async (tweak, _) => {
    await runTweakChange(tweak, !toggleStates[tweak.name], true)
  }

  const applyNonReversibleTweak = async (tweak, _) => {
    await runTweakChange(tweak, true, false)
  }

  const handleToggle = async (index) => {
    const tweak: any = tweaks[index]

    if (tweak.name === "optimize-nvidia-settings" && toggleStates[tweak.name]) {
      setSelectedNvidiaTweak(tweak)
      setSelectedNvidiaIndex(index)
      setIsNvidiaModalOpen(true)
      return
    }

    if (tweak.modal && !toggleStates[tweak.name]) {
      setSelectedTweak(tweak)
      setModalContent(tweak.modal)
      setIsModalOpen(true)
      return
    }

    await applyTweak(tweak, index)
  }

  const handleButtonClick = async (index) => {
    const tweak: Tweak = tweaks[index]

    if (tweak.modal) {
      setSelectedTweak(tweak)
      setModalContent(tweak.modal)
      setIsModalOpen(true)
      return
    }

    await applyNonReversibleTweak(tweak, index)
  }

  const forceReapplyTweak = async (tweak: Tweak) => {
    toast.dismiss()
    const tweakTitle = translateTweakTitle(tweak.name, tweak.title || tweak.name, language)
    const loadingToastId = toast.loading(
      `${language === "pt" ? "Reaplicando ajuste" : "Reapplying tweak"}: ${tweakTitle}...`,
    )

    try {
      const result = await invoke({
        channel: "tweak:apply",
        payload: tweak.name,
      })
      if (result?.success === false) {
        throw new Error(result.error || `Failed to reapply tweak: ${tweakTitle}`)
      }
      if (tweak.restart) {
        setNeedsRestart(true)
      }
      toast.update(loadingToastId, {
        render: `${tweakTitle} ${language === "pt" ? "reaplicado com sucesso" : "reapplied"}`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })
    } catch (error) {
      console.error(`Error reapplying tweak ${tweakTitle}:`, error)
      log.error(`Error reapplying tweak ${tweakTitle}:`, error)
      toast.update(loadingToastId, {
        render: `${language === "pt" ? "Falha ao reaplicar ajuste" : "Failed to reapply tweak"}: ${tweakTitle}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    }
  }


  const categories = useMemo(
    () => ["All", ...new Set(tweaks.flatMap((t: any) => t.category || []).filter(Boolean))],
    [tweaks],
  )

  const activeTweaksCount = useMemo(() => {
    return tweaks.filter((t) => !!toggleStates[t.name]).length
  }, [tweaks, toggleStates])

  const inactiveTweaksCount = useMemo(() => {
    return tweaks.length - activeTweaksCount
  }, [tweaks, activeTweaksCount])

  const filteredTweaks: any = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()
    return tweaks.filter((tweak) => {
      const isTweakActive = !!toggleStates[tweak.name]
      const isFavorite = favoriteTweaks.includes(tweak.name)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isTweakActive) ||
        (statusFilter === "inactive" && !isTweakActive) ||
        (statusFilter === "favorites" && isFavorite)

      if (!matchesStatus) return false

      const translatedTitle = translateTweakTitle(tweak.name, tweak.title || tweak.name, language).toLowerCase()
      const translatedDesc = translateTweakDesc(tweak.name, tweak.description || "", language).toLowerCase()
      const rawTitle = (tweak.title || "").toLowerCase()
      const rawDesc = (tweak.description || "").toLowerCase()
      const tweakName = (tweak.name || "").toLowerCase()

      const matchesSearch =
        !query ||
        translatedTitle.includes(query) ||
        translatedDesc.includes(query) ||
        rawTitle.includes(query) ||
        rawDesc.includes(query) ||
        tweakName.includes(query)

      const matchesCategory =
        activeCategory === "All" ||
        (Array.isArray(tweak.category) && tweak.category.includes(activeCategory)) ||
        tweak.category === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [tweaks, searchTerm, activeCategory, statusFilter, toggleStates, favoriteTweaks, language])

  // sort this so recommended tweaks are at the top
  const sortedTweaks = useMemo(() => {
    return [...filteredTweaks].sort((a, b) => {
      const aRec: any = !!a.top
      const bRec: any = !!b.top
      return bRec - aRec
    })
  }, [filteredTweaks])

  const categoryIcons = {
    Performance: <Zap className="w-4 h-4  text-yellow-500" />,
    GPU: <Gpu className="w-4 h-4 text-red-500" />,
    Privacy: <Shield className="w-4 h-4 text-green-500" />,
    Network: <Network className="w-4 h-4 text-orange-500" />,
    Appearance: <Paintbrush className="w-4 h-4 text-agb-primary" />,
    Gaming: <Gamepad className="w-4 h-4 text-teal-500" />,
    System: <Monitor className="w-4 h-4 text-cyan-500" />,
    General: <Wrench className="w-4 h-4 text-blue-500" />,
  }

  if (isLoading) {
    return (
      <RootDiv>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">{t("loadingSystemData")}</div>
        </div>
      </RootDiv>
    )
  }

  return (
    <>
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
        }}
      >
        <div className="bg-agb-card border border-agb-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4">
          <h3 className="text-xl font-semibold text-agb-text mb-3">
            {translateTweakTitle(selectedTweak?.name || "", selectedTweak?.title || "", language)}
          </h3>
          <div className="text-agb-text-secondary text-sm leading-6 max-h-64 overflow-y-auto custom-scrollbar mb-6 prose prose-green marker:text-agb-secondary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {String(translateTweakModal(selectedTweak?.name || "", (modalContent as string) || "", language))}
            </ReactMarkdown>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
              }}
            >
              {t("cancel")}
            </Button>
            {selectedTweak && (
              <Button
                onClick={async () => {
                  const target = selectedTweak
                  setIsModalOpen(false)
                  await runTweakChange(target, true, target.reversible !== false)
                }}
              >
                {t("apply")}
              </Button>
            )}
          </div>
        </div>
      </Modal>
      <Modal open={isNvidiaModalOpen} onClose={() => setIsNvidiaModalOpen(false)}>
        <div className="bg-agb-card border border-agb-border rounded-2xl p-6 shadow-2xl max-w-xl w-full mx-4">
          <div className="flex items-center gap-3.5 mb-4 pb-3.5 border-b border-agb-border">
            <div className="w-10 h-10 rounded-xl bg-agb-primary/10 text-agb-primary flex items-center justify-center shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-agb-text leading-tight">
                {t("nvidiaRestoreTitle")}
              </h3>
              <p className="text-xs text-agb-text-secondary mt-0.5">
                Painel de Controle NVIDIA • Configurações 3D
              </p>
            </div>
          </div>

          <div className="space-y-3.5 mb-5">
            <p className="text-xs text-agb-text-secondary leading-relaxed">
              {t("nvidiaRestoreDesc")}
            </p>

            <div className="bg-agb-card border border-agb-border rounded-xl p-3.5 space-y-2.5 text-xs text-agb-text">
              <div className="flex items-start gap-2.5">
                <span className="w-4.5 h-4.5 rounded-full bg-agb-primary/15 text-agb-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span className="leading-snug">{t("nvidiaRestoreStep1")}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-4.5 h-4.5 rounded-full bg-agb-primary/15 text-agb-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span className="leading-snug">{t("nvidiaRestoreStep2")}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-4.5 h-4.5 rounded-full bg-agb-primary/15 text-agb-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span className="leading-snug">{t("nvidiaRestoreStep3")}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-4.5 h-4.5 rounded-full bg-agb-primary/15 text-agb-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <span className="leading-snug">{t("nvidiaRestoreStep4")}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 bg-agb-secondary/20 border border-agb-border rounded-xl">
              <span className="text-xs text-agb-text-secondary">
                {language === "pt" ? "Acesso rápido ao painel:" : "Quick access to panel:"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await invoke({ channel: "nvidia:open-control-panel" })
                    toast.info(language === "pt" ? "Abrindo Painel NVIDIA..." : "Opening NVIDIA Control Panel...")
                  } catch {
                    toast.error(language === "pt" ? "Não foi possível abrir o Painel NVIDIA." : "Could not open NVIDIA Control Panel.")
                  }
                }}
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium whitespace-nowrap shrink-0"
              >
                <ExternalLink size={13} />
                {t("btnOpenNvidiaPanel")}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-agb-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsNvidiaModalOpen(false)}
              className="h-8.5 px-4 text-xs"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                if (selectedNvidiaTweak && selectedNvidiaIndex >= 0) {
                  setIsNvidiaModalOpen(false)
                  await applyTweak(selectedNvidiaTweak, selectedNvidiaIndex)
                }
              }}
              className="flex items-center gap-1.5 h-8.5 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 size={14} />
              {t("btnConfirmRestored")}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal open={!!detailsTweak} onClose={() => setDetailsTweak(null)}>
        {detailsTweak && (
          <div className="bg-agb-card border border-agb-border rounded-2xl p-5 shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-agb-border">
              <div>
                <h3 className="text-lg font-semibold text-agb-text">
                  {translateTweakTitle(detailsTweak.name, detailsTweak.title || detailsTweak.name, language)}
                </h3>
                <p className="text-xs text-agb-text-secondary mt-1">
                  {translateTweakDesc(detailsTweak.name, detailsTweak.description || "", language)}
                </p>
              </div>
              <span className="text-[11px] font-mono text-agb-text-muted bg-agb-accent/50 border border-agb-border px-2 py-0.5 rounded shrink-0">
                {detailsTweak.name}
              </span>
            </div>

            <div className="overflow-y-auto custom-scrollbar space-y-4 pr-1 flex-1">
              {detailsTweak.warning && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>{translateTweakWarning(detailsTweak.name, detailsTweak.warning, language)}</span>
                </div>
              )}

              {(typeof detailsTweak.modal === "string" || detailsTweak.deepDescription) && (
                <div className="text-agb-text-secondary text-sm leading-6 prose prose-green marker:text-agb-secondary max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {String(
                      translateTweakModal(
                        detailsTweak.name,
                        (typeof detailsTweak.modal === "string"
                          ? detailsTweak.modal
                          : detailsTweak.deepDescription) || "",
                        language,
                      ),
                    )}
                  </ReactMarkdown>
                </div>
              )}

              {((detailsTweak as any).psapply || detailsTweak.applyScript) && (
                <div>
                  <div className="text-xs font-semibold text-agb-text mb-1.5">
                    {language === "pt" ? "Script de Aplicação (apply.ps1):" : "Apply Script (apply.ps1):"}
                  </div>
                  <pre className="p-3 rounded-xl bg-agb-bg border border-agb-border text-[11px] font-mono text-agb-text-secondary overflow-x-auto max-h-48 whitespace-pre-wrap">
                    {(detailsTweak as any).psapply || detailsTweak.applyScript}
                  </pre>
                </div>
              )}

              {((detailsTweak as any).psunapply || detailsTweak.unapplyScript) && (
                <div>
                  <div className="text-xs font-semibold text-agb-text mb-1.5">
                    {language === "pt" ? "Script de Reversão (unapply.ps1):" : "Unapply Script (unapply.ps1):"}
                  </div>
                  <pre className="p-3 rounded-xl bg-agb-bg border border-agb-border text-[11px] font-mono text-agb-text-secondary overflow-x-auto max-h-48 whitespace-pre-wrap">
                    {(detailsTweak as any).psunapply || detailsTweak.unapplyScript}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center gap-2 pt-3 mt-3 border-t border-agb-border">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={() =>
                  window.open(
                    `https://github.com/VictorSallesBz/AGB/blob/main/README.md#${detailsTweak.name}`,
                    "_blank",
                  )
                }
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {language === "pt" ? "Abrir no Manual (GitHub)" : "Open in Manual (GitHub)"}
              </Button>
              <Button variant="primary" size="sm" onClick={() => setDetailsTweak(null)}>
                {language === "pt" ? "Fechar" : "Close"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <RootDiv>
        <div className="max-w-450 mx-auto pb-12">
          <div className="mb-4">
            <div className="space-y-4">
              <LargeInput
                icon={Search}
                placeholder={t("searchTweaksPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex p-1 bg-agb-card border border-agb-border rounded-xl shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleStatusFilterChange("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === "all"
                        ? "bg-agb-primary text-white shadow-sm font-semibold"
                        : "text-agb-text-secondary hover:text-agb-text"
                    }`}
                  >
                    {language === "pt" ? "Todos os Ajustes" : "All Tweaks"} ({tweaks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusFilterChange("active")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      statusFilter === "active"
                        ? "bg-emerald-600 text-white shadow-sm font-semibold"
                        : "text-agb-text-secondary hover:text-emerald-400"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {language === "pt" ? "Apenas Ativos" : "Active Only"} ({activeTweaksCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusFilterChange("inactive")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      statusFilter === "inactive"
                        ? "bg-slate-700 text-white shadow-sm font-semibold"
                        : "text-agb-text-secondary hover:text-slate-300"
                    }`}
                  >
                    <CircleSlash className="w-3.5 h-3.5" />
                    {language === "pt" ? "Apenas Desativados" : "Inactive Only"} ({inactiveTweaksCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusFilterChange("favorites")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      statusFilter === "favorites"
                        ? "bg-amber-500 text-white shadow-sm font-semibold"
                        : "text-agb-text-secondary hover:text-amber-400"
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${statusFilter === "favorites" ? "fill-white" : ""}`} />
                    {language === "pt" ? "Favoritos" : "Favorites"} ({favoriteTweaks.length})
                  </button>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportProfile}
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExportProfile}
                    className="px-2.5! py-1.5! text-xs flex items-center gap-1.5 h-auto"
                    title={language === "pt" ? "Salvar ajustes ativos em .json" : "Export active tweaks to .json"}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === "pt" ? "Exportar" : "Export"}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5! py-1.5! text-xs flex items-center gap-1.5 h-auto"
                    title={language === "pt" ? "Carregar perfil de ajustes .json" : "Import tweaks profile .json"}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{language === "pt" ? "Importar" : "Import"}</span>
                  </Button>
                  <p className="text-sm text-agb-text-secondary ml-2 mr-1">
                    {language === "pt"
                      ? `Exibindo ${sortedTweaks.length} de ${tweaks.length} ajustes`
                      : `Showing ${sortedTweaks.length} of ${tweaks.length} tweaks`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {categories.map((category) => {
                  const catLabel = t(`cat${category}`) || category
                  return (
                    <button
                      key={category}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95  ${
                        activeCategory === category
                          ? "bg-agb-primary text-white shadow-lg border border-agb-border"
                          : "bg-agb-card/50 text-agb-text-secondary  hover:bg-agb-border border border-agb-border-secondary"
                      }`}
                      onClick={() => setActiveCategory(category)}
                    >
                      {catLabel}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-5 items-center">
                <p className="text-sm text-agb-text-muted">
                  {t("reapplyTip")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {sortedTweaks.length > 0 ? (
              sortedTweaks.map((tweak, _) => {
                const originalIndex = tweaks.indexOf(tweak)
                const isActive = !!toggleStates[tweak.name]
                const compatibility = isTweakCompatible(tweak)

                const cardContent = (
                  <div className="p-4 sm:px-5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        {tweak.warning && (
                          <Tooltip content={translateTweakWarning(tweak.name, tweak.warning, language)} delay={0.3} side="bottom">
                            <div className="p-1 dark:bg-red-900/50 bg-red-300 rounded-md hover:bg-red-800 dark:hover:bg-red-900/80 transition-colors shrink-0">
                              <AlertTriangle className="w-3.5 h-3.5 dark:text-red-400 text-red-600 hover:text-white" />
                            </div>
                          </Tooltip>
                        )}
                        {tweak.recommended && (
                          <Tooltip
                            content={language === "pt" ? "Ajuste Recomendado" : "Recommended Tweak"}
                            delay={0.3}
                            side="bottom"
                          >
                            <div className="p-1 bg-green-500/50 rounded-md hover:bg-green-500/80 transition-colors shrink-0">
                              <Star className="w-3.5 h-3.5 text-white fill-white" />
                            </div>
                          </Tooltip>
                        )}
                        {tweak.addedversion &&
                          isNewInCurrentVersion(tweak.addedversion, CURRENT_VERSION) && (
                            <Tooltip
                              content={language === "pt" ? `Novo no AGB ${tweak.addedversion}` : `New in AGB ${tweak.addedversion}`}
                              delay={0.3}
                              side="bottom"
                            >
                              <div className="p-1 bg-pink-500/50 rounded-md hover:bg-pink-500/80 transition-colors shrink-0">
                                <Plus className="w-3.5 h-3.5 text-white" />
                              </div>
                            </Tooltip>
                          )}
                        {tweak.updatedversion &&
                          isUpdatedInCurrentVersion(tweak.updatedversion, CURRENT_VERSION) && (
                            <Tooltip
                              content={language === "pt" ? `Atualizado no AGB ${tweak.updatedversion}` : `Updated in AGB ${tweak.updatedversion}`}
                              delay={0.3}
                              side="bottom"
                            >
                              <div className="p-1 bg-blue-500/50 rounded-md hover:bg-blue-500/80 transition-colors shrink-0">
                                <RotateCw className="w-3.5 h-3.5 text-white" />
                              </div>
                            </Tooltip>
                          )}
                        {(Array.isArray(tweak.category)
                          ? tweak.category
                          : [tweak.category]
                        ).map((cat) => {
                          const translatedCat = t(`cat${cat}`) || cat
                          return (
                            <Tooltip
                              key={cat}
                              content={language === "pt" ? `Otimização de ${translatedCat}` : `${translatedCat} Optimization`}
                              delay={0.3}
                              side="bottom"
                            >
                              <div className="p-1 bg-agb-accent rounded-md hover:bg-agb-bg transition-colors text-agb-text shrink-0">
                                {categoryIcons[cat] || categoryIcons["General"]}
                              </div>
                            </Tooltip>
                          )
                        })}
                        {tweak.risk && (
                          <Tooltip
                            content={tweak.risk === "safe" ? (language === "pt" ? "Seguro de usar" : "Safe to use") : (language === "pt" ? "Usar com cuidado" : "Use with caution")}
                            delay={0.3}
                            side="bottom"
                          >
                            <div className="px-2 py-0.5 bg-agb-accent rounded-md hover:bg-agb-bg transition-colors text-agb-text flex items-center gap-1 shrink-0">
                              {tweak.risk === "safe" && (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                  <span className="text-[11px] font-medium whitespace-nowrap">{t("safe")}</span>
                                </>
                              )}
                              {tweak.risk === "risky" && (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  <span className="text-[11px] font-medium whitespace-nowrap">{t("risky")}</span>
                                </>
                              )}
                              {tweak.risk === "caution" && (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                                  <span className="text-[11px] font-medium whitespace-nowrap">{t("caution")}</span>
                                </>
                              )}
                            </div>
                          </Tooltip>
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-agb-text text-base leading-snug">
                          {translateTweakTitle(tweak.name, tweak.title, language)}
                        </h3>
                        <p className="text-agb-text-secondary text-sm leading-relaxed mt-1">
                          {translateTweakDesc(tweak.name, tweak.description, language)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      {isActive && isAltHeld && tweak.reversible !== false && (
                        <Button
                          variant="primary"
                          className="px-2.5! py-1! text-xs flex items-center gap-1.5 h-auto animate-pulse"
                          title={language === "pt" ? "Forçar reaplicação do ajuste" : "Force reapply tweak"}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            forceReapplyTweak(tweak)
                          }}
                        >
                          <RotateCw className="w-3 h-3" /> {t("badgeReapply")}
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleFavorite(tweak.name)
                        }}
                        title={
                          favoriteTweaks.includes(tweak.name)
                            ? language === "pt"
                              ? "Remover dos Favoritos"
                              : "Remove from Favorites"
                            : language === "pt"
                              ? "Adicionar aos Favoritos"
                              : "Add to Favorites"
                        }
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          favoriteTweaks.includes(tweak.name)
                            ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                            : "border-agb-border bg-agb-accent/40 text-agb-text-muted hover:text-amber-400"
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${favoriteTweaks.includes(tweak.name) ? "fill-amber-400" : ""}`} />
                      </button>

                      <Button
                        variant="secondary"
                        className="px-2.5! py-1! text-xs flex items-center gap-1.5 h-auto text-agb-text-secondary hover:text-agb-text"
                        title={
                          language === "pt"
                            ? "Abrir explicação detalhada deste ajuste no Manual do GitHub"
                            : "Open detailed explanation of this tweak in the GitHub Manual"
                        }
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          window.open(
                            `https://github.com/VictorSallesBz/AGB/blob/main/README.md#${tweak.name}`,
                            "_blank",
                          )
                        }}
                      >
                        <ExternalLink className="w-3 h-3" /> {t("badgeDocs")}
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-2! py-1! text-xs flex items-center gap-1 h-auto text-agb-text-secondary hover:text-agb-text"
                        title={language === "pt" ? "Ver Detalhes e Scripts PowerShell" : "View Details & PowerShell Scripts"}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setDetailsTweak(tweak)
                        }}
                      >
                        <FileCode className="w-3 h-3" />
                      </Button>

                      {!compatibility.compatible && (
                        <Tooltip content={compatibility.reason} delay={0.3} side="left">
                          <div className="p-1.5 bg-orange-500/50 rounded-lg hover:bg-orange-500/80 transition-colors">
                            <Monitor className="w-4 h-4 text-orange-300" />
                          </div>
                        </Tooltip>
                      )}

                      {tweak.reversible == null || tweak.reversible == true ? (
                        <Tooltip
                          content={!compatibility.compatible ? compatibility.reason : null}
                          side="left"
                        >
                          <Toggle
                            checked={isActive}
                            onChange={() => handleToggle(originalIndex)}
                            disabled={!compatibility.compatible || !!pendingTweaks[tweak.name]}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip
                          content={!compatibility.compatible ? compatibility.reason : null}
                          side="left"
                        >
                          <Button
                            onClick={() => handleButtonClick(originalIndex)}
                            disabled={!compatibility.compatible || !!pendingTweaks[tweak.name]}
                            className="px-3! py-1! text-xs font-medium h-auto leading-none"
                          >
                            {t("badgeApply")}
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                )

                return tweak.name === "debloat-windows" ? (
                  <div
                    key={originalIndex}
                    className="animate-border-spin rounded-xl p-[1px] w-full"
                    style={{
                      background:
                        "conic-gradient(from var(--angle), #3b82f6, #22c55e, #eab308, #f97316, #ec4899, #8b5cf6, #3b82f6)",
                    }}
                  >
                    <Card className="border-0 p-0 w-full bg-agb-card">{cardContent}</Card>
                  </div>
                ) : (
                  <Card
                    key={originalIndex}
                    className={`p-0 w-full transition-all duration-200 ${
                      isActive ? "border-agb-primary/50 bg-agb-card/90" : "hover:border-agb-border"
                    }`}
                  >
                    {cardContent}
                  </Card>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-agb-card p-6 rounded-2xl mb-4">
                  <Search className="w-10 h-10 text-agb-text-secondary" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-agb-text">
                  {isLoading ? t("loading") : (language === "pt" ? "Nenhum ajuste encontrado" : "No tweaks found")}
                </h3>
                <p className="text-agb-text-secondary">
                  {language === "pt" ? "Tente ajustar sua pesquisa ou filtros." : "Try adjusting your search or filters."}
                </p>
                {activeCategory !== "All" && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveCategory("All")}
                      className="mx-auto flex items-center gap-2"
                    >
                      {language === "pt" ? "Limpar filtro de categoria (Ver Todos)" : "Clear category filter (Show All)"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </RootDiv>
    </>
  )
}

export default Tweaks
