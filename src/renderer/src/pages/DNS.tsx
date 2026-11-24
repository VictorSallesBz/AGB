import { useState, useEffect } from "react"
import { invoke } from "@/lib/electron"
import RootDiv from "@/components/rootdiv"
import Button from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import { toast } from "react-toastify"
import { Globe, Shield, Settings, RotateCw, AlertCircle, Info, LoaderCircle, Activity, Zap } from "lucide-react"
import { Cloud } from "lucide-react"
import log from "electron-log/renderer"
import { Check, X } from "lucide-react"
import Card from "@/components/ui/Card"
import useLanguageStore from "@/store/languageStore"

interface PingResult {
  name: string
  server: string
  latency: number | null
  status: "success" | "timeout" | "error"
}

interface DNSProvider {
  id: string
  name: string
  primary: string
  secondary: string
  description: string
  features: string[]
  recommended?: boolean
  color: string
  icon: React.ReactElement
}

const dnsProviders = [
  {
    id: "cloudflare",
    name: "Cloudflare",
    primary: "1.1.1.1",
    secondary: "1.0.0.1",
    description: "Fast, secure, and privacy-focused DNS",
    features: ["Fast", "Privacy-focused", "Security"],
    recommended: true,
    color: "text-orange-500",
    icon: <Cloud className="w-5 h-5" />,
  },
  {
    id: "gcore",
    name: "G-Core Gaming",
    primary: "95.85.95.85",
    secondary: "2.56.220.2",
    description: "Ultra-low latency gaming routes & infrastructure",
    features: ["Low Latency", "Gaming Optimized", "Anycast"],
    recommended: true,
    color: "text-amber-500",
    icon: <Globe className="w-5 h-5" />,
  },
  {
    id: "controld",
    name: "Control D Anycast",
    primary: "76.76.2.0",
    secondary: "76.76.10.0",
    description: "Modern high-speed DNS with zero log retention",
    features: ["No Logs", "Ultra Fast", "Anycast"],
    color: "text-cyan-500",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: "google",
    name: "Google",
    primary: "8.8.8.8",
    secondary: "8.8.4.4",
    description: "Reliable and widely used DNS service",
    features: ["Reliable", "Fast", "Widely supported"],
    color: "text-blue-500",
    icon: <Globe className="w-5 h-5" />,
  },
  {
    id: "opendns",
    name: "OpenDNS",
    primary: "208.67.222.222",
    secondary: "208.67.220.220",
    description: "Cisco-owned DNS with content filtering",
    features: ["Content filtering", "Reliable", "Security"],
    color: "text-green-500",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: "quad9",
    name: "Quad9",
    primary: "9.9.9.9",
    secondary: "149.112.112.112",
    description: "Security-focused DNS with threat blocking",
    features: ["Security", "Threat blocking", "Privacy"],
    color: "text-purple-500",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: "adguard",
    name: "AdGuard DNS",
    primary: "94.140.14.14",
    secondary: "94.140.15.15",
    description: "Blocks ads, trackers, malware",
    features: ["Security", "Threat blocking", "Privacy"],
    color: "text-teal-500",
    icon: <Cloud className="w-5 h-5" />,
  },
  {
    id: "automatic",
    name: "Automatic (DHCP)",
    primary: "Auto",
    secondary: "Auto",
    description: "Use your ISP's default DNS servers",
    features: ["Default", "ISP provided", "No configuration"],
    color: "text-gray-500",
    icon: <Settings className="w-5 h-5" />,
  },
]

