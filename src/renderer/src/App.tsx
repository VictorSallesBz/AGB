import { useState, useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import TitleBar from "./components/titlebar"
import Nav from "./components/nav"
import "./app.css"
import { ToastContainer, Slide } from "react-toastify"
import Home from "./pages/Home"
import Tweaks from "./pages/Tweaks"
import Clean from "./pages/Clean"
import Utilities from "./pages/Utilities"
import DNS from "./pages/DNS"
import Settings from "./pages/Settings"
import Backup from "./pages/Backup"
import UpdateManager from "./components/updatemanager"
import useOnlineStore from "./store/online"
import Debloat from "./pages/Debloat"
import NoAdmin from "./components/noAdmin"

function App() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme")
    if (stored === "dark" || stored === "light" || stored === "system") return stored
    if (stored === "gray" || stored === "purple" || stored === "classic") {
      localStorage.setItem("theme", "dark")
      return "dark"
    }
    return "system"
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true",
  )
  const [adminStatus, setAdminStatus] = useState<boolean | null>(null)
  const [dismissedNoAdminModal, setDismissedNoAdminModal] = useState<boolean>(false)
  const { setOnline } = useOnlineStore()

  useEffect(() => {
    const applyTheme = (themeName: string) => {
      document.body.classList.remove("light", "dark", "purple", "gray", "classic")
      let activeTheme = themeName
      if (activeTheme === "gray" || activeTheme === "purple" || activeTheme === "classic") {
        activeTheme = "dark"
      }
      if (activeTheme === "system" || !activeTheme) {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        document.body.classList.add(systemTheme)
        document.body.setAttribute("data-theme", systemTheme)
      } else {
        document.body.classList.add(activeTheme)
        document.body.setAttribute("data-theme", activeTheme)
      }
    }

    applyTheme(theme)

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemThemeChange = () => {
      if ((localStorage.getItem("theme") || "system") === "system") applyTheme("system")
    }

    const handleStorageChange = (e) => {
      if (e.key === "theme") setTheme(e.newValue || "system")
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [theme])

  const toggleSidebar = () => {
    const newCollapsed = !sidebarCollapsed
    setSidebarCollapsed(newCollapsed)
    localStorage.setItem("sidebarCollapsed", newCollapsed.toString())
  }
  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [setOnline])

  useEffect(() => {
    const checkAdmin = () => {
      window.electron.ipcRenderer.invoke("get-admin-status").then((isAdmin: boolean) => {
        setAdminStatus(isAdmin)
      })
    }
    checkAdmin()
    window.addEventListener("focus", checkAdmin)
    return () => {
      window.removeEventListener("focus", checkAdmin)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-agb-bg text-agb-text overflow-hidden">
      <NoAdmin
        open={adminStatus === false && !dismissedNoAdminModal}
        onClose={() => setDismissedNoAdminModal(true)}
      />
      <TitleBar
        onToggleSidebar={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
        adminStatus={adminStatus}
      />
      <Nav collapsed={sidebarCollapsed} />
      <div className="flex flex-1 pt-[50px] h-[calc(100vh-50px)] overflow-hidden relative">
        <main
          className={`flex-1 h-full overflow-hidden p-6 pb-2 rounded-tl-2xl border-t border-l border-agb-border transition-all duration-300 ease-in-out ${sidebarCollapsed ? "ml-16" : "ml-52"}`}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tweaks" element={<Tweaks />} />
            <Route path="/debloat" element={<Debloat />} />
            <Route path="/clean" element={<Clean />} />
            <Route path="/backup" element={<Backup />} />
            <Route path="/utilities" element={<Utilities />} />
            <Route path="/dns" element={<DNS />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <UpdateManager />
      <ToastContainer
        stacked
        limit={5}
        position="bottom-right"
        theme="dark"
        transition={Slide}
        hideProgressBar
        pauseOnFocusLoss={false}
      />
    </div>
  )
}

export default App
