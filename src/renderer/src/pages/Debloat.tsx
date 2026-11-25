import { useState, useEffect, useCallback, useMemo } from "react"
import RootDiv from "@/components/rootdiv"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import Checkbox from "@/components/ui/Checkbox"
import Button from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import { invoke } from "@/lib/electron"
import {
  AppWindow,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  RotateCw,
  Search,
  Trash2,
  TriangleAlert,
  Package,
  Rocket,
} from "lucide-react"
import { toast } from "react-toastify"
import { LargeInput } from "@/components/ui/input"
import useLanguageStore from "@/store/languageStore"

interface InstalledApp {
  id: string
  name: string
  publisher: string
  version: string
  installDate: string
  icon?: string
  uninstallString: string
  quietUninstallString: string
  isStoreApp: boolean
  packageName: string
  size?: number
}

interface StartupApp {
  id: string
  name: string
  command: string
  location: "HKCU" | "HKLM" | "FolderUser" | "FolderCommon" | "Service" | "Task"
  locationLabel: string
  enabled: boolean
  sourceType: "registry" | "folder" | "service" | "task"
  filePath?: string
  fileName?: string
  serviceName?: string
  taskPath?: string
  protectedReason?: string
  icon?: string
}

type SubTab = "installed" | "startup"
type SortField = "name" | "publisher" | "version" | "installDate" | "size"
type StartupSortField = "name" | "locationLabel" | "command" | "status"
type SortOrder = "asc" | "desc"

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "-"
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }
  return `${bytes} B`
}

function formatInstallDate(rawDate?: string): string {
  if (!rawDate || rawDate.toLowerCase() === "unknown") return "-"
  const match = rawDate.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (match) {
    const [, y, m, d] = match
    return `${d}/${m}/${y}`
  }
  return rawDate
}

function AppIcon({
  icon,
  name,
  fallbackIcon,
}: {
  icon?: string
  name: string
  fallbackIcon?: React.ReactNode
}) {
  const [failed, setFailed] = useState(false)

  if (!icon || failed) {
    return (
      <div
        className="w-5 h-5 rounded-md bg-agb-accent/40 border border-agb-border flex items-center justify-center shrink-0 shadow-sm"
        title={name}
      >
        {fallbackIcon || <AppWindow className="w-3 h-3 text-agb-text-secondary/75" />}
      </div>
    )
  }

  return (
    <img
      src={icon}
      alt={name}
      className="w-5 h-5 object-contain rounded shrink-0"
      onError={() => setFailed(true)}
    />
  )
}

