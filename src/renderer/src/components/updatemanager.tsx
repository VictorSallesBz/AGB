import { useState, useEffect, useMemo } from "react"
import Modal from "@/components/ui/modal"
import Button from "@/components/ui/button"
import { toast } from "react-toastify"
import useLanguageStore from "@/store/languageStore"

interface UpdatePayload {
  version?: string
  message?: string
  percent?: number
}

export default function UpdateManager(): React.ReactElement {
  const [updateOpen, setUpdateOpen] = useState(false)
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadPercent, setDownloadPercent] = useState(0)
  const isDownloaded = useMemo(() => downloadPercent >= 100, [downloadPercent])
  const isPt = useLanguageStore((state) => state.language === "pt")

  useEffect(() => {
    const onAvailable = (_e: any, payload: UpdatePayload) => {
      setUpdateVersion(payload?.version ?? null)
      setUpdateOpen(true)
      setIsDownloading(false)
      setDownloadPercent(0)
    }
    const onNotAvailable = () => {
      toast.success(isPt ? "Você já possui a versão mais recente." : "You're up to date")
    }
    const onError = (_e: any, payload: UpdatePayload) => {
      toast.error(payload?.message ?? (isPt ? "Erro na atualização" : "Update error"))
      setIsDownloading(false)
    }
    const onProgress = (_e: any, payload: UpdatePayload) => {
      setIsDownloading(true)
      setDownloadPercent(Math.max(0, Math.min(100, payload.percent || 0)))
    }
    const onDownloaded = () => {
      setIsDownloading(false)
      setDownloadPercent(100)
    }

    window.electron.ipcRenderer.on("updater:available", onAvailable)
    window.electron.ipcRenderer.on("updater:not-available", onNotAvailable)
    window.electron.ipcRenderer.on("updater:error", onError)
    window.electron.ipcRenderer.on("updater:download-progress", onProgress)
    window.electron.ipcRenderer.on("updater:downloaded", onDownloaded)

    return () => {
      window.electron.ipcRenderer.removeListener("updater:available", onAvailable)
      window.electron.ipcRenderer.removeListener("updater:not-available", onNotAvailable)
      window.electron.ipcRenderer.removeListener("updater:error", onError)
      window.electron.ipcRenderer.removeListener("updater:download-progress", onProgress)
      window.electron.ipcRenderer.removeListener("updater:downloaded", onDownloaded)
    }
  }, [isPt])

  const handleUpdateNow = async () => {
    if (isDownloaded) {
      await window.electron.ipcRenderer.invoke("updater:install")
      return
    }
    setIsDownloading(true)
    setDownloadPercent(0)
    await window.electron.ipcRenderer.invoke("updater:download")
  }

  return (
    <Modal open={updateOpen} onClose={() => setUpdateOpen(false)}>
      <div className="bg-agb-card border border-agb-border rounded-2xl p-5 shadow-xl max-w-lg w-full mx-4">
        <h2 className="text-xl font-semibold mb-2 text-agb-primary">
          {isPt ? "Atualização disponível" : "Update available"}{updateVersion ? ` (${updateVersion})` : ""}
        </h2>
        <p className="mb-6 text-agb-text">
          {isDownloaded
            ? isPt ? "A atualização foi baixada. Reinicie para instalar agora." : "The update has been downloaded. Restart to install now."
            : isDownloading
              ? isPt ? `Baixando atualização… ${Math.floor(downloadPercent)}%` : `Downloading update… ${Math.floor(downloadPercent)}%`
              : isPt ? "Uma nova versão do AGB está disponível no GitHub." : "A new AGB version is available on GitHub."}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setUpdateOpen(false)} disabled={isDownloading}>
            {isPt ? "Mais tarde" : "Later"}
          </Button>
          <Button onClick={handleUpdateNow} disabled={isDownloading}>
            {isDownloaded
              ? isPt ? "Reiniciar e instalar" : "Restart and install"
              : isDownloading
                ? isPt ? "Baixando…" : "Downloading…"
                : isPt ? "Atualizar agora" : "Update now"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
