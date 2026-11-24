import { useState, useEffect } from "react"
import RootDiv from "@/components/rootdiv"
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Gpu,
  MonitorCog,
  Wrench,
  Zap,
  Check,
  RotateCw,
  Shield,
  Flame,
  CheckCircle2,
  CircleSlash,
  ChevronRight,
  X,
  Eye,
  Gamepad2,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import InfoCard from "@/components/infocard"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import { invoke } from "@/lib/electron"
import useSystemStore from "@/store/systemInfo"
import useRestartStore from "@/store/restartState"
import log from "electron-log/renderer"
import Greeting from "@/components/greeting"
import useLanguageStore, {
  translateTweakTitle,
  translateTweakDesc,
  translateTweakWarning,
} from "@/store/languageStore"
import { toast } from "react-toastify"
import { getFilteredProfileTweaks } from "@/lib/profileUtils"

const PROFILES = [
  {
    id: "light",
    titlePt: "Perfil Leve",
    titleEn: "Light Profile",
    badgePt: "Básico & Seguro",
    badgeEn: "Basic & Safe",
    descPt: "Telemetria, updates P2P, Edge, precisão 1:1 do mouse e Modo de Jogo sem mexer na aparência.",
    descEn: "Telemetry removal, P2P update off, Edge cleanup, 1:1 mouse precision, and Game Mode with zero visual risk.",
    icon: Shield,
    badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    btnClass: "bg-emerald-600 hover:bg-emerald-500 text-white",
    tweaks: [
      "disable-telemetry",
      "disable-location-tracking",
      "consumer-features",
      "disable-delivery-optimization",
      "disable-edge-pre-launching",
      "remove-ms-bing-integration",
      "enable-game-mode",
      "disable-mouse-acceleration",
      "enable-end-task-right-click",
    ],
  },
  {
    id: "moderate",
    titlePt: "Perfil Recomendado",
    titleEn: "Recommended Profile",
    badgePt: "Recomendado (CS2)",
    badgeEn: "Recommended (CS2)",
    descPt: "O melhor equilíbrio para jogos competitivos: sem MPO, sem suspensão USB, rede limpa, NTFS, boot limpo e plano gamer.",
    descEn: "Best balance for competitive gaming: MPO off, USB suspend off, clean network, NTFS, Fast Startup off, and gamer power plan.",
    icon: Zap,
    badgeClass: "bg-agb-primary/20 text-agb-primary border-agb-primary/30",
    btnClass: "bg-agb-primary hover:bg-agb-primary/90 text-white",
    tweaks: [
      "disable-telemetry",
      "disable-location-tracking",
      "consumer-features",
      "disable-delivery-optimization",
      "disable-edge-pre-launching",
      "remove-ms-bing-integration",
      "enable-game-mode",
      "disable-mouse-acceleration",
      "enable-end-task-right-click",
      "agb-power-plan",
      "optimize-network-settings",
      "optimize-input-lag",
      "disable-mpo",
      "disable-usb-selective-suspend",
      "disable-fast-startup",
      "optimize-ntfs",
      "set-win32-priority-separation",
      "enable-optimization-for-windowed-games",
    ],
  },
  {
    id: "aggressive",
    titlePt: "Perfil Agressivo",
    titleEn: "Aggressive Profile",
    badgePt: "Máxima Performance",
    badgeEn: "Max Performance",
    descPt: "Máxima performance mantendo compatibilidade com FACEIT/GamersClub/Vanguard e CPUs Ryzen X3D.",
    descEn: "Maximum performance while preserving FACEIT/GamersClub/Vanguard anti-cheat and Ryzen X3D compatibility.",
    icon: Flame,
    badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    btnClass: "bg-purple-600 hover:bg-purple-500 text-white",
    tweaks: [
      "disable-telemetry",
      "disable-location-tracking",
      "consumer-features",
      "disable-delivery-optimization",
      "disable-edge-pre-launching",
      "remove-ms-bing-integration",
      "enable-game-mode",
      "disable-mouse-acceleration",
      "enable-end-task-right-click",
      "agb-power-plan",
      "optimize-network-settings",
      "optimize-input-lag",
      "disable-mpo",
      "disable-usb-selective-suspend",
      "disable-fast-startup",
      "optimize-ntfs",
      "set-win32-priority-separation",
      "enable-optimization-for-windowed-games",
      "set-services-to-manual",
      "disable-background-ms-store-apps",
      "disable-copilot",
      "disable-windows-recall",
      "enable-hags",
      "optimize-nvidia-settings",
      "optimize-amd-settings",
      "optimize-discord",
      "keyboard-repeat-rate",
      "prefer-ipv4-over-ipv6",
      "menu-show-delay-zero",
    ],
  },
]