function Debloat() {
  const { t, language } = useLanguageStore()
  const [activeTab, setActiveTab] = useState<SubTab>("installed")

  // Installed Apps state
  const [apps, setApps] = useState<InstalledApp[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [uninstalling, setUninstalling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  // Startup Apps state
  const [startupApps, setStartupApps] = useState<StartupApp[]>([])
  const [startupLoading, setStartupLoading] = useState(false)
  const [startupSearchTerm, setStartupSearchTerm] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [startupSortField, setStartupSortField] = useState<StartupSortField>("name")
  const [startupSortOrder, setStartupSortOrder] = useState<SortOrder>("asc")

  const loadApps = useCallback(async function () {
    setLoading(true)
    try {
      const result = await invoke({ channel: "get-installed-apps" })
      setApps(result || [])
    } catch (err) {
      console.error("Failed to load installed apps:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStartupApps = useCallback(async function () {
    setStartupLoading(true)
    try {
      const result = await invoke({ channel: "get-startup-apps" })
      setStartupApps(result || [])
    } catch (err) {
      console.error("Failed to load startup apps:", err)
    } finally {
      setStartupLoading(false)
    }
  }, [])

  useEffect(() => {
    loadApps()
    loadStartupApps()
  }, [loadApps, loadStartupApps])

  useEffect(() => {
    const onProgress = () => {
      setUninstalling(true)
    }
    const onComplete = () => {
      setUninstalling(false)
      toast.success(t("uninstallComplete"))
      setSelected(new Set())
      loadApps()
    }

    window.electron.ipcRenderer.on("uninstall-progress", onProgress)
    window.electron.ipcRenderer.on("uninstall-complete", onComplete)

    return () => {
      window.electron.ipcRenderer.removeAllListeners("uninstall-progress")
      window.electron.ipcRenderer.removeAllListeners("uninstall-complete")
    }
  }, [loadApps, t])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const filteredAndSortedApps = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    const filtered = apps.filter((app) => {
      if (!term) return true
      return (
        app.name.toLowerCase().includes(term) ||
        (app.publisher && app.publisher.toLowerCase().includes(term)) ||
        (app.version && app.version.toLowerCase().includes(term))
      )
    })

    return filtered.sort((a, b) => {
      let result = 0
      if (sortField === "size") {
        const sizeA = a.size || 0
        const sizeB = b.size || 0
        result = sizeA - sizeB
      } else if (sortField === "installDate") {
        const dateA = a.installDate || ""
        const dateB = b.installDate || ""
        result = dateA.localeCompare(dateB)
      } else if (sortField === "version") {
        const verA = a.version || ""
        const verB = b.version || ""
        result = verA.localeCompare(verB)
      } else if (sortField === "publisher") {
        const pubA = a.publisher || ""
        const pubB = b.publisher || ""
        result = pubA.localeCompare(pubB)
      } else {
        result = a.name.localeCompare(b.name)
      }
      return sortOrder === "asc" ? result : -result
    })
  }, [apps, searchTerm, sortField, sortOrder])

  const handleStartupSort = (field: StartupSortField) => {
    if (startupSortField === field) {
      setStartupSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setStartupSortField(field)
      setStartupSortOrder("asc")
    }
  }

  const filteredStartupApps = useMemo(() => {
    const term = startupSearchTerm.toLowerCase().trim()
    const filtered = startupApps.filter((app) => {
      if (!term) return true
      return (
        app.name.toLowerCase().includes(term) ||
        app.command.toLowerCase().includes(term) ||
        app.locationLabel.toLowerCase().includes(term)
      )
    })

    return filtered.sort((a, b) => {
      let result = 0
      if (startupSortField === "status") {
        const statusA = a.enabled ? 1 : 0
        const statusB = b.enabled ? 1 : 0
        result = statusA - statusB
      } else if (startupSortField === "locationLabel") {
        result = a.locationLabel.localeCompare(b.locationLabel)
      } else if (startupSortField === "command") {
        result = a.command.localeCompare(b.command)
      } else {
        result = a.name.localeCompare(b.name)
      }
      return startupSortOrder === "asc" ? result : -result
    })
  }, [startupApps, startupSearchTerm, startupSortField, startupSortOrder])

  const handleToggleStartup = async (appItem: StartupApp) => {
    if (appItem.protectedReason) {
      toast.info(
        language === "pt"
          ? `${appItem.name} é protegido (${appItem.protectedReason}) para evitar falhas em jogos.`
          : `${appItem.name} is protected (${appItem.protectedReason}) to prevent game issues.`,
      )
      return
    }
    setTogglingId(appItem.id)
    const nextEnabled = !appItem.enabled
    try {
      const res = await invoke({
        channel: "toggle-startup-app",
        payload: {
          name: appItem.name,
          location: appItem.location,
          enabled: nextEnabled,
          sourceType: appItem.sourceType,
          fileName: appItem.fileName,
          serviceName: appItem.serviceName,
          taskPath: appItem.taskPath,
        },
      })
      if (res?.success) {
        setStartupApps((prev) =>
          prev.map((item) => (item.id === appItem.id ? { ...item, enabled: nextEnabled } : item)),
        )
        toast.success(t("startupToggleSuccess"))
      } else {
        toast.error(t("startupToggleError"))
      }
    } catch (err) {
      console.error("Failed to toggle startup app:", err)
      toast.error(t("startupToggleError"))
    } finally {
      setTogglingId(null)
    }
  }

  const selectedNames = useMemo(() => {
    return apps.filter((a) => selected.has(a.id)).map((a) => a.name)
  }, [apps, selected])

  async function handleUninstall() {
    setShowConfirm(false)
    setUninstalling(true)
    const selectedApps = apps.filter((a) => selected.has(a.id))
    try {
      const result = await invoke({
        channel: "uninstall-apps",
        payload: selectedApps,
      })
      if (!result?.success) {
        toast.error(
          language === "pt"
            ? "Alguns aplicativos não puderam ser desinstalados."
            : "Some apps could not be uninstalled.",
        )
      }
    } catch (err) {
      console.error("Uninstall failed:", err)
      toast.error(
        language === "pt" ? "Falha ao desinstalar aplicativos." : "Failed to uninstall apps.",
      )
    } finally {
      setUninstalling(false)
    }
  }

  const allSelected =
    filteredAndSortedApps.length > 0 && selected.size === filteredAndSortedApps.length
  const someSelected = selected.size > 0 && !allSelected

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredAndSortedApps.map((a) => a.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function refreshApps() {
    invoke({ channel: "reload-installed-apps" }).then(loadApps)
  }

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-75 transition-opacity shrink-0" />
      )
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-agb-primary shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-agb-primary shrink-0" />
    )
  }

  const renderStartupSortIndicator = (field: StartupSortField) => {
    if (startupSortField !== field) {
      return (
        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-75 transition-opacity shrink-0" />
      )
    }
    return startupSortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-agb-primary shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-agb-primary shrink-0" />
    )
  }

  return (
    <RootDiv className="flex flex-col w-full h-full pb-10">
      {/* Sub-tabs Switcher */}
      <div className="flex items-center gap-1.5 bg-agb-card border border-agb-border rounded-xl p-1.5 w-fit mb-6">
        <button
          onClick={() => setActiveTab("installed")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer active:scale-95 ${
            activeTab === "installed"
              ? "bg-agb-primary text-white shadow-md shadow-agb-primary/20"
              : "text-agb-text-secondary hover:text-agb-text hover:bg-agb-accent/30"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{t("subTabInstalledApps")}</span>
          {!loading && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 font-mono">
              {apps.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("startup")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer active:scale-95 ${
            activeTab === "startup"
              ? "bg-agb-primary text-white shadow-md shadow-agb-primary/20"
              : "text-agb-text-secondary hover:text-agb-text hover:bg-agb-accent/30"
          }`}
        >
          <Rocket className="w-4 h-4" />
          <span>{t("subTabStartupApps")}</span>
          {startupLoading && startupApps.length === 0 ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 font-mono animate-pulse">
              ...
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 font-mono">
              {startupApps.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "installed" && (
        <>
          <Modal open={showConfirm} onClose={() => setShowConfirm(false)}>
            <div className="bg-agb-card border border-agb-border rounded-2xl p-6 shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-red-500/20">
                  <TriangleAlert className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-agb-text">{t("confirmUninstall")}</h3>
              </div>
              <p className="text-sm text-agb-text-secondary mb-4">
                {language === "pt"
                  ? `Isso desinstalará os seguintes ${selectedNames.length} aplicativo(s) selecionado(s):`
                  : `This will uninstall the following ${selectedNames.length} app${selectedNames.length !== 1 ? "s" : ""}:`}
              </p>
              <ul className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 mb-6">
                {selectedNames.map((name) => (
                  <li
                    key={name}
                    className="text-sm text-agb-text bg-agb-accent/50 rounded px-3 py-1.5"
                  >
                    {name}
                  </li>
                ))}
              </ul>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowConfirm(false)}>
                  {t("cancel")}
                </Button>
                <Button variant="danger" onClick={handleUninstall} disabled={uninstalling}>
                  {uninstalling ? t("uninstalling") : t("uninstall")}
                </Button>
              </div>
            </div>
          </Modal>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div className="relative w-full md:w-96">
              <LargeInput
                placeholder={t("searchAppsPlaceholder")}
                className="w-full"
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={refreshApps}
                disabled={loading || uninstalling}
                className="flex items-center gap-1.5"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                {t("refresh")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={selected.size === 0 || uninstalling}
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {uninstalling ? t("uninstalling") : t("uninstallSelected")}
                {selected.size > 0 && ` (${selected.size})`}
              </Button>
            </div>
          </div>
          <Table className="mb-4">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelected || someSelected} onChange={toggleAll} />
                </TableHead>
                <TableHead
                  onClick={() => handleSort("name")}
                  className="cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("colAppName")}</span>
                    {renderSortIndicator("name")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("publisher")}
                  className="cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("colAppPublisher")}</span>
                    {renderSortIndicator("publisher")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("version")}
                  className="cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("colAppVersion")}</span>
                    {renderSortIndicator("version")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("installDate")}
                  className="cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("colAppDate")}</span>
                    {renderSortIndicator("installDate")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("size")}
                  className="cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("colAppSize")}</span>
                    {renderSortIndicator("size")}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <tr className="border-b border-agb-border">
                  <td colSpan={6} className="p-4 text-center text-agb-text-secondary">
                    {t("loadingInstalledApps")}
                  </td>
                </tr>
              ) : filteredAndSortedApps.length === 0 ? (
                <tr className="border-b border-agb-border">
                  <td colSpan={6} className="p-4 text-center text-agb-text-secondary">
                    {t("noInstalledAppsFound")}
                  </td>
                </tr>
              ) : (
                filteredAndSortedApps.map((app) => (
                  <tr
                    key={app.id}
                    className={`border-b border-agb-border transition-colors hover:bg-agb-accent/50 cursor-pointer ${selected.has(app.id) ? "bg-agb-accent/30" : ""}`}
                    onClick={() => !uninstalling && toggleOne(app.id)}
                  >
                    <td className="p-4 align-middle text-agb-text w-10">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(app.id)}
                          onChange={() => toggleOne(app.id)}
                        />
                      </div>
                    </td>
                    <td className="align-middle text-agb-text">
                      <div className="flex items-center gap-2">
                        <AppIcon icon={app.icon} name={app.name} />
                        <span>{app.name}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-agb-text">{app.publisher || "-"}</td>
                    <td className="p-4 align-middle text-agb-text">{app.version || "-"}</td>
                    <td className="p-4 align-middle text-agb-text">
                      {formatInstallDate(app.installDate)}
                    </td>
                    <td className="p-4 align-middle text-agb-text font-medium whitespace-nowrap">
                      {formatSize(app.size)}
                    </td>
                  </tr>
                ))
              )}
            </TableBody>
          </Table>
          <p className="text-sm text-agb-text-secondary mt-2">
            {language === "pt"
              ? "Os aplicativos são salvos em cache para melhor desempenho. Você pode atualizar a lista a qualquer momento."
              : "Apps are cached locally for performance. You can refresh the list at any time."}
          </p>
        </>
      )}

      {activeTab === "startup" && (
        <>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div className="relative w-full md:w-96">
              <LargeInput
                placeholder={t("searchStartupPlaceholder")}
                className="w-full"
                icon={Search}
                value={startupSearchTerm}
                onChange={(e) => setStartupSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadStartupApps}
                disabled={startupLoading}
                className="flex items-center gap-1.5"
              >
                <RotateCw className={`w-3.5 h-3.5 ${startupLoading ? "animate-spin" : ""}`} />
                {t("refresh")}
              </Button>
            </div>
          </div>

          <Table className="mb-4">
            <TableHeader>
              <TableRow>
                <TableHead
                  onClick={() => handleStartupSort("name")}
                  className="w-56 cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("colStartupName")}</span>
                    {renderStartupSortIndicator("name")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleStartupSort("locationLabel")}
                  className="w-48 cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("colStartupLocation")}</span>
                    {renderStartupSortIndicator("locationLabel")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleStartupSort("command")}
                  className="cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("colStartupCommand")}</span>
                    {renderStartupSortIndicator("command")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleStartupSort("status")}
                  className="w-36 text-right cursor-pointer select-none group"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{t("colStartupStatus")}</span>
                    {renderStartupSortIndicator("status")}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {startupLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16 text-agb-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RotateCw className="w-6 h-6 animate-spin text-agb-primary" />
                      <span>{t("loadingStartupApps")}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStartupApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16 text-agb-text-secondary">
                    {t("noStartupAppsFound")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStartupApps.map((item) => (
                  <TableRow key={item.id} className="hover:bg-agb-accent/30 transition-colors">
                    <TableCell className="font-semibold text-agb-text">
                      <div className="flex items-center gap-2.5">
                        <AppIcon
                          icon={item.icon}
                          name={item.name}
                          fallbackIcon={<Rocket className="w-3.5 h-3.5 text-agb-primary shrink-0" />}
                        />
                        <span className="truncate max-w-[200px]" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2.5 py-1 rounded-md bg-agb-muted text-agb-muted-foreground font-mono">
                        {item.locationLabel}
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-xs text-agb-muted-foreground font-mono max-w-md truncate"
                      title={item.command}
                    >
                      {item.command}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        {item.protectedReason ? (
                          <span
                            className="text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium"
                            title={
                              language === "pt"
                                ? `Protegido (${item.protectedReason})`
                                : `Protected (${item.protectedReason})`
                            }
                          >
                            {item.protectedReason}
                          </span>
                        ) : (
                          <span
                            className={`text-xs font-semibold ${item.enabled ? "text-emerald-400" : "text-agb-muted-foreground"}`}
                          >
                            {item.sourceType === "service"
                              ? item.enabled
                                ? language === "pt"
                                  ? "Automático"
                                  : "Automatic"
                                : "Manual"
                              : item.enabled
                                ? t("enabled")
                                : t("disabled")}
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={togglingId === item.id || !!item.protectedReason}
                          onClick={() => handleToggleStartup(item)}
                          title={
                            item.protectedReason
                              ? language === "pt"
                                ? `Protegido (${item.protectedReason})`
                                : `Protected (${item.protectedReason})`
                              : undefined
                          }
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            item.enabled ? "bg-emerald-500" : "bg-agb-muted"
                          } ${togglingId === item.id || item.protectedReason ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              item.enabled ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <p className="text-sm text-agb-text-secondary mt-2 pb-8">
            {language === "pt"
              ? "Gerencie entradas do Registro, pastas Inicializar, Serviços de terceiros (services.msc: Automático ↔ Manual) e Tarefas Agendadas."
              : "Manage Registry entries, Startup folders, third-party Services (Automatic ↔ Manual), and Scheduled Tasks."}
          </p>
        </>
      )}
    </RootDiv>
  )
}

export default Debloat
