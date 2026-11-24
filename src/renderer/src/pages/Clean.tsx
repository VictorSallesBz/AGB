import Button from "@/components/ui/button"
import Toggle from "@/components/ui/Toggle"
import { useState, useEffect } from "react"
import { invoke } from "@/lib/electron"
import RootDiv from "@/components/rootdiv"
import {
  Icon,
  FileX,
  Gauge,
  Trash2,
  Download,
  Image,
  Bug,
  LoaderCircle,
  HardDrive,
  ExternalLink,
  Globe,
  Cpu,
} from "lucide-react"
import { broom } from "@lucide/lab"
import { toast } from "react-toastify"
import log from "electron-log/renderer"
import Card from "@/components/ui/Card"
import useLanguageStore from "@/store/languageStore"

const cleanups = [
  {
    id: "temp",
    label: "Clean Temporary Files",
    path: "C:\\Windows\\Temp",
    description: "Remove system and user temporary files.",
    icon: <FileX className="w-5 h-5" />,
    script: `
      $systemTemp = "$env:SystemRoot\\Temp"
      $userTemp = [System.IO.Path]::GetTempPath()
      $foldersToClean = @($systemTemp, $userTemp)
      $totalSizeBefore = 0
      
      foreach ($folder in $foldersToClean) {
          if (Test-Path $folder) {
              $folderSize = (Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
              $totalSizeBefore += if ($folderSize) { $folderSize } else { 0 }
              Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
          }
      }
      
      Write-Output $totalSizeBefore
    `,
    sizeScript: `
      $systemTemp = "$env:SystemRoot\\Temp"
      $userTemp = [System.IO.Path]::GetTempPath()
      $foldersToClean = @($systemTemp, $userTemp)
      $totalSize = 0
      foreach ($folder in $foldersToClean) {
          if (Test-Path $folder) {
              $folderSize = (Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
              $totalSize += if ($folderSize) { $folderSize } else { 0 }
          }
      }
      Write-Output $totalSize
    `,
  },
  {
    id: "prefetch",
    label: "Clean Prefetch Files",
    path: "C:\\Windows\\Prefetch",
    description: "Delete files from the Windows Prefetch folder.",
    icon: <Gauge className="w-5 h-5" />,
    script: `
      $prefetch = "$env:SystemRoot\\Prefetch"
      $totalSizeBefore = 0
      if (Test-Path $prefetch) {
          $totalSizeBefore = (Get-ChildItem -Path "$prefetch\\*" -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
          Remove-Item "$prefetch\\*" -Force -Recurse -ErrorAction SilentlyContinue
      }
      Write-Output $totalSizeBefore
    `,
    sizeScript: `
      $prefetch = "$env:SystemRoot\\Prefetch"
      $totalSize = 0
      if (Test-Path $prefetch) {
          $totalSize = (Get-ChildItem -Path "$prefetch\\*" -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
      }
      Write-Output $totalSize
    `,
  },
  {
    id: "recyclebin",
    label: "Empty Recycle Bin",
    path: "Recycle Bin",
    description: "Permanently remove files from the Recycle Bin.",
    icon: <Trash2 className="w-5 h-5" />,
    script: `
      $recycleBinSize = 0
      $shell = New-Object -ComObject Shell.Application
      $recycleBin = $shell.Namespace(0xA)
      $recycleBinSize = ($recycleBin.Items() | Measure-Object -Property Size -Sum).Sum
      if ($null -eq $recycleBinSize) { $recycleBinSize = 0 }
      Clear-RecycleBin -Force -ErrorAction SilentlyContinue
      Write-Output $recycleBinSize
    `,
    sizeScript: `
      $recycleBinSize = 0
      $shell = New-Object -ComObject Shell.Application
      $recycleBin = $shell.Namespace(0xA)
      $recycleBinSize = ($recycleBin.Items() | Measure-Object -Property Size -Sum).Sum
      if ($null -eq $recycleBinSize) { $recycleBinSize = 0 }
      Write-Output $recycleBinSize
    `,
  },
  {
    id: "windows-update",
    label: "Clean Windows Update Cache",
    path: "C:\\Windows\\SoftwareDistribution\\Download",
    description: "Remove Windows Update downloaded installation files.",
    icon: <Download className="w-5 h-5" />,
    script: `
      $windowsUpdateDownload = "$env:SystemRoot\\SoftwareDistribution\\Download"
      $totalSizeBefore = 0
      if (Test-Path $windowsUpdateDownload) {
          $totalSizeBefore = (Get-ChildItem -Path "$windowsUpdateDownload\\*" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
          Remove-Item "$windowsUpdateDownload\\*" -Force -Recurse -ErrorAction SilentlyContinue
      }
      Write-Output $totalSizeBefore
    `,
    sizeScript: `
      $windowsUpdateDownload = "$env:SystemRoot\\SoftwareDistribution\\Download"
      $totalSize = 0
      if (Test-Path $windowsUpdateDownload) {
          $totalSize = (Get-ChildItem -Path "$windowsUpdateDownload\\*" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
      }
      Write-Output $totalSize
    `,
  },
  {
    id: "thumbnails",
    label: "Clear Thumbnail Cache",
    path: "C:\\Users\\<User>\\AppData\\Local\\Microsoft\\Windows\\Explorer",
    description: "Remove cached thumbnail images used by File Explorer.",
    icon: <Image className="w-5 h-5" />,
    script: `
      $thumbCache = "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer"
      $totalSizeBefore = 0
      $thumbFiles = Get-ChildItem "$thumbCache\\thumbcache_*.db" -ErrorAction SilentlyContinue
      if ($thumbFiles) {
          $totalSizeBefore = ($thumbFiles | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
          Remove-Item "$thumbCache\\thumbcache_*.db" -Force -ErrorAction SilentlyContinue
      }
      Write-Output $totalSizeBefore
    `,
    sizeScript: `
      $thumbCache = "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer"
      $totalSize = 0
      $thumbFiles = Get-ChildItem "$thumbCache\\thumbcache_*.db" -ErrorAction SilentlyContinue
      if ($thumbFiles) {
          $totalSize = ($thumbFiles | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
      }
      Write-Output $totalSize
    `,
  },
  {
    id: "errorreports",
    label: "Clear Error Reports",
    path: "C:\\Users\\<User>\\AppData\\Local\\CrashDumps",
    description: "Remove error report and crash dump files.",
    icon: <Bug className="w-5 h-5" />,
    script: `
      $crashDumps = "$env:LOCALAPPDATA\\CrashDumps"
      $totalSizeBefore = 0
      if (Test-Path $crashDumps) {
          $totalSizeBefore = (Get-ChildItem -Path "$crashDumps\\*" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
          Remove-Item "$crashDumps\\*" -Force -Recurse -ErrorAction SilentlyContinue
      }
      Write-Output $totalSizeBefore
    `,
    sizeScript: `
      $crashDumps = "$env:LOCALAPPDATA\\CrashDumps"
      $totalSize = 0
      if (Test-Path $crashDumps) {
          $totalSize = (Get-ChildItem -Path "$crashDumps\\*" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
      }
      Write-Output $totalSize
    `,
  },
  {
    id: "shadercache",
    label: "Deep Shader Cache Cleaner",
    path: "DirectX / NVIDIA / AMD / Vulkan Shader Caches",
    description: "Clear stale compiled shaders to free disk space and prevent game micro-stutters.",
    icon: <Gauge className="w-5 h-5" />,
    script: `
      $shaderPaths = @(
        "$env:LOCALAPPDATA\\D3DSCache",
        "$env:LOCALAPPDATA\\NVIDIA\\DXCache",
        "$env:LOCALAPPDATA\\NVIDIA\\GLCache",
        "$env:APPDATA\\NVIDIA\\ComputeCache",
        "$env:LOCALAPPDATA\\AMD\\DxCache",
        "$env:LOCALAPPDATA\\AMD\\GLCache",
        "$env:LOCALAPPDATA\\Intel\\ShaderCache",
        "\${env:ProgramFiles(x86)}\\Steam\\steamapps\\shadercache"
      )
      $totalSizeBefore = 0
      foreach ($path in $shaderPaths) {
        if (Test-Path $path) {
          $size = (Get-ChildItem -Path "$path\\*" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
          $totalSizeBefore += if ($size) { $size } else { 0 }
          Remove-Item "$path\\*" -Force -Recurse -ErrorAction SilentlyContinue
        }
      }
      Write-Output $totalSizeBefore
    `,
    sizeScript: `
      $shaderPaths = @(
        "$env:LOCALAPPDATA\\D3DSCache",
        "$env:LOCALAPPDATA\\NVIDIA\\DXCache",
        "$env:LOCALAPPDATA\\NVIDIA\\GLCache",
        "$env:APPDATA\\NVIDIA\\ComputeCache",
        "$env:LOCALAPPDATA\\AMD\\DxCache",
        "$env:LOCALAPPDATA\\AMD\\GLCache",
        "$env:LOCALAPPDATA\\Intel\\ShaderCache",
        "\${env:ProgramFiles(x86)}\\Steam\\steamapps\\shadercache"
      )
      $totalSize = 0
      foreach ($path in $shaderPaths) {
        if (Test-Path $path) {
          $size = (Get-ChildItem -Path "$path\\*" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
          $totalSize += if ($size) { $size } else { 0 }
        }
      }
      Write-Output $totalSize
    `,
  },
  {
    id: "browsercache",
    label: "Clean Browser Cache",
    path: "Chrome / Edge / Brave / Opera (Cache Only)",
    description: "Remove temporary browser caches safely without deleting passwords, cookies, logins, or history.",
    icon: <Globe className="w-5 h-5" />,
    script: `
      $cachePaths = @(
        "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\Cache\\Cache_Data",
        "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\Code Cache",
        "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\GPUCache",
        "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\Cache\\Cache_Data",
        "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\Code Cache",
        "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\GPUCache",
        "$env:LOCALAPPDATA\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Cache\\Cache_Data",
        "$env:LOCALAPPDATA\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Code Cache",
        "$env:LOCALAPPDATA\\BraveSoftware\\Brave-Browser\\User Data\\Default\\GPUCache",
        "$env:APPDATA\\Opera Software\\Opera Stable\\Cache\\Cache_Data",
        "$env:APPDATA\\Opera Software\\Opera GX Stable\\Cache\\Cache_Data"
      )
      $totalSizeBefore = 0
      foreach ($p in $cachePaths) {
        if (Test-Path $p) {
          $size = (Get-ChildItem -Path "$p\\*" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
          $totalSizeBefore += if ($size) { $size } else { 0 }
          Remove-Item "$p\\*" -Force -Recurse -ErrorAction SilentlyContinue
        }
      }
      Write-Output $totalSizeBefore
    `,
    sizeScript: `
      $cachePaths = @(
        "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\Cache\\Cache_Data",
        "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\Code Cache",
        "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\GPUCache",
        "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\Cache\\Cache_Data",
        "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\Code Cache",
        "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\GPUCache",
        "$env:LOCALAPPDATA\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Cache\\Cache_Data",
        "$env:LOCALAPPDATA\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Code Cache",
        "$env:LOCALAPPDATA\\BraveSoftware\\Brave-Browser\\User Data\\Default\\GPUCache",
        "$env:APPDATA\\Opera Software\\Opera Stable\\Cache\\Cache_Data",
        "$env:APPDATA\\Opera Software\\Opera GX Stable\\Cache\\Cache_Data"
      )
      $totalSize = 0
      foreach ($p in $cachePaths) {
        if (Test-Path $p) {
          $size = (Get-ChildItem -Path "$p\\*" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
          $totalSize += if ($size) { $size } else { 0 }
        }
      }
      Write-Output $totalSize
    `,
  },
  {
    id: "ramstandby",
    label: "Optimize Idle RAM",
    path: "Background Working Sets (Windows Memory API)",
    description: "Safely frees idle RAM held by background apps without touching games, Steam, or Discord.",
    icon: <Cpu className="w-5 h-5" />,
    script: `
      $code = @'
      using System;
      using System.Runtime.InteropServices;
      public class AGBRamCleaner {
          [DllImport("psapi.dll")]
          public static extern bool EmptyWorkingSet(IntPtr hProcess);
      }
'@
      Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
      $skip = @("idle","system","registry","smss","csrss","wininit","services","lsass","svchost","dwm","explorer","audiodg","agb","electron","steam","steamwebhelper","discord","cs2","valorant","vgc","faceit","faceitclient")
      $before = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory * 1024
      Get-Process -ErrorAction SilentlyContinue | Where-Object { $skip -notcontains $_.ProcessName.ToLower() -and $_.WorkingSet64 -gt 30MB } | ForEach-Object {
        try { [AGBRamCleaner]::EmptyWorkingSet($_.Handle) | Out-Null } catch {}
      }
      Start-Sleep -Milliseconds 300
      $after = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory * 1024
      $freed = if ($after -gt $before) { $after - $before } else { 0 }
      Write-Output $freed
    `,
    sizeScript: `
      $skip = @("idle","system","registry","smss","csrss","wininit","services","lsass","svchost","dwm","explorer","audiodg","agb","electron","steam","steamwebhelper","discord","cs2","valorant","vgc","faceit","faceitclient")
      $sum = (Get-Process -ErrorAction SilentlyContinue | Where-Object { $skip -notcontains $_.ProcessName.ToLower() -and $_.WorkingSet64 -gt 50MB } | Measure-Object -Property WorkingSet64 -Sum).Sum
      Write-Output ([int64]($sum * 0.4))
    `,
  },
]

