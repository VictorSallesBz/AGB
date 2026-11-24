import { Menu, Minus, Shield, ShieldAlert, Square, X } from "lucide-react"
import { close, minimize, toggleMaximize, invoke } from "../lib/electron"
import agbLogo from "../../../../resources/agblogo.png"
import useLanguageStore from "../store/languageStore"

interface TitleBarProps {
  onToggleSidebar?: () => void
  sidebarCollapsed?: boolean
  adminStatus?: boolean | null
}

function TitleBar({
  onToggleSidebar,
  sidebarCollapsed: _sidebarCollapsed,
  adminStatus,
}: TitleBarProps): React.ReactElement {
  const { language } = useLanguageStore()

  const handleAdminClick = () => {
    if (adminStatus === false) {
      invoke({ channel: "relaunch-as-admin" })
    }
  }

  return (
    <>
      <div
        style={{ WebkitAppRegion: "drag" } as any}
        className="h-[50px] fixed top-0 left-0 right-0 flex justify-between items-center pl-4 bg-agb-bg z-50"
      >
        <div className="flex items-center gap-3 h-full pr-4">
          <button
            onClick={onToggleSidebar}
            className="h-7 w-7 inline-flex items-center justify-center text-agb-text-secondary hover:bg-agb-accent transition-colors rounded"
            style={{ WebkitAppRegion: "no-drag" } as any}
          >
            <Menu size={16} />
          </button>
          <img
            src={agbLogo}
            alt="AGB"
            className="h-6.5 w-6.5 object-contain rounded drop-shadow-[0_0_8px_rgba(99,102,241,0.35)]"
          />
          <span className="text-agb-text text-sm font-semibold tracking-wide">Advanced Gaming Booster</span>
        </div>
        <div />

        <div className="flex" style={{ WebkitAppRegion: "no-drag" } as any}>
          {adminStatus === true ? (
            <div
              className="h-12.5 w-12 inline-flex items-center justify-center text-agb-text-secondary hover:bg-agb-accent transition-colors cursor-default"
              title={
                language === "pt"
                  ? "Executando como Administrador"
                  : "Running as Administrator"
              }
            >
              <Shield className="w-5 h-5 text-agb-primary" />
            </div>
          ) : adminStatus === false ? (
            <button
              onClick={handleAdminClick}
              className="h-12.5 w-12 inline-flex items-center justify-center text-amber-500 hover:text-amber-400 hover:bg-amber-500/15 cursor-pointer transition-colors"
              title={
                language === "pt"
                  ? "Não está executando como Administrador. Clique para abrir como Administrador."
                  : "Not running as Administrator. Click to relaunch as Administrator."
              }
            >
              <ShieldAlert className="w-5 h-5" />
            </button>
          ) : (
            <div
              className="h-12.5 w-12 inline-flex items-center justify-center text-agb-text-secondary/50 cursor-default"
              title={
                language === "pt"
                  ? "Verificando permissões..."
                  : "Checking permissions..."
              }
            >
              <Shield className="w-5 h-5" />
            </div>
          )}
          <button
            onClick={minimize}
            className="h-12.5 w-12 inline-flex items-center justify-center text-agb-text-secondary hover:bg-agb-accent transition-colors"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={toggleMaximize}
            className="h-12.5 w-12 inline-flex items-center justify-center text-agb-text-secondary hover:bg-agb-accent transition-colors"
          >
            <Square size={14} />
          </button>
          <button
            onClick={close}
            className="h-12.5 w-12 inline-flex items-center justify-center text-agb-text-secondary hover:bg-red-600 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  )
}

export default TitleBar