export default function DNSPage() {
  const { t, language, tDns } = useLanguageStore()
  const [selectedProvider, setSelectedProvider] = useState<DNSProvider | null>(null)
  const [currentDNS, setCurrentDNS] = useState<Array<{ adapter: string; servers: string }> | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [customDNS, setCustomDNS] = useState({ primary: "", secondary: "" })
  const [pingResults, setPingResults] = useState<PingResult[] | null>(null)
  const [pingLoading, setPingLoading] = useState(false)

  // Single IP ping tester (at the top)
  const [singleIp, setSingleIp] = useState("")
  const [singlePingLoading, setSinglePingLoading] = useState(false)
  const [singlePingResult, setSinglePingResult] = useState<{
    target: string
    latency: number | null
    status: "success" | "timeout" | "error"
  } | null>(null)

  // Custom DNS ping tester
  const [customPingLoading, setCustomPingLoading] = useState(false)
  const [customPingResults, setCustomPingResults] = useState<{
    primary?: { latency: number | null; status: "success" | "timeout" | "error" }
    secondary?: { latency: number | null; status: "success" | "timeout" | "error" }
  } | null>(null)

  const handleTestSingleIp = async (ipToTest?: string) => {
    const target = (ipToTest !== undefined ? ipToTest : singleIp).trim()
    if (!target) return

    setSinglePingLoading(true)
    try {
      const result = await invoke({
        channel: "dns:ping-ip",
        payload: target,
      })

      if (result && result.success && result.data) {
        setSinglePingResult({
          target,
          latency: result.data.latency,
          status: result.data.status,
        })
      } else {
        setSinglePingResult({
          target,
          latency: null,
          status: "error",
        })
      }
    } catch {
      setSinglePingResult({
        target,
        latency: null,
        status: "error",
      })
    } finally {
      setSinglePingLoading(false)
    }
  }

  const handleTestCustomDnsPing = async () => {
    if (!customDNS.primary.trim()) return
    setCustomPingLoading(true)
    setCustomPingResults(null)

    try {
      const p1 = invoke({ channel: "dns:ping-ip", payload: customDNS.primary.trim() })
      const p2 =
        customDNS.secondary && customDNS.secondary.trim()
          ? invoke({ channel: "dns:ping-ip", payload: customDNS.secondary.trim() })
          : Promise.resolve(null)

      const [res1, res2] = await Promise.all([p1, p2])

      setCustomPingResults({
        primary:
          res1 && res1.success && res1.data
            ? { latency: res1.data.latency, status: res1.data.status }
            : { latency: null, status: "error" },
        secondary:
          res2 && res2.success && res2.data
            ? { latency: res2.data.latency, status: res2.data.status }
            : undefined,
      })
    } catch (err) {
      console.error("Error pinging custom DNS:", err)
    } finally {
      setCustomPingLoading(false)
    }
  }

  useEffect(() => {
    getCurrentDNS()
  }, [])

  const getCurrentDNS = async () => {
    try {
      const result = await invoke({
        channel: "dns:get-current",
      })

      if (result.success) {
        setCurrentDNS(result.data)
      }
    } catch (error) {
      console.error("Error getting current DNS:", error)
      log.error("Error getting current DNS:", error)
    }
  }

  const [flushingDNS, setFlushingDNS] = useState(false)

  const handleFlushDNS = async () => {
    toast.dismiss()
    setFlushingDNS(true)
    const toastId = toast.loading(language === "pt" ? "Limpando cache DNS do Windows..." : "Flushing DNS cache...")
    try {
      await invoke({
        channel: "run-powershell",
        payload: { script: "ipconfig /flushdns", name: "flush-dns" },
      })
      toast.update(toastId, {
        render: t("flushDnsSuccess") || (language === "pt" ? "Cache DNS do Windows limpo com sucesso!" : "Windows DNS cache flushed successfully!"),
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })
      await getCurrentDNS()
    } catch (e: any) {
      toast.update(toastId, {
        render: `${language === "pt" ? "Falha ao limpar cache DNS" : "Failed to flush DNS"}: ${e?.message || ""}`,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      })
    } finally {
      setFlushingDNS(false)
    }
  }

  const applyDNS = async (provider) => {
    toast.dismiss()
    setLoading(true)
    const toastId = toast.loading(
      language === "pt" ? `Aplicando DNS ${provider.name}...` : `Applying ${provider.name} DNS...`,
    )

    try {
      let payload
      if (provider.id === "custom") {
        payload = {
          dnsType: "custom",
          primaryDNS: customDNS.primary,
          secondaryDNS: customDNS.secondary,
        }
      } else {
        payload = {
          dnsType: provider.id,
        }
      }

      const result = await invoke({
        channel: "dns:apply",
        payload,
      })

      if (result.success) {
        toast.update(toastId, {
          render: `${provider.name} ${language === "pt" ? "DNS aplicado com sucesso!" : "DNS applied successfully!"}`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
        await getCurrentDNS()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast.update(toastId, {
        render: `${language === "pt" ? "Falha ao aplicar DNS" : "Failed to apply DNS"}: ${error.message || ""}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      log.error("Failed to apply DNS:", error)
    } finally {
      setLoading(false)
      setModalOpen(false)
    }
  }

  const openConfirmationModal = (provider) => {
    setSelectedProvider(provider)
    setModalOpen(true)
  }

  const validateCustomDNS = (dns) => {
    // regex is weird
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    return ipRegex.test(dns)
  }

  const isCustomDNSValid = () => {
    return (
      customDNS.primary &&
      validateCustomDNS(customDNS.primary) &&
      (!customDNS.secondary || validateCustomDNS(customDNS.secondary))
    )
  }

  const testAllPing = async () => {
    setPingLoading(true)
    setPingResults(null)

    try {
      const result = await invoke({
        channel: "dns:ping-all",
      })

      if (result.success) {
        const sorted = [...result.data].sort((a, b) => {
          if (a.latency === null && b.latency === null) return 0
          if (a.latency === null) return 1
          if (b.latency === null) return -1
          return a.latency - b.latency
        })
        setPingResults(sorted)
      } else {
        toast.error(
          language === "pt" ? `Falha no teste de ping: ${result.error}` : `Ping test failed: ${result.error}`,
        )
      }
    } catch (error: any) {
      toast.error(
        language === "pt" ? `Falha no teste de ping: ${error.message}` : `Ping test failed: ${error.message}`,
      )
      log.error("Failed to ping DNS servers:", error)
    } finally {
      setPingLoading(false)
    }
  }

  const getLowestPingServer = () => {
    if (!pingResults) return null
    const successResults = pingResults.filter((r) => r.latency !== null)
    return successResults.length > 0 ? successResults[0] : null
  }

  return (
    <>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="bg-agb-card p-4 rounded-2xl border border-agb-border text-agb-text w-[90vw] max-w-md">
          <h2 className="text-lg font-semibold mb-4">{t("confirmDNSChange")}</h2>
          {selectedProvider && (
            <>
              <p className="mb-4">
                {t("confirmDNSChangeText")}{" "}
                <span className="text-agb-primary font-medium">{selectedProvider.name}</span>.
              </p>
              <div className="bg-agb-border-secondary border border-agb-border p-3 rounded-md mb-4">
                <div className="text-sm">
                  <div>
                    <strong>{language === "pt" ? "Primário:" : "Primary:"}</strong> {selectedProvider.primary}
                  </div>
                  <div>
                    <strong>{language === "pt" ? "Secundário:" : "Secondary:"}</strong> {selectedProvider.secondary}
                  </div>
                </div>
              </div>
              <p className="text-sm text-agb-text-secondary mb-4">
                {t("dnsFlushWarning")}
              </p>
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)} variant="secondary">
              {t("cancel")}
            </Button>
            <Button onClick={() => applyDNS(selectedProvider)} disabled={loading}>
              {loading ? (language === "pt" ? "Aplicando..." : "Applying...") : t("apply")}
            </Button>
          </div>
        </div>
      </Modal>
      <RootDiv>
        <div className="pb-10 mr-4">
          {/* Quick IP Ping Tester */}
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h2 className="font-semibold">{t("testPingIpTitle")}</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={singleIp}
                onChange={(e) => setSingleIp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && singleIp.trim() && !singlePingLoading) {
                    handleTestSingleIp()
                  }
                }}
                placeholder={t("testPingIpPlaceholder")}
                className="flex-1 px-3 py-2 bg-agb-border border border-agb-border-secondary rounded-lg text-agb-text placeholder:text-agb-text-secondary/60 focus:outline-hidden focus:border-agb-primary text-sm"
              />
              <Button
                onClick={() => handleTestSingleIp()}
                disabled={!singleIp.trim() || singlePingLoading}
                variant="primary"
                size="sm"
                className="shrink-0"
              >
                {singlePingLoading ? (
                  <>
                    <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                    {t("testPingTesting")}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-1.5 text-amber-400" />
                    {t("testPingBtn")}
                  </>
                )}
              </Button>
            </div>

            {/* Quick chips presets */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2 text-xs text-agb-text-secondary">
              <span className="font-medium">{t("testPingQuickPresets")}</span>
              {[
                { label: "1.1.1.1 (Cloudflare)", ip: "1.1.1.1" },
                { label: "8.8.8.8 (Google)", ip: "8.8.8.8" },
                { label: "9.9.9.9 (Quad9)", ip: "9.9.9.9" },
                { label: "208.67.222.222 (OpenDNS)", ip: "208.67.222.222" },
                { label: "1.0.0.1", ip: "1.0.0.1" },
              ].map((preset) => (
                <button
                  key={preset.ip}
                  type="button"
                  onClick={() => {
                    setSingleIp(preset.ip)
                    handleTestSingleIp(preset.ip)
                  }}
                  className="px-2 py-0.5 rounded-md bg-agb-border hover:bg-agb-border-secondary hover:text-agb-text transition border border-agb-border-secondary/40 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Ping result card */}
            {singlePingResult && (
              <div
                className={`mt-3 p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                  singlePingResult.status === "success" && singlePingResult.latency !== null
                    ? singlePingResult.latency < 30
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : singlePingResult.latency < 70
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : singlePingResult.latency < 120
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "bg-orange-500/10 border-orange-500/30 text-orange-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {singlePingResult.status === "success" && singlePingResult.latency !== null ? (
                    <Check className="w-5 h-5 shrink-0" />
                  ) : (
                    <X className="w-5 h-5 shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold text-agb-text flex items-center gap-2">
                      <span>{singlePingResult.target}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-agb-card border border-agb-border">
                        {singlePingResult.status === "success" && singlePingResult.latency !== null
                          ? singlePingResult.latency < 30
                            ? t("pingStatusExcellent")
                            : singlePingResult.latency < 70
                              ? t("pingStatusGood")
                              : singlePingResult.latency < 120
                                ? t("pingStatusModerate")
                                : t("pingStatusHigh")
                          : t("pingStatusTimeout")}
                      </span>
                    </div>
                    <div className="text-xs text-agb-text-secondary">
                      {singlePingResult.status === "success" && singlePingResult.latency !== null
                        ? `${language === "pt" ? "Tempo de resposta" : "Response time"}: ${singlePingResult.latency}ms`
                        : (language === "pt" ? "Sem resposta do servidor ou pacote perdido." : "No response or packet lost.")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {singlePingResult.status === "success" && singlePingResult.latency !== null && (
                    <span className="text-xl font-bold font-mono">{singlePingResult.latency}ms</span>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs px-2 py-1 h-auto"
                    onClick={() => setSinglePingResult(null)}
                  >
                    {language === "pt" ? "Limpar" : "Clear"}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h2 className="font-semibold text-agb-text">{language === "pt" ? "Configurações de DNS Atuais" : "Current DNS Settings"}</h2>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  onClick={handleFlushDNS}
                  disabled={flushingDNS}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1.5 text-xs font-medium"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t("flushDnsBtn") || (language === "pt" ? "Limpar Cache DNS (Flush)" : "Flush DNS Cache")}</span>
                </Button>
                <Button onClick={getCurrentDNS} variant="secondary" size="sm" title={language === "pt" ? "Atualizar" : "Refresh"}>
                  <RotateCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {currentDNS && currentDNS.length > 0 ? (
              <div className="space-y-2">
                {currentDNS.map((dns, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium text-agb-text">{dns.adapter}:</span>
                    <span className="text-agb-text-secondary font-mono text-xs">{dns.servers}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-agb-text-secondary">
                <AlertCircle className="w-4 h-4" />
                <span>{language === "pt" ? "Carregando informações de rede..." : "Loading Network Info, this may take a while..."}</span>
              </div>
            )}
          </Card>

          <Card className="p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-semibold text-agb-text">{language === "pt" ? "Encontrar DNS Mais Rápido" : "Find Fastest DNS"}</h2>
              <Button
                onClick={testAllPing}
                disabled={pingLoading}
                variant="secondary"
                size="sm"
                className="ml-auto"
              >
                {pingLoading ? (
                  <>
                    <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                    {language === "pt" ? "Testando, aguarde..." : "Testing Please Wait..."}
                  </>
                ) : (
                  <>{t("testLatency")}</>
                )}
              </Button>
              {pingResults && (
                <Button variant="secondary" size="sm" onClick={() => setPingResults(null)}>
                  {language === "pt" ? "Limpar" : "Clear"}
                </Button>
              )}
            </div>

            {pingResults && (
              <div className="space-y-2">
                {getLowestPingServer() && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-emerald-400 font-medium">
                        {language === "pt" ? "DNS Mais Rápido: " : "Fastest DNS: "}
                        {language === "pt" && getLowestPingServer()!.name === "Automatic (DHCP)"
                          ? "Automático (DHCP)"
                          : getLowestPingServer()!.name}{" "}
                        ({getLowestPingServer()!.server}) - {getLowestPingServer()!.latency}ms
                      </span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {pingResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 bg-agb-card border border-agb-border rounded-xl text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-agb-text">
                          {language === "pt" && result.name === "Automatic (DHCP)"
                            ? "Automático (DHCP)"
                            : result.name}
                        </span>
                        <span className="text-xs font-mono text-agb-text-secondary">({result.server})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.latency !== null ? (
                          <span className="text-emerald-400 font-semibold font-mono">{result.latency}ms</span>
                        ) : (
                          <span className="text-red-400 text-xs">
                            {result.status === "timeout" ? (language === "pt" ? "Tempo Esgotado" : "Timeout") : (language === "pt" ? "Erro" : "Error")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!pingResults && !pingLoading && (
              <p className="text-sm text-agb-text-secondary">
                {language === "pt" ? "Testar todos os servidores DNS para encontrar o de menor latência." : "Test all DNS servers to find the one with the lowest ping."}
              </p>
            )}
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {dnsProviders.map((provider) => {
              const translated = tDns(provider.id, provider.description, provider.features)
              const displayDesc = translated.description
              const displayFeatures = translated.features || provider.features

              return (
                <Card
                  key={provider.id}
                  onClick={() => openConfirmationModal(provider)}
                  disabled={loading}
                  className="bg-agb-card border border-agb-border p-4.5 rounded-xl hover:border-agb-primary/60 hover:shadow-md transition-all text-left cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-agb-accent/40 ${provider.color}`}>
                        {provider.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm text-agb-text truncate">
                            {language === "pt" && provider.id === "automatic"
                              ? "Automático (DHCP)"
                              : provider.name}
                          </h3>
                          {provider.recommended && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-agb-primary/15 text-agb-primary border border-agb-primary/30 shrink-0 ml-1">
                              {t("recommended")}
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-mono text-agb-text-muted mt-0.5">
                          {provider.primary} • {provider.secondary}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-agb-text-secondary leading-relaxed">{displayDesc}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-agb-border/40">
                    {displayFeatures.map((feature, index) => (
                      <span key={index} className="px-2 py-0.5 bg-agb-accent/50 border border-agb-border/60 text-[11px] text-agb-text-secondary rounded-md font-medium">
                        {feature}
                      </span>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>

          <Card className="p-4 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-purple-500" />
              <h2 className="font-semibold">{language === "pt" ? "DNS Personalizado" : "Custom DNS"}</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("primaryDNS")}</label>
                  <input
                    type="text"
                    value={customDNS.primary}
                    onChange={(e) =>
                      setCustomDNS((prev) => ({ ...prev, primary: e.target.value }))
                    }
                    placeholder={language === "pt" ? "ex: 1.1.1.1" : "e.g., 1.1.1.1"}
                    className="w-full px-3 py-2 bg-agb-border border border-agb-border-secondary rounded-lg text-agb-text focus:outline-hidden focus:border-agb-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("secondaryDNS")}
                  </label>
                  <input
                    type="text"
                    value={customDNS.secondary}
                    onChange={(e) =>
                      setCustomDNS((prev) => ({ ...prev, secondary: e.target.value }))
                    }
                    placeholder={language === "pt" ? "ex: 1.0.0.1" : "e.g., 1.0.0.1"}
                    className="w-full px-3 py-2 bg-agb-border border border-agb-border-secondary rounded-lg text-agb-text focus:outline-hidden focus:border-agb-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-agb-text-secondary">
                <Info className="w-4 h-4" />
                <span>{t("enterValidIpv4")}</span>
              </div>

              {customPingResults && (
                <div className="p-3 bg-agb-border-secondary border border-agb-border rounded-xl space-y-2 text-sm">
                  <div className="font-medium text-xs text-agb-text-secondary uppercase tracking-wider">
                    {t("customDnsPingResults")}
                  </div>
                  {customPingResults.primary && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {customPingResults.primary.status === "success" && customPingResults.primary.latency !== null ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-medium text-agb-text">{t("primaryDNS")}:</span>
                        <span className="text-agb-text-secondary font-mono">{customDNS.primary}</span>
                      </div>
                      <div>
                        {customPingResults.primary.status === "success" && customPingResults.primary.latency !== null ? (
                          <span className="text-green-500 font-semibold font-mono">{customPingResults.primary.latency}ms</span>
                        ) : (
                          <span className="text-red-400 text-xs">{t("pingStatusTimeout")}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {customPingResults.secondary && (
                    <div className="flex items-center justify-between border-t border-agb-border/40 pt-2">
                      <div className="flex items-center gap-2">
                        {customPingResults.secondary.status === "success" && customPingResults.secondary.latency !== null ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-medium text-agb-text">{language === "pt" ? "Secundário:" : "Secondary:"}</span>
                        <span className="text-agb-text-secondary font-mono">{customDNS.secondary}</span>
                      </div>
                      <div>
                        {customPingResults.secondary.status === "success" && customPingResults.secondary.latency !== null ? (
                          <span className="text-green-500 font-semibold font-mono">{customPingResults.secondary.latency}ms</span>
                        ) : (
                          <span className="text-red-400 text-xs">{t("pingStatusTimeout")}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  variant="secondary"
                  onClick={handleTestCustomDnsPing}
                  disabled={!customDNS.primary.trim() || customPingLoading}
                  className="flex-1"
                >
                  {customPingLoading ? (
                    <>
                      <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                      {t("testPingTesting")}
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 mr-2 text-cyan-400" />
                      {t("testCustomDnsPing")}
                    </>
                  )}
                </Button>
                <Button
                  onClick={() =>
                    openConfirmationModal({
                      id: "custom",
                      name: t("customDNS"),
                      primary: customDNS.primary,
                      secondary: customDNS.secondary,
                    })
                  }
                  disabled={!isCustomDNSValid() || loading}
                  className="flex-1"
                >
                  {t("applyCustomDNS")}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </RootDiv>
    </>
  )
}
