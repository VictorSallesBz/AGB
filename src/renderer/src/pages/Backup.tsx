import { useEffect, useState } from "react"
import {
  RotateCw,
  PlusCircle,
  Shield,
  RotateCcw,
  Loader2,
  Search,
  Wrench,
  Undo2,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
} from "lucide-react"
import RootDiv from "@/components/rootdiv"
import { invoke } from "@/lib/electron"
import Button from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import { toast } from "react-toastify"
import { Trash } from "lucide-react"
import log from "electron-log/renderer"
import { Input, LargeInput } from "@/components/ui/input"
import useLanguageStore, { translateTweakTitle, translateTweakDesc } from "@/store/languageStore"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Tweak } from "@/types/index"

type RestorePoint = {
  SequenceNumber: number
  Description: string
  CreationTime: string
  EventType: number
  RestorePointType: number
}

type RestorePointList = RestorePoint[]

function RestorePointsTab() {
  const { t, language } = useLanguageStore()
  const [restorePoints, setRestorePoints] = useState<RestorePointList>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: string | null
    restorePoint: any | null
  }>({
    isOpen: false,
    type: null,
    restorePoint: null,
  })

  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [isNotAdmin, setIsNotAdmin] = useState(false)

  const fetchRestorePoints = async () => {
    setLoading(true)
    try {
      const [response, adminCheck] = await Promise.all([
        invoke({ channel: "get-restore-points" }),
        invoke({ channel: "get-admin-status" }).catch(() => null),
      ])
      if (response && Array.isArray(response.points)) {
        const sorted = response.points.sort((a, b) => {
          const parse = (str: string) =>
            new Date(
              `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}T${str.slice(8, 10)}:${str.slice(10, 12)}:${str.slice(12, 14)}`,
            ).getTime()

          return parse(b.CreationTime) - parse(a.CreationTime)
        })
        setRestorePoints(sorted)
      } else {
        setRestorePoints([])
      }

      const isUserAdmin = adminCheck === true || response?.isAdmin === true
      if (isUserAdmin) {
        setIsNotAdmin(false)
      } else {
        setIsNotAdmin(true)
      }
    } catch (error) {
      console.error("Failed to load restore points:", error)
      log.error("Failed to load restore points:", error)
      setRestorePoints([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRestorePoints()
  }, [])

  const handleCreateRestorePoint = async () => {
    toast.dismiss()
    setProcessing(true)
    try {
      const res = await invoke({ channel: "create-agb-restore-point" })
      if (!res?.success) {
        throw new Error(res?.error || "Failed to create restore point")
      }
      toast.success(language === "pt" ? "Ponto de restauração criado!" : "Restore point created!")
      await fetchRestorePoints()
    } catch (err) {
      toast.error(language === "pt" ? "Falha ao criar ponto de restauração." : "Failed to create restore point.")
      log.error("Failed to create restore point:", err)
    }
    setProcessing(false)
  }

  const handleRestore = (restorePoint) => {
    setModalState({ isOpen: true, type: "restore", restorePoint })
  }

  const executeRestore = async () => {
    setProcessing(true)
    try {
      const res = await invoke({
        channel: "restore-restore-point",
        payload: modalState.restorePoint.SequenceNumber,
      })
      if (!res?.success) {
        throw new Error(res?.error || "Failed to start system restore")
      }
      toast.success(language === "pt" ? "Restauração iniciada. Seu computador pode reiniciar." : "System restore started. Your PC may restart.")
    } catch (err) {
      toast.error(language === "pt" ? "Falha ao iniciar a restauração do sistema." : "Failed to start system restore.")
      log.error("Failed to start system restore:", err)
    }
    setProcessing(false)
    setModalState({ isOpen: false, type: null, restorePoint: null })
  }

  const handleCustomRestorePoint = async () => {
    setProcessing(true)
    try {
      if (!customName.trim()) {
        toast.error(language === "pt" ? "Por favor, digite um nome para o ponto de restauração." : "Please enter a name for the restore point.")
        setProcessing(false)
        return
      }
      const res = await invoke({ channel: "create-restore-point", payload: customName })
      if (!res?.success) {
        throw new Error(res?.error || "Failed to create restore point")
      }
      toast.success(language === "pt" ? "Ponto de restauração criado!" : "Restore point created!")
      setCustomModalOpen(false)
      setCustomName("")
      await fetchRestorePoints()
    } catch (err) {
      toast.error(language === "pt" ? "Falha ao criar ponto de restauração." : "Failed to create restore point.")
      log.error("Failed to create restore point:", err)
    }
    setProcessing(false)
  }
  const handleDeleteAll = async () => {
    setConfirmDeleteAll(false)
    setProcessing(true)
    try {
      const res = await invoke({ channel: "delete-all-restore-points" })
      if (!res?.success) {
        throw new Error(res?.error || "Failed to delete restore points")
      }
      toast.success(language === "pt" ? "Todos os pontos de restauração foram excluídos." : "All restore points deleted successfully.")
      await fetchRestorePoints()
    } catch (err) {
      toast.error(language === "pt" ? "Falha ao excluir pontos de restauração." : "Failed to delete restore points.")
      log.error("Failed to delete restore points:", err)
    } finally {
      setProcessing(false)
    }
  }
  const filteredRestorePoints = restorePoints.filter((rp: RestorePoint) =>
    (rp.Description || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )
  return (
    <>
      <div className="h-full max-w-full space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <LargeInput
              placeholder={t("searchRestorePointsPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmDeleteAll(true)}
              disabled={loading || processing || restorePoints.length === 0}
              className="flex items-center gap-1.5"
            >
              <Trash size={15} /> {t("deleteAllRestorePoints")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchRestorePoints}
              className="flex items-center gap-1.5"
              disabled={loading || processing}
            >
              <RotateCw size={15} className={loading ? "animate-spin" : ""} /> {t("refresh")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCustomModalOpen(true)}
              disabled={loading || processing}
              className="flex items-center gap-1.5"
            >
              <PlusCircle size={15} />
              {t("createCustomRestorePoint")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateRestorePoint}
              className="flex items-center gap-1.5 shadow-sm shadow-agb-primary/20"
              disabled={loading || processing}
            >
              {processing ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Shield size={15} />
              )}
              {t("quickRestorePoint")}
            </Button>
          </div>
        </div>

        {isNotAdmin && (
          <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-500 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>
              {language === "pt"
                ? "O Windows requer privilégios de Administrador para listar e criar pontos de restauração. Execute o AGB como Administrador."
                : "Windows requires Administrator privileges to list and create restore points. Please run AGB as Administrator."}
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 size={32} className="text-agb-primary animate-spin" />
          </div>
        ) : filteredRestorePoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-agb-card border border-agb-border rounded-lg">
            <div className="p-4 bg-agb-secondary rounded-full mb-4">
              <Shield size={28} className="text-agb-text" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-agb-text">
              {t("noRestorePointsFound")}
            </h3>
            <p className="text-agb-text-secondary max-w-sm mb-4">
              {searchQuery
                ? t("noRestorePointsMatch")
                : t("restorePointNotice")}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                icon={<PlusCircle size={16} />}
                onClick={handleCreateRestorePoint}
                disabled={processing}
              >
                {t("createRestorePoint")}
              </Button>
            )}
          </div>
        ) : (
          <Table className="max-h-96">
            <TableHeader>
              <TableRow>
                <TableHead>{t("colName")}</TableHead>
                <TableHead className="w-32 text-center">{t("colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRestorePoints.map((rp, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{rp.Description}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      className="p-2! gap-2"
                      onClick={() => handleRestore(rp)}
                      disabled={processing}
                      title={t("btnRestore")}
                    >
                      <RotateCcw size={16} />
                      {t("btnRestore")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="text-center text-agb-text-muted mt-4">
          {t("systemRestoreNotice")}
        </p>
      </div>
      <Modal
        open={modalState.isOpen}
        onClose={() =>
          !processing && setModalState({ isOpen: false, type: null, restorePoint: null })
        }
      >
        {modalState.type === "restore" && modalState.restorePoint && (
          <div className="bg-agb-card border border-agb-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4 pb-0">
            <h3 className="text-lg font-medium text-agb-text">{t("restoreSystemTitle")}</h3>

            <div className="p-4 pr-0">
              <p className="text-agb-text-secondary mb-4">
                {t("restoreSystemConfirm")}{" "}
                <span className="font-bold">"{modalState.restorePoint.Description}"?</span>{" "}
                {t("restoreSystemWarning")}
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() =>
                    !processing && setModalState({ isOpen: false, type: null, restorePoint: null })
                  }
                  disabled={processing}
                >
                  {t("cancel")}
                </Button>
                <Button variant="primary" onClick={executeRestore} disabled={processing}>
                  {processing ? <Loader2 size={16} className="animate-spin" /> : t("btnRestore")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={customModalOpen} onClose={() => !processing && setCustomModalOpen(false)}>
        <div className="bg-agb-card border border-agb-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4 pb-0">
          <h3 className="text-lg font-medium text-agb-text">{t("createCustomRestorePointTitle")}</h3>

          <div className="p-4 space-y-4">
            <Input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={t("enterRestorePointName")}
              disabled={processing}
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => !processing && setCustomModalOpen(false)}
                disabled={processing}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleCustomRestorePoint}
                disabled={processing || !customName.trim()}
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : (language === "pt" ? "Criar" : "Create")}
              </Button>
            </div>
            <p className="text-xs text-center text-agb-text-muted">
              {t("loadingSystemDataDesc")}
            </p>
          </div>
        </div>
      </Modal>
      <Modal open={confirmDeleteAll} onClose={() => !processing && setConfirmDeleteAll(false)}>
        <div className="bg-agb-card border border-agb-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4 pb-0">
          <h3 className="text-lg font-medium text-agb-text">{t("deleteAllRestorePointsTitle")}</h3>
          <div className="p-4 pr-0">
            <p className="text-agb-text-secondary mb-4">
              {t("deleteAllRestorePointsConfirm")}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => !processing && setConfirmDeleteAll(false)}
                disabled={processing}
              >
                {t("cancel")}
              </Button>
              <Button variant="danger" onClick={handleDeleteAll} disabled={processing}>
                {processing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  `${language === "pt" ? "Excluir Todos" : "Delete All"} (${restorePoints.length})`
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

function AppliedTweaksTab() {
  const { t, language } = useLanguageStore()
  const [tweaks, setTweaks] = useState<Tweak[]>([])
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [undoingTweak, setUndoingTweak] = useState<string | null>(null)
  const [confirmUndoAll, setConfirmUndoAll] = useState(false)
  const [showWhyNotReversible, setShowWhyNotReversible] = useState(false)
  const [nvidiaModalOpen, setNvidiaModalOpen] = useState(false)
  const [nvidiaTweak, setNvidiaTweak] = useState<Tweak | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [fetchedTweaks, savedStates] = await Promise.all([
        invoke({ channel: "tweaks:fetch" }),
        invoke({ channel: "tweak-states:load" }),
      ])
      setTweaks(fetchedTweaks)
      if (savedStates) {
        setToggleStates(JSON.parse(savedStates))
      }
    } catch (error) {
      toast.error(language === "pt" ? "Falha ao carregar ajustes aplicados." : "Failed to load applied tweaks.")
      log.error("Failed to load applied tweaks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const appliedTweaks = tweaks.filter((t) => toggleStates[t.name])

  const appliedTweakFiltered = appliedTweaks.filter(
    (t) => t.reversible === true || t.reversible === undefined,
  )

  const saveToggleStates = async (newStates: Record<string, boolean>) => {
    await invoke({ channel: "tweak-states:save", payload: JSON.stringify(newStates) })
  }

  const executeUndo = async (tweak: Tweak) => {
    toast.dismiss()
    setUndoingTweak(tweak.name)
    setProcessing(true)
    const tweakTitle = translateTweakTitle(tweak.name, tweak.title || tweak.name, language)
    const loadingToastId = toast.loading(
      `${language === "pt" ? "Desfazendo ajuste" : "Undoing tweak"}: ${tweakTitle}`,
    )
    try {
      const newStates = { ...toggleStates, [tweak.name]: false }
      setToggleStates(newStates)
      await saveToggleStates(newStates)

      const result = await invoke({ channel: "tweak:unapply", payload: tweak.name })
      if (result?.success) {
        toast.update(loadingToastId, {
          render: `${language === "pt" ? "Ajuste desfeito" : "Undid tweak"}: ${tweakTitle}`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
      } else {
        toast.update(loadingToastId, {
          render: `${language === "pt" ? "Falha ao desfazer ajuste" : "Failed to undo tweak"}: ${tweakTitle}`,
          type: "error",
          isLoading: false,
          autoClose: 3000,
        })
        const reverted = { ...toggleStates, [tweak.name]: true }
        setToggleStates(reverted)
        await saveToggleStates(reverted)
      }
    } catch (error) {
      log.error(`Error undoing tweak ${tweak.name}:`, error)
      toast.update(loadingToastId, {
        render: `${language === "pt" ? "Falha ao desfazer ajuste" : "Failed to undo tweak"}: ${tweakTitle}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
      const reverted = { ...toggleStates, [tweak.name]: true }
      setToggleStates(reverted)
      await saveToggleStates(reverted)
    }
    setProcessing(false)
    setUndoingTweak(null)
  }

  const handleUndo = async (tweak: Tweak) => {
    if (tweak.name === "optimize-nvidia-settings") {
      setNvidiaTweak(tweak)
      setNvidiaModalOpen(true)
      return
    }
    await executeUndo(tweak)
  }

  const handleUndoAll = async () => {
    setConfirmUndoAll(false)
    const reversibleNames = appliedTweaks
      .filter((t) => t.reversible !== false)
      .map((t) => t.name)
    if (reversibleNames.length === 0) return

    setProcessing(true)
    const toastId = toast.loading(
      language === "pt"
        ? `Desfazendo ${reversibleNames.length} ajuste(s)...`
        : `Undoing ${reversibleNames.length} tweak(s)...`,
    )
    try {
      const outcomes: Record<string, { success: boolean; error?: string }> =
        (await invoke({ channel: "tweak:unapply-batch", payload: reversibleNames })) || {}
      const successCount = Object.values(outcomes).filter((o) => o?.success).length
      const failCount = reversibleNames.length - successCount
      await loadData()
      toast.update(toastId, {
        render:
          failCount > 0
            ? language === "pt"
              ? `${successCount} ajuste(s) desfeito(s), ${failCount} falhou(aram).`
              : `${successCount} tweak(s) undone, ${failCount} failed.`
            : language === "pt"
              ? `Todos os ${successCount} ajustes foram desfeitos com sucesso!`
              : `All ${successCount} tweaks undone successfully!`,
        type: failCount > 0 ? "warning" : "success",
        isLoading: false,
        autoClose: 4000,
      })
    } catch (error: any) {
      log.error("Error undoing all tweaks:", error)
      toast.update(toastId, {
        render:
          language === "pt"
            ? `Falha ao desfazer ajustes: ${error?.message || error}`
            : `Failed to undo tweaks: ${error?.message || error}`,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <div className="h-full max-w-full space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-agb-text-secondary text-sm">
              {language === "pt"
                ? `${appliedTweaks.length} ajuste(s) atualmente aplicado(s)`
                : `${appliedTweaks.length} tweak${appliedTweaks.length !== 1 ? "s" : ""} currently applied`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={loadData}
              className="flex items-center gap-2"
              disabled={loading || processing}
            >
              <RotateCw size={16} /> {t("refresh")}
            </Button>
            <Button
              variant="danger"
              onClick={() => setConfirmUndoAll(true)}
              disabled={loading || processing || appliedTweakFiltered.length === 0}
              className="flex items-center gap-2"
            >
              <Undo2 size={16} /> {t("undoAllTweaks")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 size={32} className="text-agb-primary animate-spin" />
          </div>
        ) : appliedTweaks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-agb-card border border-agb-border rounded-lg">
            <div className="p-4 bg-agb-secondary rounded-full mb-4">
              <Wrench size={28} className="text-agb-text" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-agb-text">{t("noAppliedTweaks")}</h3>
            <p className="text-agb-text-secondary max-w-sm mb-4">
              {t("noAppliedTweaksDesc")}
            </p>
          </div>
        ) : (
          <Table className="max-h-[calc(100vh-270px)] min-h-[350px]">
            <TableHeader className="sticky top-0 bg-agb-card z-10 shadow-xs">
              <TableRow>
                <TableHead>{t("tweak")}</TableHead>
                <TableHead className="w-32 text-center">{t("colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appliedTweaks.map((tweak) => (
                <TableRow key={tweak.name}>
                  <TableCell>
                    <p className="font-medium">
                      {translateTweakTitle(tweak.name, tweak.title || tweak.name, language)}
                    </p>
                    <p className="text-xs text-agb-text-secondary mt-0.5">
                      {translateTweakDesc(tweak.name, tweak.description || "", language)}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    {tweak.reversible !== false ? (
                      <Button
                        variant="outline"
                        className="p-2! gap-2"
                        onClick={() => handleUndo(tweak)}
                        disabled={processing}
                        title={t("undo")}
                      >
                        {undoingTweak === tweak.name ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Undo2 size={16} />
                        )}
                        {t("undo")}
                      </Button>
                    ) : (
                      <span className="text-agb-text-secondary text-xs">{t("notReversible")}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowWhyNotReversible(true)}
            className="flex items-center gap-2"
          >
            <HelpCircle size={16} /> {t("whyNotReversible")}
          </Button>
        </div>
        {appliedTweaks.length > 0 && (
          <p className="text-center text-amber-600 text-sm">
            {t("undoWarningFootnote")}
          </p>
        )}
      </div>
      <Modal open={confirmUndoAll} onClose={() => !processing && setConfirmUndoAll(false)}>
        <div className="bg-agb-card border border-agb-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4 pb-0">
          <h3 className="text-lg font-medium text-agb-text">{t("confirmUndoAllTitle")}</h3>
          <div className="p-4 pr-0">
            <p className="text-agb-text-secondary mb-4">
              {language === "pt"
                ? `Tem certeza de que deseja desfazer todos os ${appliedTweakFiltered.length} ajustes aplicados? Isso executará o script de reversão de cada um e poderá exigir reinicialização.`
                : `Are you sure you want to undo all ${appliedTweakFiltered.length} applied tweak${appliedTweakFiltered.length !== 1 ? "s" : ""}? This will run the unapply script for each tweak and may require a restart.`}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => !processing && setConfirmUndoAll(false)}
                disabled={processing}
              >
                {t("cancel")}
              </Button>
              <Button variant="danger" onClick={handleUndoAll} disabled={processing}>
                {processing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  `${language === "pt" ? "Desfazer Todos" : "Undo All"} (${appliedTweakFiltered.length})`
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      <Modal open={nvidiaModalOpen} onClose={() => setNvidiaModalOpen(false)}>
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
              onClick={() => setNvidiaModalOpen(false)}
              disabled={processing}
              className="h-8.5 px-4 text-xs"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                if (nvidiaTweak) {
                  setNvidiaModalOpen(false)
                  await executeUndo(nvidiaTweak)
                }
              }}
              disabled={processing}
              className="flex items-center gap-1.5 h-8.5 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 size={14} />
              {t("btnConfirmRestored")}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal open={showWhyNotReversible} onClose={() => setShowWhyNotReversible(false)}>
        <div className="bg-agb-card border border-agb-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4">
          <h3 className="text-lg font-medium text-agb-text mb-4">
            {t("whyNotReversible")}
          </h3>
          <div className="text-agb-text-secondary text-sm leading-6 space-y-3">
            {language === "pt" ? (
              <>
                <p>
                  Alguns ajustes realizam modificações profundas no sistema que não podem ser revertidas automaticamente pelo AGB via script. No entanto, a maioria pode ser restaurada manualmente:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong className="text-agb-text">Despoluir o Windows:</strong> Aplicativos removidos podem ser reinstalados diretamente pela Microsoft Store.
                  </li>
                  <li>
                    <strong className="text-agb-text">Configurações NVIDIA:</strong> Podem ser restauradas para o padrão a qualquer momento pelo Painel de Controle NVIDIA.
                  </li>
                  <li>
                    <strong className="text-agb-text">Serviços do Windows:</strong> Podem ser reativados pelo Gerenciador de Serviços (`services.msc`).
                  </li>
                </ul>
                <p>
                  Embora esses ajustes não possuam reversão automática por script, você sempre pode criar um Ponto de Restauração antes de aplicá-los.
                </p>
                <p className="text-orange-400 text-xs">
                  Dica: Crie um ponto de restauração antes de aplicar ajustes não reversíveis para ter segurança total.
                </p>
              </>
            ) : (
              <>
                <p>
                  Some tweaks make changes that can't be automatically reversed by AGB. However,
                  most of these changes can still be undone manually:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong className="text-agb-text">Debloating Windows:</strong> Removed apps can
                    be reinstalled from the Microsoft Store
                  </li>
                  <li>
                    <strong className="text-agb-text">Optimize NVIDIA Settings:</strong> Settings
                    can be reset through the NVIDIA Control Panel
                  </li>
                  <li>
                    <strong className="text-agb-text">Service modifications:</strong> Services can
                    be re-enabled through Windows Services Manager
                  </li>
                </ul>
                <p>
                  While these tweaks don't have an automatic undo button, you can always create a
                  restore point before applying them.
                </p>
                <p className="text-orange-400 text-xs">
                  Tip: Create a restore point before applying non-reversible tweaks so you have an easy
                  fallback option.
                </p>
              </>
            )}
          </div>
          <div className="flex justify-end mt-6">
            <Button variant="primary" onClick={() => setShowWhyNotReversible(false)}>
              {language === "pt" ? "Entendido" : "Got it"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default function RestorePointManager() {
  const { t } = useLanguageStore()
  const [activeTab, setActiveTab] = useState<"restore" | "history">("restore")

  return (
    <RootDiv>
      <div className="max-w-full space-y-4 pb-12">
        <div className="flex gap-1.5 bg-agb-card border border-agb-border rounded-xl p-1.5 w-fit">
          <button
            onClick={() => setActiveTab("restore")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer active:scale-95 ${
              activeTab === "restore"
                ? "bg-agb-primary text-white shadow-md shadow-agb-primary/20"
                : "text-agb-text-secondary hover:text-agb-text hover:bg-agb-accent/30"
            }`}
          >
            <span className="flex items-center gap-2">
              <Shield size={16} />
              {t("tabRestorePoints")}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer active:scale-95 ${
              activeTab === "history"
                ? "bg-agb-primary text-white shadow-md shadow-agb-primary/20"
                : "text-agb-text-secondary hover:text-agb-text hover:bg-agb-accent/30"
            }`}
          >
            <span className="flex items-center gap-2">
              <Wrench size={16} />
              {t("tabRevertTweaks")}
            </span>
          </button>
        </div>

        {activeTab === "restore" ? <RestorePointsTab /> : <AppliedTweaksTab />}
      </div>
    </RootDiv>
  )
}
