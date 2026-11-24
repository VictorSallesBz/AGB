import Modal from "./ui/modal"
import Button from "./ui/button"
import { invoke } from "@/lib/electron"
import useLanguageStore from "@/store/languageStore"

function NoAdmin({ open, onClose }: { open: boolean; onClose: () => void }) {
  const isPt = useLanguageStore((state) => state.language === "pt")

  const handleRelaunch = () => {
    invoke({ channel: "relaunch-as-admin" })
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-agb-card p-5 rounded-2xl border border-agb-border text-agb-text w-[90vw] max-w-md shadow-2xl">
        <h1 className="text-lg font-semibold mb-2 text-amber-400">
          {isPt ? "AGB sem privilégios de Administrador" : "AGB Not Running as Admin"}
        </h1>
        <p className="text-sm mb-5 text-agb-text-secondary">
          {isPt
            ? "O AGB não está sendo executado como administrador. Algumas otimizações, configurações de rede (DNS) e remoções podem falhar."
            : "AGB is not running with administrator privileges. Some system tweaks, DNS changes, and debloating actions may fail."}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            {isPt ? "Continuar assim" : "Continue anyway"}
          </Button>
          <Button variant="primary" onClick={handleRelaunch}>
            {isPt ? "Reiniciar como Administrador" : "Relaunch as Admin"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default NoAdmin