function Clean() {
  const { t, language, tCleanup } = useLanguageStore()
  const [selected, setSelected] = useState<string[]>([])
  const [loadingQueue, setLoadingQueue] = useState<string[]>([])
  const [lastClean, setLastClean] = useState(
    localStorage.getItem("last-clean") || "",
  )
  const [isCleaning, setIsCleaning] = useState(false)
  const [cleanupResults, setCleanupResults] = useState({})
  const [currentSizes, setCurrentSizes] = useState<Record<string, number>>({})
  const [loadingSizes, setLoadingSizes] = useState(false)
  const [storageSenseEnabled, setStorageSenseEnabled] = useState(false)
  const [loadingStorageSense, setLoadingStorageSense] = useState(false)

  const checkStorageSense = async () => {
    try {
      const script = `
        $path = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy"
        if (Test-Path $path) {
          $value = Get-ItemProperty -Path $path -Name "01" -ErrorAction SilentlyContinue
          if ($value."01" -eq 1) { Write-Output "enabled" } else { Write-Output "disabled" }
        } else {
          Write-Output "disabled"
        }
      `
      const result = await invoke({ channel: "run-powershell", payload: { script, name: "check-storagesense" } })
      if (result && result.success) {
        setStorageSenseEnabled(result.output.trim().toLowerCase() === "enabled")
      }
    } catch (e) {
      console.error("Failed to check Storage Sense:", e)
    }
  }

  const toggleStorageSense = async (newState: boolean) => {
    setLoadingStorageSense(true)
    const toastId = toast.loading(
      language === "pt"
        ? `${newState ? "Ativando" : "Desativando"} Sensor de Armazenamento...`
        : `${newState ? "Enabling" : "Disabling"} Storage Sense...`,
    )
    try {
      const script = newState
        ? `
        $path = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy"
        if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
        Set-ItemProperty -Path $path -Name "01" -Value 1
      `
        : `
        $path = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy"
        if (Test-Path $path) { Set-ItemProperty -Path $path -Name "01" -Value 0 }
      `
      await invoke({ channel: "run-powershell", payload: { script, name: "toggle-storagesense" } })
      setStorageSenseEnabled(newState)
      toast.update(toastId, {
        render: newState
          ? (t("storageSenseEnabledToast") || "Sensor de Armazenamento ativado com sucesso!")
          : (t("storageSenseDisabledToast") || "Sensor de Armazenamento desativado."),
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })
    } catch (e) {
      toast.update(toastId, {
        render: language === "pt" ? "Falha ao alterar Sensor de Armazenamento." : "Failed to toggle Storage Sense.",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      })
    } finally {
      setLoadingStorageSense(false)
    }
  }

  const openStorageSenseSettings = () => {
    invoke({
      channel: "run-powershell",
      payload: { script: "Start-Process 'ms-settings:storagesense'", name: "open-storagesense-settings" },
    })
  }

  const toggleCleanup = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return "0 B"
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  async function fetchSizes(silent = false) {
    if (!silent) setLoadingSizes(true)

    await Promise.all(
      cleanups
        .filter((cleanup) => cleanup.sizeScript)
        .map(async (cleanup) => {
          try {
            const result = await invoke({
              channel: "run-powershell",
              payload: { script: cleanup.sizeScript, name: `size-${cleanup.id}` },
            })
            const resultStr = result?.output || "0"
            setCurrentSizes((prev) => ({
              ...prev,
              [cleanup.id]: parseInt(resultStr.trim(), 10) || 0,
            }))
          } catch (err) {
            log.error(`Failed to fetch size for ${cleanup.id}: ${err}`)
            setCurrentSizes((prev) => ({ ...prev, [cleanup.id]: 0 }))
          }
        }),
    )

    if (!silent) setLoadingSizes(false)
  }

  useEffect(() => {
    fetchSizes()
    checkStorageSense()
  }, [])

  const totalSize = Object.values(currentSizes).reduce((sum, size) => sum + (size || 0), 0)
  const totalFreed = Object.values(cleanupResults as Record<string, number>).reduce(
    (sum: number, size) => sum + (size || 0),
    0,
  )

  async function runSelectedCleanups() {
    const selectedCleanups = cleanups.filter((c) => selected.includes(c.id))
    if (selectedCleanups.length === 0) return

    setIsCleaning(true)
    setLoadingQueue([])
    setCleanupResults({})
    let anySuccess = false
    let failedCount = 0
    const newResults: Record<string, number> = {}
    let totalFreedBytes = 0

    const toastId = toast.loading(
      language === "pt"
        ? `Iniciando limpeza (${selectedCleanups.length} itens)...`
        : `Starting cleanup (${selectedCleanups.length} items)...`,
    )

    try {
      for (let i = 0; i < selectedCleanups.length; i++) {
        const cleanup = selectedCleanups[i]
        setLoadingQueue([cleanup.id])
        const translated = tCleanup(cleanup.id, cleanup.label, cleanup.description)
        const displayLabel = translated.label

        toast.update(toastId, {
          render:
            language === "pt"
              ? `Executando ${displayLabel} (${i + 1}/${selectedCleanups.length})...`
              : `Running ${displayLabel} (${i + 1}/${selectedCleanups.length})...`,
          isLoading: true,
        })

        try {
          const result = await invoke({
            channel: "run-powershell",
            payload: { script: cleanup.script, name: `cleanup-${cleanup.id}` },
          })

          const resultStr = result?.output || "0"
          const freedSpace = parseInt(resultStr.trim(), 10) || 0
          newResults[cleanup.id] = freedSpace
          totalFreedBytes += freedSpace
          anySuccess = true
        } catch (err: any) {
          failedCount++
          log.error(`Failed to run ${cleanup.id} cleanup: ${err.message || err}`)
        }
      }

      if (anySuccess) {
        const now = new Date().toLocaleString()
        setLastClean(now)
        localStorage.setItem("last-clean", now)
        setCleanupResults(newResults)
        fetchSizes(true)
      }

      if (failedCount > 0 && !anySuccess) {
        toast.update(toastId, {
          render:
            language === "pt"
              ? "Falha ao executar a limpeza selecionada."
              : "Failed to run selected cleanups.",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        })
      } else if (failedCount > 0) {
        toast.update(toastId, {
          render:
            language === "pt"
              ? `Limpeza concluída com ${failedCount} falha(s). ${formatBytes(totalFreedBytes)} liberados.`
              : `Cleanup finished with ${failedCount} error(s). ${formatBytes(totalFreedBytes)} freed.`,
          type: "warning",
          isLoading: false,
          autoClose: 4500,
        })
      } else {
        toast.update(toastId, {
          render:
            language === "pt"
              ? `Limpeza concluída! ${formatBytes(totalFreedBytes)} liberados.`
              : `Cleanup completed! ${formatBytes(totalFreedBytes)} freed.`,
          type: "success",
          isLoading: false,
          autoClose: 3500,
        })
      }
    } finally {
      setLoadingQueue([])
      setIsCleaning(false)
    }
  }

  return (
    <RootDiv>
      <div className="flex flex-col gap-6 pb-12">
        <Card className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-agb-primary/10 text-agb-primary shrink-0 shadow-xs">
              <Icon iconNode={broom} className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-agb-text">{t("systemCleanerTitle")}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5 text-xs text-agb-text-secondary">
                <span>
                  {t("lastCleanedLabel")} <strong className="text-agb-text font-medium">{lastClean || t("notCleanedYet")}</strong>
                </span>
                <span className="text-agb-border">•</span>
                <span>
                  {loadingSizes ? (
                    t("calculatingTotalSize")
                  ) : (
                    <>
                      {t("totalSizeLabel")}{" "}
                      <span className="font-semibold text-agb-primary">{formatBytes(totalSize)}</span>
                    </>
                  )}
                </span>
                {totalFreed > 0 && (
                  <>
                    <span className="text-agb-border">•</span>
                    <span className="text-emerald-400 font-semibold">
                      {t("totalFreedLabel")} {formatBytes(totalFreed)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            {selected.length > 0 ? (
              <Button onClick={() => setSelected([])} variant="secondary" size="sm">
                {t("deselectAll")}
              </Button>
            ) : (
              <Button
                onClick={() => setSelected(cleanups.map((c) => c.id))}
                variant="secondary"
                size="sm"
              >
                {t("selectAll")}
              </Button>
            )}
            <Button
              onClick={runSelectedCleanups}
              disabled={isCleaning || selected.length === 0}
              size="md"
              variant="primary"
              className="min-w-44 flex items-center justify-center gap-2 font-semibold shadow-md shadow-agb-primary/20"
            >
              {isCleaning ? (
                <>
                  <LoaderCircle className="animate-spin w-4 h-4" />
                  <span>{t("cleaningProgress")}</span>
                </>
              ) : (
                <>
                  <Icon iconNode={broom} className="w-4 h-4" />
                  <span>{t("cleanSelected")}</span>
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Sensor de Armazenamento Automático do Windows 11 */}
        <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4.5">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-agb-primary/10 text-agb-primary shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-semibold text-agb-text">
                  {t("storageSenseTitle") || "Sensor de Armazenamento Automático"}
                </h3>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${
                    storageSenseEnabled
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                      : "bg-agb-border/60 text-agb-text-secondary border-agb-border"
                  }`}
                >
                  {storageSenseEnabled ? (t("enabled") || "Ativado") : (t("disabled") || "Desativado")}
                </span>
              </div>
              <p className="text-xs text-agb-text-secondary mt-0.5">
                {t("storageSenseDesc") ||
                  "Permite que o Windows 11 monitore o espaço e limpe arquivos temporários e lixeira em segundo plano."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto sm:ml-auto shrink-0">
            <Button
              onClick={openStorageSenseSettings}
              variant="secondary"
              size="sm"
              className="text-xs flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t("storageSenseOpenSettings") || "Configurações"}</span>
            </Button>
            <Toggle
              checked={storageSenseEnabled}
              disabled={loadingStorageSense}
              onChange={(checked) => toggleStorageSense(checked)}
            />
          </div>
        </Card>

        <div className="flex flex-col gap-3 pb-8">
          {cleanups.map(({ id, label, description, path, icon }) => {
            const isSelected = selected.includes(id)
            const currentSize = currentSizes[id]
            const freedSpace = cleanupResults[id]
            const translated = tCleanup(id, label, description)
            const displayLabel = translated.label
            const displayDesc = translated.description

            return (
              <Card
                key={id}
                onClick={() => !isCleaning && toggleCleanup(id)}
                className={`relative flex items-center justify-between p-4 rounded-xl cursor-pointer select-none transition-all duration-150 ${
                  isSelected ? "border-agb-primary/60 bg-agb-card/90" : "hover:border-agb-border-secondary"
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-colors ${
                      isSelected
                        ? "bg-agb-primary/20 text-agb-primary"
                        : "bg-agb-primary/10 text-agb-primary"
                    }`}
                  >
                    {icon}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-semibold text-agb-text truncate">
                        {displayLabel}
                      </span>
                      {freedSpace ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          {formatBytes(freedSpace)} {t("freed")}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-agb-text-secondary mt-0.5 leading-relaxed">{displayDesc}</span>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-agb-text-muted flex items-center gap-1">
                        <span className="font-medium">{t("size")}:</span>
                        {loadingSizes ? (
                          <span className="text-agb-text-secondary">{t("calculating")}</span>
                        ) : currentSize !== undefined ? (
                          <span className="text-agb-primary font-medium">
                            {formatBytes(currentSize)}
                          </span>
                        ) : (
                          <span className="text-agb-text-secondary">{t("unknown")}</span>
                        )}
                      </span>
                      {path && path !== "Recycle Bin" && (
                        <span className="text-[11px] font-mono text-agb-text-muted/80 truncate max-w-sm bg-agb-accent/40 border border-agb-border/50 px-2 py-0.5 rounded">
                          {path}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Toggle
                    checked={isSelected}
                    onChange={() => toggleCleanup(id)}
                    disabled={isCleaning}
                  />
                </div>
                {loadingQueue.includes(id) && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl bg-agb-card/80 backdrop-blur-xs">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-agb-card border border-agb-primary/40 shadow-lg">
                      <LoaderCircle className="animate-spin text-agb-primary" size={18} />
                      <span className="text-sm font-medium text-agb-text">{t("cleaning")}</span>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </RootDiv>
  )
}

export default Clean