const ALL_PROFILE_TWEAKS = new Set(PROFILES.flatMap((p) => p.tweaks))

function Home() {
  const { t, language } = useLanguageStore()
  const { setNeedsRestart } = useRestartStore()
  const systemInfo = useSystemStore((state) => state.systemInfo)
  const setSystemInfo = useSystemStore((state) => state.setSystemInfo)
  const [tweakInfo, setTweakInfo] = useState(() => {
    try {
      const cached = localStorage.getItem("agb:tweakInfo") || localStorage.getItem("agb:tweakInfo")
      return cached ? JSON.parse(cached) : null
    } catch (err) {
      console.error("Failed to parse tweakInfo cache", err)
      return null
    }
  })
  const [loading, setLoading] = useState(true)
  const [usingCache, setUsingCache] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [selectedProfileModal, setSelectedProfileModal] = useState<(typeof PROFILES)[0] | null>(null)
  const [profileModalFilter, setProfileModalFilter] = useState<"all" | "active" | "inactive">("all")
  const [activeTweaks, setActiveTweaks] = useState(() => {
    try {
      const cached = localStorage.getItem("agb:activeTweaks") || localStorage.getItem("agb:activeTweaks")
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })

  const fetchActiveTweaks = async () => {
    try {
      const active = await invoke({ channel: "tweak:active" })
      setActiveTweaks(active)
      localStorage.setItem("agb:activeTweaks", JSON.stringify(active))
    } catch (err) {
      console.error("Failed to fetch active tweaks:", err)
    }
  }

  useEffect(() => {
    const idleHandle = requestIdleCallback(() => {
      const cached = localStorage.getItem("agb:systemInfo") || localStorage.getItem("agb:systemInfo")
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          setSystemInfo(parsed)
          setUsingCache(true)
          setLoading(false)
        } catch (err) {
          console.warn("Failed to parse systemInfo cache", err)
        }
      }

      invoke({ channel: "get-system-info" })
        .then((info) => {
          useSystemStore.setState((state) => {
            const merged = { ...state.systemInfo, ...info }
            localStorage.setItem("agb:systemInfo", JSON.stringify(merged))
            return { systemInfo: merged }
          })
          setUsingCache(false)
          log.info("Fetched system info")
        })
        .catch((err) => {
          log.error("Error fetching system info:", err)
          console.error("Error fetching system info:", err)
        })
        .finally(() => setLoading(false))
    })

    return () => cancelIdleCallback(idleHandle)
  }, [])

  useEffect(() => {
    const idleHandle = requestIdleCallback(() => {
      const cached = localStorage.getItem("agb:tweakInfo") || localStorage.getItem("agb:tweakInfo")
      if (cached) {
        try {
          setTweakInfo(JSON.parse(cached))
        } catch (err) {
          console.error("Failed to parse tweakInfo cache", err)
        }
      }

      invoke({ channel: "tweaks:fetch" })
        .then((tweaks) => {
          setTweakInfo(tweaks)
          localStorage.setItem("agb:tweakInfo", JSON.stringify(tweaks))
        })
        .catch((err) => {
          console.error("Error fetching tweak info:", err)
        })
    })

    return () => cancelIdleCallback(idleHandle)
  }, [])

  useEffect(() => {
    fetchActiveTweaks()
  }, [])

  useEffect(() => {
    const handleExtraInfo = (_event: any, extra: Record<string, any>) => {
      useSystemStore.setState((state) => {
        const merged = { ...state.systemInfo, ...extra }
        localStorage.setItem("agb:systemInfo", JSON.stringify(merged))
        return { systemInfo: merged }
      })
    }

    window.electron.ipcRenderer.on("system-info-extra", handleExtraInfo)
    return () => {
      window.electron.ipcRenderer.removeListener("system-info-extra", handleExtraInfo)
    }
  }, [])

  const [metrics, setMetrics] = useState<any>(null)
  const [gameModeActive, setGameModeActive] = useState<boolean>(() => localStorage.getItem("agb_game_mode") === "true")

  useEffect(() => {
    let isMounted = true
    if (gameModeActive) {
      // Telemetry paused during Game Mode to prioritize CPU/RAM for games
      return
    }

    const fetchMetrics = async () => {
      try {
        const data = await invoke({ channel: "get-system-metrics" })
        if (isMounted && data) {
          setMetrics(data)
        }
      } catch (err) {
        console.error("Failed to fetch metrics:", err)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 2500)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [gameModeActive])

  const handleToggleGameMode = async () => {
    const nextState = !gameModeActive
    setGameModeActive(nextState)
    localStorage.setItem("agb_game_mode", String(nextState))

    if (nextState) {
      try {
        await invoke({ channel: "activate-game-mode" })
        toast.success(t("gameModeActivatedToast"))
      } catch (err) {
        console.error("Failed to activate game mode:", err)
        toast.success(t("gameModeActivatedToast"))
      }
    } else {
      try {
        await invoke({ channel: "deactivate-game-mode" })
      } catch (err) {
        console.error("Failed to deactivate game mode:", err)
      }
      toast.info(t("gameModeDeactivatedToast"))
    }
  }

  const handleApplyProfile = async (profile: (typeof PROFILES)[0]) => {
    toast.dismiss()
    setIsOptimizing(true)
    const title = language === "pt" ? profile.titlePt : profile.titleEn
    const toastId = toast.loading(
      language === "pt" ? `Aplicando ${title}...` : `Applying ${title}...`,
    )

    try {
      const currentSysInfo = useSystemStore.getState().systemInfo || systemInfo
      const profileTweaks = getFilteredProfileTweaks(profile.tweaks, currentSysInfo)

      // 1. Identify excess profile tweaks that are active but not part of target profile
      // Non-profile optional tweaks are NOT in ALL_PROFILE_TWEAKS, so they are kept intact
      const tweaksToUnapply = activeTweaks.filter((name) => {
        if (!ALL_PROFILE_TWEAKS.has(name)) return false
        if (profileTweaks.includes(name)) return false
        const meta = tweakInfo?.find((t: any) => t.name === name || t.id === name)
        return meta?.reversible !== false
      })

      // 2. Identify target profile tweaks that need to be applied
      const tweaksToApply = profileTweaks.filter((name) => !activeTweaks.includes(name))

      let appliedCount = 0
      let unappliedCount = 0
      const failedTweaks: Array<{ name: string; error?: string }> = []

      if (tweaksToUnapply.length > 0) {
        const unapplyOutcomes: Record<string, { success: boolean; error?: string }> =
          (await invoke({ channel: "tweak:unapply-batch", payload: tweaksToUnapply })) || {}
        unappliedCount = Object.values(unapplyOutcomes).filter((o) => o?.success).length
      }

      if (tweaksToApply.length > 0) {
        const applyOutcomes: Record<string, { success: boolean; error?: string }> =
          (await invoke({ channel: "tweak:apply-batch", payload: tweaksToApply })) || {}
        for (const [name, outcome] of Object.entries(applyOutcomes)) {
          if (outcome?.success) {
            appliedCount++
          } else {
            failedTweaks.push({ name, error: outcome?.error })
          }
        }
      }

      await fetchActiveTweaks()
      setNeedsRestart(true)

      if (failedTweaks.length > 0) {
        const failedList = failedTweaks
          .map((f) => (f.error ? `${f.name} (${f.error})` : f.name))
          .join(", ")
        toast.update(toastId, {
          render:
            language === "pt"
              ? `${title}: ${appliedCount} aplicado(s), mas ${failedTweaks.length} falhou(aram): ${failedList}`
              : `${title}: ${appliedCount} applied, but ${failedTweaks.length} failed: ${failedList}`,
          type: "warning",
          isLoading: false,
          autoClose: 6000,
        })
        return
      }

      let message = ""
      if (language === "pt") {
        if (appliedCount > 0 && unappliedCount > 0) {
          message = `${title} aplicado! ${appliedCount} novo(s) ajuste(s) aplicado(s) e ${unappliedCount} excedente(s) desativado(s).`
        } else if (unappliedCount > 0) {
          message = `${title} aplicado! ${unappliedCount} ajuste(s) excedente(s) do perfil anterior desativado(s).`
        } else if (appliedCount > 0) {
          message = `${title} aplicado! ${appliedCount} novos ajustes aplicados.`
        } else {
          message = `Todos os ajustes do ${title} já estão configurados.`
        }
      } else {
        if (appliedCount > 0 && unappliedCount > 0) {
          message = `${title} applied! ${appliedCount} tweak(s) applied and ${unappliedCount} excess tweak(s) removed.`
        } else if (unappliedCount > 0) {
          message = `${title} applied! ${unappliedCount} excess tweak(s) removed.`
        } else if (appliedCount > 0) {
          message = `${title} applied! ${appliedCount} new tweaks applied.`
        } else {
          message = `All tweaks in ${title} are already active.`
        }
      }

      toast.update(toastId, {
        render: message,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      })
    } catch (error: any) {
      toast.update(toastId, {
        render:
          language === "pt"
            ? `Falha na otimização: ${error?.message || error}`
            : `Optimization failed: ${error?.message || error}`,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return "0 GB"
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB"
  }

  const formatSpeed = (bytesPerSec?: number) => {
    if (!bytesPerSec || bytesPerSec <= 0) return "0 KB/s"
    if (bytesPerSec < 1024 * 1024) {
      return `${Math.round(bytesPerSec / 1024)} KB/s`
    }
    return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`
  }

  if (loading) {
    return (
      <RootDiv>
        <div className="flex items-center justify-center h-64 flex-col gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-[3px] border-agb-border rounded-full"></div>
            <div
              className="absolute inset-0 border-[3px] border-transparent border-t-agb-primary rounded-full animate-spin"
              role="status"
              aria-label="loading"
            ></div>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-agb-text-dark font-medium">{t("loadingSystemData")}</p>
            <p className="text-agb-text-muted text-sm">
              {t("loadingSystemDataDesc")}
            </p>
          </div>
        </div>
      </RootDiv>
    )
  }

  return (
    <RootDiv>
      <div className="max-w-[1800px] mx-auto pb-8">
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <Greeting />
            <p className="text-xs text-agb-text-secondary -mt-3">
              {language === "pt" ? "Painel de controle e monitoramento em tempo real" : "Control panel and real-time monitoring"}
            </p>
          </div>

          {/* Game Booster Header Widget */}
          <div
            className={`p-3 px-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 shadow-sm ${gameModeActive
              ? "bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-agb-primary/10 border-emerald-500/40 shadow-md shadow-emerald-500/10"
              : "bg-agb-card border-agb-border hover:border-agb-border/80"
              }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 transition-all ${gameModeActive
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                  : "bg-agb-muted text-agb-muted-foreground"
                  }`}
              >
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-agb-text text-sm">
                    {t("gameModeTitle")}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${gameModeActive
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                      : "bg-agb-muted text-agb-muted-foreground border border-agb-border"
                      }`}
                  >
                    {gameModeActive ? t("gameModeActive") : t("gameModeInactive")}
                  </span>
                </div>
                <p className="text-[11px] text-agb-muted-foreground">
                  {gameModeActive ? t("gameModeTelemetryPaused") : t("gameModeDesc")}
                </p>
              </div>
            </div>
            <Button
              onClick={handleToggleGameMode}
              variant={gameModeActive ? "secondary" : "primary"}
              className={`shrink-0 px-3.5 py-1.5 font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all ${gameModeActive
                ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 shadow-none"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{gameModeActive ? t("gameModeDeactivate") : t("gameModeActivate")}</span>
            </Button>
          </div>
        </div>

        {/* Perfis de Otimização Rápida */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-agb-primary" />
            <h3 className="text-lg font-semibold text-agb-text">
              {language === "pt" ? "Perfis de Otimização do Computador" : "PC Optimization Profiles"}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PROFILES.map((profile) => {
              const ProfileIcon = profile.icon
              const profileTweaks = getFilteredProfileTweaks(profile.tweaks, systemInfo)
              const activeCount = profileTweaks.filter((name) => activeTweaks.includes(name)).length
              const totalCount = profileTweaks.length
              const hasExcessProfileTweaks = activeTweaks.some(
                (name) => ALL_PROFILE_TWEAKS.has(name) && !profileTweaks.includes(name),
              )
              const isCurrentProfile = totalCount > 0 && activeCount === totalCount && !hasExcessProfileTweaks
              const title = language === "pt" ? profile.titlePt : profile.titleEn
              const desc = language === "pt" ? profile.descPt : profile.descEn
              const badge = language === "pt" ? profile.badgePt : profile.badgeEn

              return (
                <Card
                  key={profile.id}
                  onClick={() => {
                    setSelectedProfileModal(profile)
                    setProfileModalFilter("all")
                  }}
                  className="p-5 flex flex-col justify-between bg-agb-card border border-agb-border hover:border-agb-primary/60 hover:shadow-lg transition-all duration-200 rounded-2xl shadow-sm relative overflow-hidden cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-agb-primary/10 text-agb-primary group-hover:scale-105 transition-transform">
                          <ProfileIcon className="w-5 h-5" />
                        </div>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${profile.badgeClass}`}>
                          {badge}
                        </span>
                      </div>
                      {isCurrentProfile && (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          {language === "pt" ? "Ativo" : "Active"}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-semibold text-agb-text mb-1 group-hover:text-agb-primary transition-colors">
                      {title}
                    </h4>
                    <p className="text-xs text-agb-text-secondary leading-relaxed mb-3">
                      {desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-agb-border/50 flex items-center justify-between mt-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-agb-text-muted">
                        {language === "pt"
                          ? `${activeCount} de ${totalCount} ajustes ativos`
                          : `${activeCount} of ${totalCount} tweaks active`}
                      </span>
                      <span className="text-[11px] text-agb-primary flex items-center gap-0.5 group-hover:underline mt-0.5 font-medium">
                        <Eye className="w-3 h-3" />
                        {language === "pt" ? "Ver ajustes" : "View tweaks"}
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApplyProfile(profile)
                      }}
                      disabled={isOptimizing || isCurrentProfile}
                      variant="primary"
                      className={`text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 ${profile.btnClass}`}
                    >
                      {isOptimizing ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{language === "pt" ? "Otimizando..." : "Optimizing..."}</span>
                        </>
                      ) : isCurrentProfile ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === "pt" ? "Aplicado" : "Applied"}</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>
                            {hasExcessProfileTweaks && activeCount === totalCount
                              ? language === "pt"
                                ? "Mudar Perfil"
                                : "Switch Profile"
                              : language === "pt"
                                ? "Aplicar Perfil"
                                : "Apply Profile"}
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard
            icon={Cpu}
            iconBgColor="bg-blue-500/10"
            iconColor="text-blue-500"
            title={t("cpuTitle")}
            subtitle={t("cpuSubtitle")}
            items={[
              { label: t("model"), value: systemInfo?.cpu_model || (language === "pt" ? "Desconhecido" : "Unknown") },
              {
                label: t("cores"),
                value: `${systemInfo?.cpu_cores || "0"} ${language === "pt" ? "Núcleos" : "Cores"}`,
              },
              { label: t("threads"), value: `${systemInfo?.cpu_threads || "0"} Threads` },
              {
                label: t("usage"),
                value:
                  metrics?.cpu_usage !== undefined ? (
                    <span className="text-agb-primary font-semibold">
                      {metrics.cpu_usage}%
                    </span>
                  ) : (
                    t("loading")
                  ),
              },
              {
                label: t("temperature"),
                value:
                  metrics?.cpu_temp !== undefined && metrics?.cpu_temp !== null ? (
                    <span className="text-emerald-400 font-semibold">{metrics.cpu_temp} °C</span>
                  ) : (
                    "N/A"
                  ),
              },
            ]}
          />

          <InfoCard
            icon={Gpu}
            iconBgColor="bg-teal-500/10"
            iconColor="text-teal-500"
            title={t("gpuTitle")}
            subtitle={t("gpuSubtitle")}
            items={
              systemInfo?.hasGPU
                ? [
                  { label: t("model"), value: systemInfo?.gpu_model || t("loading") },
                  { label: t("vram"), value: systemInfo?.vram || t("loading") },
                  {
                    label: t("usage"),
                    value:
                      metrics?.gpu_usage !== undefined && metrics?.gpu_usage !== null ? (
                        <span className="text-agb-primary font-semibold">
                          {metrics.gpu_usage}%
                        </span>
                      ) : (
                        "N/A"
                      ),
                  },
                  {
                    label: t("temperature"),
                    value:
                      metrics?.gpu_temp !== undefined && metrics?.gpu_temp !== null ? (
                        <span className="text-emerald-400 font-semibold">
                          {metrics.gpu_temp} °C
                        </span>
                      ) : (
                        "N/A"
                      ),
                  },
                ]
                : [
                  { label: t("model"), value: systemInfo?.integrated_gpu || t("loading") },
                  { label: t("type"), value: language === "pt" ? "Integrada" : "Integrated" },
                  {
                    label: t("usage"),
                    value:
                      metrics?.gpu_usage !== undefined && metrics?.gpu_usage !== null ? (
                        <span className="text-agb-primary font-semibold">
                          {metrics.gpu_usage}%
                        </span>
                      ) : (
                        "N/A"
                      ),
                  },
                  {
                    label: t("temperature"),
                    value:
                      metrics?.gpu_temp !== undefined && metrics?.gpu_temp !== null ? (
                        <span className="text-emerald-400 font-semibold">
                          {metrics.gpu_temp} °C
                        </span>
                      ) : (
                        "N/A"
                      ),
                  },
                ]
            }
          />

          <InfoCard
            icon={MemoryStick}
            iconBgColor="bg-purple-500/10"
            iconColor="text-purple-500"
            title={t("memoryTitle")}
            subtitle={t("memorySubtitle")}
            items={[
              { label: t("totalMemory"), value: formatBytes(systemInfo?.memory_total) },
              { label: t("type"), value: systemInfo?.memory_type || (language === "pt" ? "Desconhecido" : "Unknown") },
              {
                label: t("speed"),
                value: systemInfo?.memory_clock ? `${systemInfo.memory_clock} MHz` : "N/A",
              },
              {
                label: language === "pt" ? "Canais" : "Channels",
                value: systemInfo?.memory_channels ? (
                  <span className={systemInfo.memory_channels.includes("Dual") || systemInfo.memory_channels.includes("Quad") ? "text-emerald-400 font-semibold" : "text-agb-text font-medium"}>
                    {systemInfo.memory_channels}{systemInfo.memory_sticks_detail ? ` (${systemInfo.memory_sticks_detail})` : ""}
                  </span>
                ) : (
                  language === "pt" ? "Desconhecido" : "Unknown"
                ),
              },
              {
                label: t("usage"),
                value:
                  metrics?.memory_usage !== undefined ? (
                    <span className="text-agb-primary font-semibold">
                      {metrics.memory_usage}% ({metrics.memory_used_gb} GB)
                    </span>
                  ) : (
                    t("loading")
                  ),
              },
            ]}
          />

          <InfoCard
            icon={MonitorCog}
            iconBgColor="bg-red-500/10"
            iconColor="text-red-500"
            title={t("systemTitle")}
            subtitle={t("systemSubtitle")}
            items={[
              { label: t("os"), value: systemInfo?.os || (language === "pt" ? "Desconhecido" : "Unknown") },
              { label: t("version"), value: systemInfo?.os_version || (language === "pt" ? "Desconhecido" : "Unknown") },
            ]}
          />

          <InfoCard
            icon={HardDrive}
            iconBgColor="bg-orange-500/10"
            iconColor="text-orange-500"
            title={t("storageTitle")}
            subtitle={t("storageSubtitle")}
            items={
              systemInfo?.disks && systemInfo.disks.length > 0
                ? systemInfo.disks.map((d: any) => {
                  const letter = String(d.mount).toUpperCase()
                  const diskMetric = metrics?.disk_metrics?.[letter]
                  const activity = diskMetric !== undefined ? diskMetric.activity : 0
                  const rSpeed = diskMetric ? formatSpeed(diskMetric.readSpeedSec) : "0 KB/s"
                  const wSpeed = diskMetric ? formatSpeed(diskMetric.writeSpeedSec) : "0 KB/s"
                  const freeGB =
                    d.free_gb !== undefined
                      ? d.free_gb
                      : Math.max(0, Math.round(((d.size_gb || 0) - (d.used_gb || 0)) * 10) / 10)

                  return {
                    label: `${t("drive")} (${d.mount})`,
                    value: (
                      <div className="flex flex-col gap-0.5">
                        <div>
                          <span className="font-semibold">{d.size_gb} GB</span>
                          <span className="text-agb-text-secondary text-xs ml-2">
                            ({freeGB} GB {language === "pt" ? "livres" : "free"})
                          </span>
                        </div>
                        <div className="text-xs flex items-center gap-2">
                          <span className="text-agb-primary font-semibold">
                            {t("activity")}: {activity}%
                          </span>
                          <span className="text-agb-text-secondary">
                            ({t("readSpeed")}: {rSpeed} | {t("writeSpeed")}: {wSpeed})
                          </span>
                        </div>
                      </div>
                    ),
                  }
                })
                : [
                  { label: language === "pt" ? "Disco Principal" : "Primary Disk", value: systemInfo?.disk_model || t("loading") },
                  { label: language === "pt" ? "Espaço Total" : "Total Space", value: systemInfo?.disk_size || t("loading") },
                ]
            }
          />

          <InfoCard
            icon={Wrench}
            iconBgColor="bg-green-500/10"
            iconColor="text-green-500"
            title={t("tweaksTitle")}
            subtitle={t("tweaksSubtitle")}
            items={[
              { label: t("availableTweaks"), value: `${tweakInfo?.length || 0} ${language === "pt" ? "Ajustes" : "Tweaks"}` },
              {
                label: t("activeTweaks"),
                value: `${(tweakInfo ? tweakInfo.filter((t: any) => activeTweaks.includes(t.name)).length : activeTweaks.length) || 0} ${language === "pt" ? "Ativos" : "Active"}`,
              },
            ]}
          />
        </div>
        <p className="text-xs text-agb-text-secondary text-center mt-4">
          {usingCache ? t("loadingSystemData") : ""}
        </p>
      </div>

      {/* Modal de Detalhes do Perfil (Ajustes Ativos e Desativados) */}
      <Modal
        open={!!selectedProfileModal}
        onClose={() => setSelectedProfileModal(null)}
      >
        {selectedProfileModal && (() => {
          const profile = selectedProfileModal
          const ProfileIcon = profile.icon
          const profileTweaks = getFilteredProfileTweaks(profile.tweaks, systemInfo)
          const total = profileTweaks.length
          const activeList = profileTweaks.filter((name) => activeTweaks.includes(name))
          const inactiveList = profileTweaks.filter((name) => !activeTweaks.includes(name))
          const activeCount = activeList.length
          const inactiveCount = inactiveList.length
          const excessTweaks = activeTweaks.filter(
            (name) => ALL_PROFILE_TWEAKS.has(name) && !profileTweaks.includes(name),
          )
          const excessCount = excessTweaks.length
          const isCurrentProfile = total > 0 && activeCount === total && excessCount === 0
          const isAllActive = total > 0 && activeCount === total
          const title = language === "pt" ? profile.titlePt : profile.titleEn
          const badge = language === "pt" ? profile.badgePt : profile.badgeEn

          const visibleTweaks =
            profileModalFilter === "active"
              ? activeList
              : profileModalFilter === "inactive"
                ? inactiveList
                : profileTweaks

          const pct = total > 0 ? Math.round((activeCount / total) * 100) : 0

          return (
            <div className="bg-agb-card border border-agb-border rounded-2xl p-6 shadow-2xl max-w-2xl w-full mx-4 max-h-[88vh] flex flex-col">
              {/* Header do Modal */}
              <div className="flex items-start justify-between pb-4 border-b border-agb-border">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-agb-primary/10 text-agb-primary">
                    <ProfileIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-agb-text">{title}</h3>
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${profile.badgeClass}`}>
                        {badge}
                      </span>
                    </div>
                    <p className="text-xs text-agb-text-secondary mt-0.5">
                      {language === "pt" ? profile.descPt : profile.descEn}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProfileModal(null)}
                  className="text-agb-text-secondary hover:text-agb-text p-1.5 rounded-lg hover:bg-agb-border/40 transition"
                  title={language === "pt" ? "Fechar" : "Close"}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Barra de Progresso e Filtros */}
              <div className="py-4 border-b border-agb-border/60">
                <div className="flex items-center justify-between text-xs font-medium mb-2">
                  <span className="text-agb-text">
                    {language === "pt"
                      ? `Status do Perfil: ${activeCount} de ${total} ajustes ativos (${pct}%)`
                      : `Profile Status: ${activeCount} of ${total} tweaks active (${pct}%)`}
                  </span>
                  <span className={isCurrentProfile ? "text-emerald-400 font-semibold" : "text-agb-primary font-semibold"}>
                    {isCurrentProfile
                      ? (language === "pt" ? "100% Otimizado" : "100% Optimized")
                      : excessCount > 0 && inactiveCount === 0
                        ? (language === "pt" ? `${excessCount} excedente(s)` : `${excessCount} excess`)
                        : (language === "pt" ? `${inactiveCount} pendente(s)` : `${inactiveCount} pending`)}
                  </span>
                </div>
                <div className="w-full bg-agb-bg border border-agb-border h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${isAllActive ? "bg-emerald-500" : "bg-agb-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Abas de Filtro dentro do Modal */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setProfileModalFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${profileModalFilter === "all"
                      ? "bg-agb-primary text-white shadow-sm font-semibold"
                      : "bg-agb-bg text-agb-text-secondary hover:text-agb-text border border-agb-border"
                      }`}
                  >
                    {language === "pt" ? "Todos os Ajustes" : "All Tweaks"} ({total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileModalFilter("active")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${profileModalFilter === "active"
                      ? "bg-emerald-600 text-white shadow-sm font-semibold"
                      : "bg-agb-bg text-agb-text-secondary hover:text-emerald-400 border border-agb-border"
                      }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {language === "pt" ? "Ativos" : "Active"} ({activeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileModalFilter("inactive")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${profileModalFilter === "inactive"
                      ? "bg-slate-700 text-white shadow-sm font-semibold"
                      : "bg-agb-bg text-agb-text-secondary hover:text-slate-300 border border-agb-border"
                      }`}
                  >
                    <CircleSlash className="w-3.5 h-3.5" />
                    {language === "pt" ? "Desativados" : "Inactive"} ({inactiveCount})
                  </button>
                </div>
              </div>

              {/* Lista com scroll dos ajustes */}
              <div className="flex-1 overflow-y-auto custom-scrollbar py-3 pr-1 space-y-2 max-h-96 min-h-48">
                {visibleTweaks.length === 0 ? (
                  <div className="py-8 text-center text-agb-text-muted text-sm">
                    {language === "pt" ? "Nenhum ajuste nesta categoria." : "No tweaks in this category."}
                  </div>
                ) : (
                  visibleTweaks.map((tweakName) => {
                    const tweakMeta = tweakInfo?.find((t: any) => t.name === tweakName || t.id === tweakName)
                    const defaultTitle = tweakMeta?.title || tweakName
                    const defaultDesc = tweakMeta?.description || ""
                    const translatedTitle = translateTweakTitle(tweakName, defaultTitle, language)
                    const translatedDesc = translateTweakDesc(tweakName, defaultDesc, language)
                    const isActive = activeTweaks.includes(tweakName)

                    return (
                      <div
                        key={tweakName}
                        className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-colors ${isActive
                          ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                          : "bg-agb-bg/60 border-agb-border hover:border-agb-border-secondary"
                          }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="mt-0.5 shrink-0">
                            {isActive ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <CircleSlash className="w-5 h-5 text-agb-text-muted" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className={`text-sm font-semibold truncate ${isActive ? "text-emerald-300" : "text-agb-text"}`}>
                                {translatedTitle}
                              </h5>
                              <span className="text-[10px] text-agb-text-muted font-mono bg-agb-card px-1.5 py-0.5 rounded border border-agb-border">
                                {tweakName}
                              </span>
                            </div>
                            {translatedDesc && (
                              <p className="text-xs text-agb-text-secondary line-clamp-2 mt-0.5 leading-relaxed">
                                {translatedDesc}
                              </p>
                            )}
                            {tweakMeta?.warning && (
                              <p className="text-[11px] text-amber-400 mt-1 flex items-start gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span>{translateTweakWarning(tweakName, tweakMeta.warning, language)}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `https://github.com/VictorSallesBz/AGB/blob/main/README.md#${tweakName}`,
                                "_blank",
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-agb-accent/60 hover:bg-agb-primary/15 text-agb-text-secondary hover:text-agb-primary border border-agb-border transition-colors"
                            title={
                              language === "pt"
                                ? "Abrir explicação deste ajuste no Manual do GitHub"
                                : "Open this tweak's guide in the GitHub Manual"
                            }
                          >
                            <ExternalLink className="w-3 h-3" />
                            {language === "pt" ? "Manual" : "Docs"}
                          </button>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <Check className="w-3 h-3" />
                              {language === "pt" ? "Ativo" : "Active"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30">
                              {language === "pt" ? "Desativado" : "Inactive"}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Rodapé do Modal */}
              <div className="pt-4 border-t border-agb-border flex items-center justify-between gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedProfileModal(null)}
                  className="text-xs py-2 px-4"
                >
                  {language === "pt" ? "Fechar" : "Close"}
                </Button>

                <Button
                  onClick={async () => {
                    await handleApplyProfile(profile)
                  }}
                  disabled={isOptimizing || isCurrentProfile}
                  variant="primary"
                  className={`text-xs py-2 px-4 rounded-lg flex items-center gap-2 ${profile.btnClass}`}
                >
                  {isOptimizing ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>{language === "pt" ? "Otimizando..." : "Optimizing..."}</span>
                    </>
                  ) : isCurrentProfile ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{language === "pt" ? "Perfil 100% Ativo" : "Profile 100% Active"}</span>
                    </>
                  ) : excessCount > 0 && inactiveCount === 0 ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>
                        {language === "pt"
                          ? `Mudar para este perfil (desativa ${excessCount} excedente${excessCount > 1 ? "s" : ""})`
                          : `Switch to this profile (revert ${excessCount} excess)`}
                      </span>
                    </>
                  ) : excessCount > 0 && inactiveCount > 0 ? (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>
                        {language === "pt"
                          ? `Aplicar perfil (+${inactiveCount}, -${excessCount})`
                          : `Apply profile (+${inactiveCount}, -${excessCount})`}
                      </span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>
                        {language === "pt"
                          ? `Aplicar ${inactiveCount} Ajuste(s) Pendente(s)`
                          : `Apply ${inactiveCount} Pending Tweak(s)`}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </RootDiv>
  )
}

export default Home
