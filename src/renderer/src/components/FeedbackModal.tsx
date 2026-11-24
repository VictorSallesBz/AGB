import { useState } from "react"
import { Bug, Sparkles, ExternalLink, FolderOpen, Copy, Check } from "lucide-react"
import { toast } from "react-toastify"
import Modal from "./ui/modal"
import Button from "./ui/button"
import { invoke } from "@/lib/electron"
import useLanguageStore from "@/store/languageStore"
import useSystemStore from "@/store/systemInfo"
import pkg from "../../../../package.json"

const REPO_URL = "https://github.com/VictorSallesBz/AGB"

type FeedbackType = "bug" | "feature"

export function FeedbackContent() {
  const { language } = useLanguageStore()
  const isPt = language === "pt"
  const systemInfo = useSystemStore((state) => state.systemInfo)

  const [type, setType] = useState<FeedbackType>("bug")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [stepsOrSolution, setStepsOrSolution] = useState("")
  const [includeSystemInfo, setIncludeSystemInfo] = useState(true)
  const [copied, setCopied] = useState(false)

  const buildSystemSummary = () => {
    const osText = [systemInfo?.os, systemInfo?.os_version].filter(Boolean).join(" ") || "Windows"
    const cpuText = systemInfo?.cpu_model || "N/A"
    const gpuText = systemInfo?.gpu_model || "N/A"
    return `AGB: v${pkg.version}\nSO: ${osText}\nCPU: ${cpuText}\nGPU: ${gpuText}`
  }

  const handleOpenLogs = async () => {
    try {
      await invoke({ channel: "open-log-folder" })
    } catch {
      toast.error(isPt ? "Não foi possível abrir a pasta de logs." : "Could not open log folder.")
    }
  }

  const handleCopySummary = async () => {
    const text =
      type === "bug"
        ? `[Bug]: ${title || "(Sem título)"}\n\nDescrição:\n${description || "-"}\n\nPassos para reproduzir:\n${stepsOrSolution || "-"}\n\nAmbiente:\n${buildSystemSummary()}`
        : `[Feature Request]: ${title || "(Sem título)"}\n\nProblema / Necessidade:\n${description || "-"}\n\nSolução Proposta:\n${stepsOrSolution || "-"}`

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(isPt ? "Relatório copiado para a área de transferência!" : "Report copied to clipboard!")
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error(isPt ? "Falha ao copiar relatório." : "Failed to copy report.")
    }
  }

  const handleOpenGitHub = () => {
    const params = new URLSearchParams()

    if (type === "bug") {
      params.set("template", "bug.yml")
      params.set("title", title.trim() ? `[Bug]: ${title.trim()}` : "[Bug]: ")
      if (description.trim()) params.set("description", description.trim())
      if (stepsOrSolution.trim()) params.set("steps", stepsOrSolution.trim())
      params.set("version", pkg.version)
      const osString = [systemInfo?.os, systemInfo?.os_version].filter(Boolean).join(" ").trim()
      if (osString) params.set("windows_version", osString)
      if (includeSystemInfo) {
        params.set(
          "additional",
          `CPU: ${systemInfo?.cpu_model || "N/A"}\nGPU: ${systemInfo?.gpu_model || "N/A"}`,
        )
      }
    } else {
      params.set("template", "feature_request.yml")
      params.set(
        "title",
        title.trim() ? `[Feature Request]: ${title.trim()}` : "[Feature Request]: ",
      )
      if (description.trim()) params.set("problem", description.trim())
      if (stepsOrSolution.trim()) params.set("solution", stepsOrSolution.trim())
    }

    window.open(`${REPO_URL}/issues/new?${params.toString()}`, "_blank")
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex p-1 bg-agb-bg border border-agb-border rounded-xl w-full">
        <button
          type="button"
          onClick={() => setType("bug")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            type === "bug"
              ? "bg-red-500/20 text-red-300 border border-red-500/30 shadow-xs"
              : "text-agb-text-secondary hover:text-agb-text"
          }`}
        >
          <Bug className="w-3.5 h-3.5" />
          <span>{isPt ? "Reportar Bug" : "Report Bug"}</span>
        </button>
        <button
          type="button"
          onClick={() => setType("feature")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            type === "feature"
              ? "bg-agb-primary/20 text-agb-primary border border-agb-primary/30 shadow-xs"
              : "text-agb-text-secondary hover:text-agb-text"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isPt ? "Sugerir Funcionalidade" : "Request Feature"}</span>
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-agb-text mb-1">
            {isPt ? "Título" : "Title"}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === "bug"
                ? isPt
                  ? "Ex: Ajuste X não aplica ao reiniciar"
                  : "E.g. Tweak X resets after reboot"
                : isPt
                  ? "Ex: Adicionar agendamento semanal na Limpeza"
                  : "E.g. Add weekly schedule to Cleaner"
            }
            className="w-full px-3 py-2 rounded-lg bg-agb-bg border border-agb-border text-sm text-agb-text placeholder:text-agb-text-muted focus:outline-hidden focus:border-agb-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-agb-text mb-1">
            {type === "bug"
              ? isPt
                ? "O que aconteceu?"
                : "What happened?"
              : isPt
                ? "Qual problema isso resolve / O que você gostaria de ver?"
                : "What problem does this solve / What would you like added?"}
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === "bug"
                ? isPt
                  ? "Descreva o erro ou comportamento inesperado..."
                  : "Describe the error or unexpected behavior..."
                : isPt
                  ? "Explique sua sugestão com detalhes..."
                  : "Explain your suggestion in detail..."
            }
            className="w-full px-3 py-2 rounded-lg bg-agb-bg border border-agb-border text-sm text-agb-text placeholder:text-agb-text-muted focus:outline-hidden focus:border-agb-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-agb-text mb-1">
            {type === "bug"
              ? isPt
                ? "Passos para reproduzir (opcional)"
                : "Steps to reproduce (optional)"
              : isPt
                ? "Como você imagina funcionando (opcional)"
                : "Proposed solution (optional)"}
          </label>
          <textarea
            rows={2}
            value={stepsOrSolution}
            onChange={(e) => setStepsOrSolution(e.target.value)}
            placeholder={
              type === "bug"
                ? isPt
                  ? "1. Abri a aba...\n2. Cliquei em..."
                  : "1. Opened tab...\n2. Clicked..."
                : isPt
                  ? "Ex: Um botão na tela inicial que..."
                  : "E.g. A toggle on the Home tab that..."
            }
            className="w-full px-3 py-2 rounded-lg bg-agb-bg border border-agb-border text-sm text-agb-text placeholder:text-agb-text-muted focus:outline-hidden focus:border-agb-primary resize-none"
          />
        </div>

        {type === "bug" && (
          <label className="flex items-center gap-2 text-xs text-agb-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeSystemInfo}
              onChange={(e) => setIncludeSystemInfo(e.target.checked)}
              className="rounded border-agb-border accent-agb-primary"
            />
            <span>
              {isPt
                ? "Anexar automaticamente versão do AGB, Windows, CPU e GPU no formulário"
                : "Automatically include AGB version, Windows, CPU, and GPU in the issue form"}
            </span>
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {type === "bug" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenLogs}
              className="flex items-center gap-1.5 text-xs"
              title={isPt ? "Abrir pasta com o arquivo main.log para anexar" : "Open folder with main.log"}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{isPt ? "Abrir Pasta de Logs" : "Open Logs"}</span>
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isPt ? "Copiar Resumo" : "Copy Summary"}</span>
          </Button>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenGitHub}
          className="flex items-center gap-1.5 text-xs font-semibold"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>
            {type === "bug"
              ? isPt
                ? "Reportar no GitHub"
                : "Submit Bug on GitHub"
              : isPt
                ? "Enviar Sugestão no GitHub"
                : "Submit Request on GitHub"}
          </span>
        </Button>
      </div>
    </div>
  )
}

export default function FeedbackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { language } = useLanguageStore()
  const isPt = language === "pt"

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-agb-card border border-agb-border rounded-2xl p-5 shadow-2xl max-w-xl w-full mx-4">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-agb-border">
          <div className="w-10 h-10 rounded-xl bg-agb-primary/15 text-agb-primary flex items-center justify-center shrink-0">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-agb-text">
              {isPt ? "Bugs e Sugestões (GitHub)" : "Bugs & Feature Requests (GitHub)"}
            </h3>
            <p className="text-xs text-agb-text-secondary">
              {isPt
                ? "Envie erros encontrados ou ideias de novas funções direto pelo GitHub Issues"
                : "Report bugs or suggest new features directly via GitHub Issues"}
            </p>
          </div>
        </div>

        <FeedbackContent />

        <div className="flex justify-end mt-5 pt-3 border-t border-agb-border">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {isPt ? "Fechar" : "Close"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
