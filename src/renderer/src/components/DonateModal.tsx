import { useState } from "react"
import { Heart, Copy, Check, ExternalLink, Coffee, QrCode } from "lucide-react"
import { toast } from "react-toastify"
import Modal from "./ui/modal"
import Button from "./ui/button"
import useLanguageStore from "@/store/languageStore"
import pixQrCode from "../../../../resources/pix-qrcode.png"

const PIX_KEY = "0dfceb96-ffaf-4301-bd4d-4f48cb4b3a11"
const PIX_PAYLOAD =
  "00020126580014br.gov.bcb.pix01360dfceb96-ffaf-4301-bd4d-4f48cb4b3a115204000053039865802BR5913Victor Salles6009Sao Paulo62230519daqr120926339986162630448D6"
const KOFI_URL = "https://ko-fi.com/victorsalles"

export function DonateContent() {
  const { language } = useLanguageStore()
  const isPt = language === "pt"
  const [copiedField, setCopiedField] = useState<"key" | "payload" | null>(null)

  const handleCopy = async (value: string, field: "key" | "payload", labelPt: string, labelEn: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      toast.success(isPt ? `${labelPt} copiado!` : `${labelEn} copied!`)
      setTimeout(() => {
        setCopiedField((prev) => (prev === field ? null : prev))
      }, 2500)
    } catch {
      toast.error(isPt ? "Não foi possível copiar para a área de transferência." : "Could not copy to clipboard.")
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-agb-text-secondary leading-relaxed">
        {isPt
          ? "O AGB é gratuito e open-source. Se ele ajudou a melhorar o desempenho do seu PC e jogos, considere apoiar o desenvolvimento!"
          : "AGB is free and open-source. If it helped boost your PC and gaming performance, consider supporting its development!"}
      </p>

      {/* PIX (Brasil) */}
      <div className="p-4 rounded-xl bg-agb-bg border border-agb-border space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-agb-text">
              {isPt ? "PIX (Brasil • Instantâneo)" : "PIX (Brazil • Instant)"}
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
            {isPt ? "Taxa Zero" : "Zero Fee"}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="p-2.5 bg-white rounded-xl shadow-md shrink-0">
            <img
              src={pixQrCode}
              alt="QR Code PIX - Victor Salles"
              className="w-36 h-36 object-contain"
            />
          </div>

          <div className="flex-1 w-full space-y-2.5 min-w-0">
            <div className="text-xs text-agb-text-secondary">
              <span className="font-medium text-agb-text">{isPt ? "Favorecido:" : "Recipient:"}</span>{" "}
              Victor Salles (Mercado Pago)
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-medium text-agb-text-muted uppercase tracking-wider">
                {isPt ? "Chave Aleatória" : "Random Key"}
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-agb-card border border-agb-border text-[11px] font-mono text-agb-text truncate">
                  {PIX_KEY}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy(PIX_KEY, "key", "Chave PIX", "PIX Key")}
                  className="shrink-0 flex items-center gap-1.5 text-xs"
                >
                  {copiedField === "key" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{isPt ? "Copiar Chave PIX" : "Copy PIX Key"}</span>
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-medium text-agb-text-muted uppercase tracking-wider">
                {isPt ? "PIX Copia e Cola" : "PIX Copy & Paste"}
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-agb-card border border-agb-border text-[11px] font-mono text-agb-text-secondary truncate">
                  {PIX_PAYLOAD}
                </code>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    handleCopy(PIX_PAYLOAD, "payload", "Código PIX Copia e Cola", "PIX Payload")
                  }
                  className="shrink-0 flex items-center gap-1.5 text-xs"
                >
                  {copiedField === "payload" ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{isPt ? "Copiar PIX Copia e Cola" : "Copy PIX Payload"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ko-fi (Internacional / PayPal / Cartão) */}
      <div className="p-4 rounded-xl bg-agb-bg border border-agb-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-agb-text">
              {isPt ? "Ko-fi (PayPal / Cartão / Internacional)" : "Ko-fi (PayPal / Card / International)"}
            </h4>
            <p className="text-xs text-agb-text-secondary">
              {isPt
                ? "Apoie com qualquer valor via PayPal ou cartão pela página oficial no Ko-fi."
                : "Support with any amount via PayPal or card on the official Ko-fi page."}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open(KOFI_URL, "_blank")}
          className="shrink-0 flex items-center gap-1.5 text-xs border-sky-500/40 hover:border-sky-400"
        >
          <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
          <span>{isPt ? "Apoiar no Ko-fi" : "Support on Ko-fi"}</span>
        </Button>
      </div>
    </div>
  )
}

export default function DonateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { language } = useLanguageStore()
  const isPt = language === "pt"

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-agb-card border border-agb-border rounded-2xl p-5 shadow-2xl max-w-xl w-full mx-4">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-agb-border">
          <div className="w-10 h-10 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 fill-pink-500/30" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-agb-text">
              {isPt ? "Apoiar o AGB" : "Support AGB"}
            </h3>
            <p className="text-xs text-agb-text-secondary">
              {isPt
                ? "Contribua para manter o projeto atualizado e gratuito"
                : "Help keep the project updated and free"}
            </p>
          </div>
        </div>

        <DonateContent />

        <div className="flex justify-end mt-5 pt-3 border-t border-agb-border">
          <Button variant="primary" size="sm" onClick={onClose}>
            {isPt ? "Fechar" : "Close"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
