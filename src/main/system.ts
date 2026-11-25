import os from "os"
import { app, ipcMain } from "electron"
import si from "systeminformation"
import { exec, execFile } from "child_process"
import util from "util"
import fs from "fs"
import path from "path"
import log from "electron-log"
import { shell } from "electron"
import { executePowerShell } from "@main/powershell"
import { detectGPU, clearGpuCache } from "@main/gpu"
import { mainWindow } from "@main/windowState"
import { TtlCache } from "@main/cache"
import { resolveIcon } from "@main/debloat"
import type { SystemInfo } from "../types"

const systemInfoCache = new TtlCache<SystemInfo>(5 * 60 * 1000)

const execFilePromise = util.promisify(execFile)

console.log = log.log
console.error = log.error
console.warn = log.warn

interface PowerShellResult {
  success: boolean
  output?: string
  error?: string
}

interface ClearCacheResult {
  success: boolean
  error?: string
}

async function getSystemInfo(): Promise<SystemInfo> {
  const cached = systemInfoCache.get("systemInfo")
  if (cached) return cached

  try {
    const [cpuData, osInfo, memLayout, gpuInfo] = await Promise.all([
      si.cpu(),
      si.osInfo(),
      si.memLayout(),
      detectGPU().catch((err) => {
        console.error("Failed to detect GPU in getSystemInfo:", err)
        return null
      }),
    ])

    const totalMemory = os.totalmem()
    const validSticks = (memLayout as any[] || []).filter((s) => s && s.size && s.size > 0)
    const memoryType = validSticks.length > 0 ? validSticks[0].type : "Unknown"
    const memoryClock = validSticks.length > 0 && validSticks[0].clockSpeed ? validSticks[0].clockSpeed : undefined

    let memoryChannels = "Desconhecido"
    let memorySlotsUsed = validSticks.length
    let memorySticksDetail = ""

    if (validSticks.length > 0) {
      const stickCount = validSticks.length
      const stickSizeGb = Math.round(validSticks[0].size / (1024 * 1024 * 1024))
      memorySticksDetail = `${stickCount}x ${stickSizeGb} GB`

      if (stickCount === 1) {
        memoryChannels = "Single Channel"
      } else if (stickCount === 2) {
        memoryChannels = "Dual Channel"
      } else if (stickCount === 4) {
        memoryChannels = "Dual Channel"
      } else if (stickCount === 3) {
        memoryChannels = "Flex Mode"
      } else if (stickCount >= 8) {
        memoryChannels = "Octa Channel"
      } else if (stickCount >= 6) {
        memoryChannels = "Quad / Hexa Channel"
      } else {
        memoryChannels = `${stickCount} Pentes`
      }
    }

    const versionScript = `(Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion").DisplayVersion`
    const versionPsResult = await executePowerShell(null, {
      script: versionScript,
      name: "GetWindowsVersion",
    })
    const windowsVersion = versionPsResult.success ? versionPsResult.output!.trim() : "Unknown"

    const result: SystemInfo = {
      cpu_model: (cpuData as any).brand,
      cpu_cores: (cpuData as any).physicalCores || (cpuData as any).cores,
      cpu_threads: (cpuData as any).cores || (cpuData as any).threads || os.cpus().length,
      memory_total: totalMemory,
      memory_type: memoryType,
      memory_clock: memoryClock,
      memory_channels: memoryChannels,
      memory_slots_used: memorySlotsUsed,
      memory_sticks_detail: memorySticksDetail,
      os: osInfo.distro || "Windows",
      os_version: windowsVersion || "Unknown",
      gpu_model: gpuInfo?.model,
      vram: gpuInfo?.vram,
      hasGPU: gpuInfo?.hasGPU,
      isNvidia: gpuInfo?.isNvidia,
      isAmd: gpuInfo?.isAmd,
      integrated_gpu: gpuInfo?.integratedModel,
      hasIntegratedGPU: gpuInfo?.hasIntegratedGPU,
    }

    setImmediate(async () => {
      detectGPU()
        .then((gpuInfo) => {
          mainWindow?.webContents.send("system-info-extra", {
            gpu_model: gpuInfo.model,
            vram: gpuInfo.vram,
            hasGPU: gpuInfo.hasGPU,
            isNvidia: gpuInfo.isNvidia,
            isAmd: gpuInfo.isAmd,
            integrated_gpu: gpuInfo.integratedModel,
            hasIntegratedGPU: gpuInfo.hasIntegratedGPU,
            memory_channels: memoryChannels,
            memory_slots_used: memorySlotsUsed,
            memory_sticks_detail: memorySticksDetail,
          })
        })
        .catch((error) => {
          console.error("Failed to detect GPU:", error)
        })

      try {
        const [diskLayout, fsSize, blockDevices] = await Promise.all([
          si.diskLayout(),
          si.fsSize(),
          si.blockDevices(),
        ])

        const cDrive = (fsSize as any).find((d: any) =>
          d.mount.toUpperCase().startsWith("C:"),
        )

        let primaryDisk: any = null
        if (cDrive) {
          const cBlock = (blockDevices as any).find(
            (b: any) => b.mount && b.mount.toUpperCase().startsWith("C:"),
          )
          if (cBlock) {
            primaryDisk =
              (diskLayout as any).find(
                (disk: any) =>
                  disk.device?.toLowerCase() === cBlock.device?.toLowerCase() ||
                  disk.name?.toLowerCase().includes(cBlock.name?.toLowerCase()),
              ) || null
          }
        }

        const allDisks = (fsSize as any[]).map((d: any) => {
          const sizeGB = Math.round((d.size / 1024 / 1024 / 1024) * 10) / 10
          const usedGB = Math.round((d.used / 1024 / 1024 / 1024) * 10) / 10
          const freeBytes = d.available !== undefined ? d.available : Math.max(0, d.size - d.used)
          const freeGB = Math.round((freeBytes / 1024 / 1024 / 1024) * 10) / 10
          const usePercent = Math.round(d.use * 10) / 10
          return {
            mount: d.mount || d.fs,
            size_gb: sizeGB,
            used_gb: usedGB,
            free_gb: freeGB,
            use_percent: usePercent,
          }
        })

        mainWindow?.webContents.send("system-info-extra", {
          disk_model: primaryDisk?.name || primaryDisk?.device || "Storage",
          disk_size: cDrive?.size
            ? `${Math.round(cDrive.size / 1024 / 1024 / 1024).toFixed(1)} GB`
            : "Unknown",
          disks: allDisks,
        })
      } catch (error) {
        console.error("Failed to fetch disk info:", error)
      }
    })

    systemInfoCache.set("systemInfo", result)
    return result
  } catch (error) {
    console.error("Failed to get system info:", error)
    throw error
  }
}

function restartSystem(): { success: boolean } {
  try {
    exec("shutdown /r /t 0")
    return { success: true }
  } catch (error) {
    console.error("Failed to restart system:", error)
    throw error
  }
}

function restartExplorer(): { success: boolean; error?: string } {
  try {
    exec("taskkill /f /im explorer.exe & start explorer.exe")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to restart explorer:", error)
    return { success: false, error: error.message }
  }
}

function getUserName(): string {
  return os.userInfo().username
}

export async function getAdminStatus(): Promise<boolean> {
  if (process.platform !== "win32") return true
  try {
    const { execSync } = await import("child_process")
    execSync("net session", { stdio: "pipe" })
    return true
  } catch {
    try {
      const { stdout } = await execFilePromise("powershell.exe", [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        "([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)",
      ])
      return stdout.trim().toLowerCase() === "true"
    } catch {
      return false
    }
  }
}
function clearAgbCache(): ClearCacheResult {
  systemInfoCache.clear()
  clearGpuCache()
  try {
    const userDataPath = app.getPath("userData")
    const scriptsPath = path.join(userDataPath, "scripts")
    const logsPath = path.join(userDataPath, "logs")

    let scriptsCleared = false
    let logsCleared = false
    let errors: string[] = []

    if (fs.existsSync(scriptsPath)) {
      const files = fs.readdirSync(scriptsPath)
      for (const file of files) {
        const filePath = path.join(scriptsPath, file)
        try {
          if (fs.lstatSync(filePath).isFile()) {
            fs.unlinkSync(filePath)
          }
        } catch (err: any) {
          errors.push(`Failed to delete script file: ${file} - ${err.message}`)
        }
      }

      scriptsCleared = true
      console.log("AGB scripts directory files cleared successfully.")
    } else {
      console.warn("AGB scripts directory does not exist.")
      errors.push("Scripts directory does not exist.")
    }

    if (fs.existsSync(logsPath)) {
      const logFiles = fs.readdirSync(logsPath)
      for (const file of logFiles) {
        const filePath = path.join(logsPath, file)
        try {
          if (fs.lstatSync(filePath).isFile()) {
            fs.unlinkSync(filePath)
          }
        } catch (err: any) {
          errors.push(`Failed to delete log file: ${file} - ${err.message}`)
        }
      }
      logsCleared = true
      console.log("AGB logs directory files cleared successfully.")
    } else {
      console.warn("AGB logs directory does not exist.")
      errors.push("Logs directory does not exist.")
    }

    if (errors.length === 0) {
      return { success: true }
    } else {
      return {
        success: scriptsCleared || logsCleared,
        error: errors.join(" | "),
      }
    }
  } catch (error: any) {
    console.error("Failed to clear AGB scripts or logs directory:", error)
    return { success: false, error: error.message }
  }
}

function openLogFolder(): { success: boolean; error?: string } {
  const logPath = path.join(app.getPath("userData"), "logs")
  if (fs.existsSync(logPath)) {
    shell.openPath(logPath)
    return { success: true }
  } else {
    console.warn("AGB logs directory does not exist.")
    return { success: false, error: "Logs directory does not exist." }
  }
}

const ensureWingetScript = `
$TestMode = $false  # Set $true to force winget install for testing

function Check-Winget {
    try {
        $null = winget --version 2>&1
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Show-InstallerGUI {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $form = New-Object System.Windows.Forms.Form
    $form.Text = "AGB: Winget Installer"
    $form.Size = New-Object System.Drawing.Size(600,400)
    $form.StartPosition = "CenterScreen"

    $label = New-Object System.Windows.Forms.Label
    $label.Text = "Welcome! AGB needs Winget to install apps."
    $label.AutoSize = $true
    $label.Location = New-Object System.Drawing.Point(20,20)
    $form.Controls.Add($label)

    $outputBox = New-Object System.Windows.Forms.TextBox
    $outputBox.Multiline = $true
    $outputBox.ScrollBars = 'Vertical'
    $outputBox.ReadOnly = $true
    $outputBox.Size = New-Object System.Drawing.Size(550,250)
    $outputBox.Location = New-Object System.Drawing.Point(20,60)
    $form.Controls.Add($outputBox)

    $closeButton = New-Object System.Windows.Forms.Button
    $closeButton.Text = "Close"
    $closeButton.Size = New-Object System.Drawing.Size(100,30)
    $closeButton.Location = New-Object System.Drawing.Point(240,320)
    $closeButton.Enabled = $false
    $closeButton.Add_Click({ $form.Close() })
    $form.Controls.Add($closeButton)

    function Append-Output {
        param($text)
        $outputBox.AppendText("$text\`r\`n")
        $outputBox.SelectionStart = $outputBox.Text.Length
        $outputBox.ScrollToCaret()
        [System.Windows.Forms.Application]::DoEvents()
    }

    # Create a runspace for background work
    $runspace = [runspacefactory]::CreateRunspace()
    $runspace.ApartmentState = "STA"
    $runspace.ThreadOptions = "ReuseThread"
    $runspace.Open()
    $runspace.SessionStateProxy.SetVariable("TestMode", $TestMode)

    $powershell = [powershell]::Create()
    $powershell.Runspace = $runspace

    [void]$powershell.AddScript({
        function Check-Winget {
            try {
                $null = winget --version 2>&1
                return $LASTEXITCODE -eq 0
            } catch {
                return $false
            }
        }

        $result = @{
            Success = $false
            Messages = @()
        }

        try {
            $result.Messages += "Checking for Winget..."
            $wingetInstalled = Check-Winget

            if ($TestMode -or -not $wingetInstalled) {
                $result.Messages += "Winget not found. Installing for AGB..."
                
                try {
                    $result.Messages += "Attempting to register App Installer..."
                    
                    # Add timeout wrapper for AppX operations
                    $job = Start-Job -ScriptBlock {
                        Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe
                    }
                    
                    $completed = Wait-Job -Job $job -Timeout 60
                    if ($completed) {
                        Receive-Job -Job $job
                        Remove-Job -Job $job
                    } else {
                        Remove-Job -Job $job -Force
                        throw "Registration timed out after 60 seconds"
                    }
                    
                    Start-Sleep -Seconds 2
                    
                    if (Check-Winget) {
                        $result.Messages += "Winget installed successfully!"
                        $result.Success = $true
                    } else {
                        throw "Registration completed but winget not found"
                    }
                } catch {
                    $result.Messages += "Registration method failed: $($_.Exception.Message)"
                    $result.Messages += "Trying download method..."
                    
                    try {
                        $result.Messages += "Downloading latest App Installer package..."
                        $progressPreference = 'SilentlyContinue'
                        
                        # Add timeout to web requests
                        $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/microsoft/winget-cli/releases/latest" -TimeoutSec 30
                        $downloadUrl = ($releases.assets | Where-Object { $_.name -like "*.msixbundle" }).browser_download_url
                        
                        if (-not $downloadUrl) {
                            throw "Could not find download URL in GitHub release"
                        }
                        
                        $tempFile = Join-Path $env:TEMP "Microsoft.DesktopAppInstaller.msixbundle"
                        
                        $result.Messages += "Downloading from GitHub..."
                        Start-BitsTransfer -Source $downloadUrl -Destination $tempFile -TimeoutSec 120
                        
                        $result.Messages += "Installing package (this may take a minute)..."
                        
                        # Add timeout wrapper for installation
                        $job = Start-Job -ScriptBlock {
                            param($path)
                            Add-AppxPackage -Path $path
                        } -ArgumentList $tempFile
                        
                        $completed = Wait-Job -Job $job -Timeout 120
                        if ($completed) {
                            Receive-Job -Job $job
                            Remove-Job -Job $job
                        } else {
                            Remove-Job -Job $job -Force
                            throw "Installation timed out after 120 seconds"
                        }
                        
                        # Clean up
                        if (Test-Path $tempFile) {
                            Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
                        }
                        
                        Start-Sleep -Seconds 2
                        
                        if (Check-Winget) {
                            $result.Messages += "Winget installed successfully!"
                            $result.Success = $true
                        } else {
                            $result.Messages += "WARNING: Installation completed but winget command not available yet."
                            $result.Messages += "You may need to restart your terminal or computer."
                            $result.Success = $false
                        }
                    } catch {
                        $result.Messages += "ERROR: Failed to install Winget."
                        $result.Messages += $_.Exception.Message
                        $result.Messages += ""
                        $result.Messages += "Manual installation: Visit https://aka.ms/getwinget"
                        $result.Success = $false
                    }
                }
            } else {
                $result.Messages += "Winget is already installed. AGB is ready to install apps!"
                $result.Success = $true
            }
        } catch {
            $result.Messages += "ERROR: Unexpected error occurred."
            $result.Messages += $_.Exception.Message
            $result.Success = $false
        }

        return $result
    })

    $handle = $powershell.BeginInvoke()

    # Poll for completion
    $timer = New-Object System.Windows.Forms.Timer
    $timer.Interval = 500
    $timer.Add_Tick({
        if ($handle.IsCompleted) {
            $timer.Stop()
            
            try {
                $result = $powershell.EndInvoke($handle)
                
                foreach ($message in $result.Messages) {
                    Append-Output $message
                }
                
                Append-Output ""
                Append-Output "You can now close this window."
            } catch {
                Append-Output "ERROR: Installation process failed."
                Append-Output $_.Exception.Message
            } finally {
                $closeButton.Enabled = $true
                $powershell.Dispose()
                $runspace.Close()
            }
        }
    })

    $form.Add_Shown({ $timer.Start() })
    
    # Clean up on form close
    $form.Add_FormClosing({
        if (-not $handle.IsCompleted) {
            $powershell.Stop()
        }
        $timer.Stop()
        $powershell.Dispose()
        $runspace.Close()
    })

    [void]$form.ShowDialog()
}

# --- Main Execution ---
if ($TestMode -or -not (Check-Winget)) {
    Show-InstallerGUI
} else {
    Write-Output "Winget is already installed. AGB can install apps!"
}
`

export { ensureWingetScript }

function ensureWinget(): Promise<PowerShellResult> {
  const result = executePowerShell(null, {
    script: ensureWingetScript,
    name: "Ensure-Winget",
  })
  return result
}

export { ensureWinget }

export async function checkWinget(): Promise<{ success: boolean; installed: boolean }> {
  try {
    await execFilePromise("winget", ["--version"])
    console.log("Winget is installed")
    return { success: true, installed: true }
  } catch {
    console.log("Winget is not installed")
    return { success: true, installed: false }
  }
}

async function getSystemMetrics() {
  try {
    const cpuTempPromise = (async (): Promise<number | null> => {
      try {
        const cpuTempData = await si.cpuTemperature()
        if (cpuTempData && cpuTempData.main && cpuTempData.main > 0) {
          return Math.round(cpuTempData.main)
        }
      } catch {
        // ignore
      }
      try {
        const { stdout } = await execFilePromise(
          "powershell.exe",
          [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            "(Get-CimInstance -ClassName Win32_PerfFormattedData_Counters_ThermalZoneInformation -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty HighPrecisionTemperature)",
          ],
          { timeout: 3000 },
        )
        if (stdout) {
          const raw = parseFloat(stdout.trim())
          if (!isNaN(raw) && raw > 2700) {
            const celsius = Math.round(raw / 10 - 273.15)
            if (celsius > 0 && celsius < 125) {
              return celsius
            }
          }
        }
      } catch {
        // ignore
      }
      return null
    })()

    const gpuMetricsPromise = (async (): Promise<{ gpuUsage: number | null; gpuTemp: number | null }> => {
      try {
        const { stdout } = await execFilePromise(
          "nvidia-smi",
          ["--query-gpu=utilization.gpu,temperature.gpu", "--format=csv,noheader,nounits"],
          { timeout: 2500 },
        )
        if (stdout) {
          const parts = stdout.trim().split(",")
          if (parts.length >= 2) {
            const u = parseFloat(parts[0].trim())
            const t = parseFloat(parts[1].trim())
            return {
              gpuUsage: !isNaN(u) ? Math.round(u) : null,
              gpuTemp: !isNaN(t) ? Math.round(t) : null,
            }
          }
        }
      } catch {
        try {
          const graphics = await si.graphics()
          if (graphics.controllers && graphics.controllers.length > 0) {
            const controller =
              graphics.controllers.find((c) => c.utilizationGpu !== undefined) ||
              graphics.controllers[0]
            return {
              gpuUsage:
                controller.utilizationGpu !== undefined && controller.utilizationGpu !== null
                  ? Math.round(controller.utilizationGpu)
                  : null,
              gpuTemp:
                controller.temperatureGpu !== undefined && controller.temperatureGpu !== null
                  ? Math.round(controller.temperatureGpu)
                  : null,
            }
          }
        } catch {
          // ignore
        }
      }
      return { gpuUsage: null, gpuTemp: null }
    })()

    const diskMetricsPromise = (async () => {
      const diskMetrics: Record<string, { activity: number; readSpeedSec: number; writeSpeedSec: number }> = {}
      try {
        const { stdout } = await execFilePromise(
          "powershell.exe",
          [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            "Get-CimInstance -ClassName Win32_PerfFormattedData_PerfDisk_LogicalDisk | Where-Object { $_.Name -match '^[A-Z]:' } | Select-Object Name, PercentDiskTime, DiskReadBytesPerSec, DiskWriteBytesPerSec | ConvertTo-Json",
          ],
          { timeout: 3000 },
        )
        if (stdout) {
          const parsed = JSON.parse(stdout.trim())
          const list = Array.isArray(parsed) ? parsed : [parsed]
          for (const item of list) {
            if (item && item.Name) {
              const letter = item.Name.toUpperCase()
              diskMetrics[letter] = {
                activity: Math.min(100, Math.max(0, Math.round(parseFloat(item.PercentDiskTime) || 0))),
                readSpeedSec: parseFloat(item.DiskReadBytesPerSec) || 0,
                writeSpeedSec: parseFloat(item.DiskWriteBytesPerSec) || 0,
              }
            }
          }
        }
      } catch {
        // ignore
      }
      return diskMetrics
    })()

    const [load, mem, cpuTemp, gpuMetrics, diskMetrics] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      cpuTempPromise,
      gpuMetricsPromise,
      diskMetricsPromise,
    ])

    const cpuUsage = Math.round(load.currentLoad * 10) / 10
    const memoryUsage = Math.round((mem.used / mem.total) * 1000) / 10
    const memoryUsedGB = Math.round((mem.used / 1024 / 1024 / 1024) * 10) / 10
    const { gpuUsage, gpuTemp } = gpuMetrics

    return {
      cpu_usage: cpuUsage,
      cpu_temp: cpuTemp,
      gpu_usage: gpuUsage,
      gpu_temp: gpuTemp,
      memory_usage: memoryUsage,
      memory_used_gb: memoryUsedGB,
      disk_metrics: diskMetrics,
    }
  } catch (error) {
    console.error("Failed to get system metrics:", error)
    return {
      cpu_usage: 0,
      cpu_temp: null,
      gpu_usage: null,
      gpu_temp: null,
      memory_usage: 0,
      memory_used_gb: 0,
      disk_metrics: {},
    }
  }
}

export async function relaunchAsAdmin(): Promise<void> {
  if (process.platform !== "win32") return
  try {
    const exePath = process.execPath.replace(/'/g, "''")
    const appPath = app.getAppPath().replace(/'/g, "''")
    const isPackaged = app.isPackaged
    const script = isPackaged
      ? `Start-Process -FilePath '${exePath}' -Verb RunAs`
      : `Start-Process -FilePath '${exePath}' -ArgumentList ('"' + '${appPath}' + '"') -WorkingDirectory '${appPath}' -Verb RunAs`
    const res = await executePowerShell(null, { script, name: "relaunch-as-admin" })
    if (res.success) {
      app.quit()
    } else {
      console.warn("User cancelled UAC elevation or error occurred:", res.error)
    }
  } catch (error) {
    console.error("Failed to relaunch as admin:", error)
  }
}

export interface StartupAppItem {
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

interface GameModeSessionData {
  previousPowerPlan?: string
  previousPowerPlanName?: string
  wSearchWasRunning?: boolean
  wuauservWasRunning?: boolean
  doSvcWasRunning?: boolean
  bitsWasRunning?: boolean
  activatedAt?: number
}

function getGameModeSessionPath(): string {
  return path.join(app.getPath("userData"), "gameModeSession.json")
}

function loadSavedGameModeSession(): GameModeSessionData {
  try {
    const sessionPath = getGameModeSessionPath()
    if (fs.existsSync(sessionPath)) {
      const data = fs.readFileSync(sessionPath, "utf-8")
      return JSON.parse(data)
    }
  } catch (err) {
    console.error("Failed to read gameModeSession.json:", err)
  }
  return {}
}

function persistGameModeSession(session: GameModeSessionData): void {
  try {
    const sessionPath = getGameModeSessionPath()
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2), "utf-8")
  } catch (err) {
    console.error("Failed to write gameModeSession.json:", err)
  }
}

function removeSavedGameModeSession(): void {
  try {
    const sessionPath = getGameModeSessionPath()
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath)
    }
  } catch (err) {
    console.error("Failed to remove gameModeSession.json:", err)
  }
}

let gameModeSession: GameModeSessionData = loadSavedGameModeSession()

async function activateGameMode(): Promise<{ success: boolean; error?: string }> {
  try {
    const script = `
# 1. Obter e salvar esquema de energia atual de forma precisa
$activeScheme = powercfg -getactivescheme
$currentGuid = ""
$currentName = ""
if ($activeScheme -match '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\s*\((.*?)\)') {
    $currentGuid = $matches[1]
    $currentName = $matches[2].Trim()
} elseif ($activeScheme -match '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})') {
    $currentGuid = $matches[1]
}

# 2. Ativar Plano Gamer / Desempenho Maximo se disponivel
# Se o usuario ja estiver no plano AGB / Gamer, mantem ele ativo
$allPlans = powercfg -list
$gamerPlan = $allPlans | Select-String "AGB|Gamer|Ultimate|Desempenho m.ximo|e9a42b02-d5df-448d-aa00-03f14749eb61" | Select-Object -First 1
if (-not $gamerPlan) {
    $gamerPlan = $allPlans | Select-String "Alto desempenho|High performance|8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c" | Select-Object -First 1
}

$targetGuid = $null
if ($gamerPlan -and ($gamerPlan -match '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})')) {
    $targetGuid = $matches[1]
} else {
    $targetGuid = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"
}
if ($targetGuid -and ($currentGuid -ne $targetGuid)) {
    powercfg -setactive $targetGuid 2>$null
}

# 3. Pausar Windows Search se ativo (evita picos de I/O de disco)
$wsearch = Get-Service -Name "WSearch" -ErrorAction SilentlyContinue
$wasRunning = ($wsearch -and $wsearch.Status -eq 'Running')
if ($wasRunning) {
    Stop-Service -Name "WSearch" -Force -ErrorAction SilentlyContinue
}

# 4. Pausar servicos de download e atualizacoes do Windows (evita picos de ping e lag de rede)
$wuauserv = Get-Service -Name "wuauserv" -ErrorAction SilentlyContinue
$wasWuauservRunning = ($wuauserv -and $wuauserv.Status -eq 'Running')
if ($wasWuauservRunning) {
    Stop-Service -Name "wuauserv" -Force -ErrorAction SilentlyContinue
}

$dosvc = Get-Service -Name "DoSvc" -ErrorAction SilentlyContinue
$wasDoSvcRunning = ($dosvc -and $dosvc.Status -eq 'Running')
if ($wasDoSvcRunning) {
    Stop-Service -Name "DoSvc" -Force -ErrorAction SilentlyContinue
}

$bits = Get-Service -Name "BITS" -ErrorAction SilentlyContinue
$wasBitsRunning = ($bits -and $bits.Status -eq 'Running')
if ($wasBitsRunning) {
    Stop-Service -Name "BITS" -Force -ErrorAction SilentlyContinue
}

# 5. Desativar notificacoes em primeiro plano (Modo Foco / Nao Perturbe)
$notifPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings"
if (!(Test-Path $notifPath)) { New-Item -Path $notifPath -Force | Out-Null }
Set-ItemProperty -Path $notifPath -Name "NOC_GLOBAL_SETTING_TOASTS_ENABLED" -Value 0 -Force -ErrorAction SilentlyContinue

# 6. Trim de Memoria RAM apenas de navegadores/apps pesados em segundo plano (sem tocar no Steam/Discord para nao travar overlay/voz no jogo)
$trimCode = @'
using System;
using System.Runtime.InteropServices;
public class AGBMemTrim {
    [DllImport("psapi.dll")]
    public static extern bool EmptyWorkingSet(IntPtr hProcess);
}
'@
Add-Type -TypeDefinition $trimCode -ErrorAction SilentlyContinue
$heavyProcs = @("chrome", "msedge", "opera", "firefox", "brave", "vlc", "qbittorrent", "spotify")
foreach ($p in $heavyProcs) {
    Get-Process -Name $p -ErrorAction SilentlyContinue | ForEach-Object {
        try { [AGBMemTrim]::EmptyWorkingSet($_.Handle) | Out-Null } catch {}
    }
}

# Retornar dados da sessao para restauracao
@{
    previousPowerPlan = $currentGuid
    previousPowerPlanName = $currentName
    wSearchWasRunning = $wasRunning
    wuauservWasRunning = $wasWuauservRunning
    doSvcWasRunning = $wasDoSvcRunning
    bitsWasRunning = $wasBitsRunning
} | ConvertTo-Json -Compress
`
    const res = await executePowerShell(null, { script, name: "activate-game-mode" })
    if (res.success && res.output) {
      try {
        const parsed = JSON.parse(res.output.trim())
        gameModeSession = {
          ...parsed,
          activatedAt: Date.now()
        }
        persistGameModeSession(gameModeSession)
      } catch (e) {
        console.error("Failed to parse game mode activation output:", e)
      }
    }
    return { success: res.success, error: res.error }
  } catch (error: any) {
    console.error("Failed to activate game mode:", error)
    return { success: false, error: error.message }
  }
}

async function deactivateGameMode(): Promise<{ success: boolean; error?: string }> {
  try {
    let session = gameModeSession
    if (!session.previousPowerPlan) {
      session = loadSavedGameModeSession()
    }

    const prevPlan = session.previousPowerPlan || ""
    const wasWSearchRunning = session.wSearchWasRunning ? "$true" : "$false"
    const wasWuauservRunning = session.wuauservWasRunning ? "$true" : "$false"
    const wasDoSvcRunning = session.doSvcWasRunning ? "$true" : "$false"
    const wasBitsRunning = session.bitsWasRunning ? "$true" : "$false"

    const script = `
# 1. Restaurar Plano de Energia Anterior exatamente como era antes
$prevGuid = "${prevPlan}"
if ($prevGuid) {
    powercfg -setactive $prevGuid
}

# 2. Restaurar Windows Search se estava ativo antes do Modo Jogo
if (${wasWSearchRunning}) {
    Start-Service -Name "WSearch" -ErrorAction SilentlyContinue
}

# 3. Restaurar servicos de download e atualizacoes se estavam ativos antes
if (${wasWuauservRunning}) {
    Start-Service -Name "wuauserv" -ErrorAction SilentlyContinue
}
if (${wasDoSvcRunning}) {
    Start-Service -Name "DoSvc" -ErrorAction SilentlyContinue
}
if (${wasBitsRunning}) {
    Start-Service -Name "BITS" -ErrorAction SilentlyContinue
}

# 4. Restaurar notificacoes do Windows
$notifPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings"
if (Test-Path $notifPath) {
    Set-ItemProperty -Path $notifPath -Name "NOC_GLOBAL_SETTING_TOASTS_ENABLED" -Value 1 -Force -ErrorAction SilentlyContinue
}
Write-Output "Game mode deactivated successfully."
`
    const res = await executePowerShell(null, { script, name: "deactivate-game-mode" })
    gameModeSession = {}
    removeSavedGameModeSession()
    return { success: res.success, error: res.error }
  } catch (error: any) {
    console.error("Failed to deactivate game mode:", error)
    return { success: false, error: error.message }
  }
}

function extractExePath(cmd: string): string | null {
  if (!cmd) return null
  let raw = cmd.trim()
  raw = raw.replace(/%([^%]+)%/g, (_, name) => process.env[name] || `%${name}%`)
  const quoted = raw.match(/^"([^"]+)"/)
  if (quoted) {
    return quoted[1].trim()
  }
  const exeMatch = raw.match(/^([a-zA-Z]:\\[^,"]+?\.exe)(\s|,|$)/i)
  if (exeMatch) {
    return exeMatch[1].trim()
  }
  const firstToken = raw.split(/[\s,]+/)[0]
  if (firstToken && (firstToken.toLowerCase().endsWith(".exe") || firstToken.includes("\\"))) {
    return firstToken
  }
  return null
}

async function getStartupApps(): Promise<StartupAppItem[]> {
  try {
    const script = `
$results = @()

function Test-StartupEnabled($approvedPath, $name) {
    try {
        if (Test-Path $approvedPath) {
            $val = (Get-ItemProperty -Path $approvedPath -Name $name -ErrorAction SilentlyContinue).$name
            if ($val -ne $null -and $val.Length -gt 0) {
                return ($val[0] -eq 2)
            }
        }
    } catch {}
    return $true
}

# 1. HKCU Run
$hkcuRun = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
$hkcuAppr = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run"
if (Test-Path $hkcuRun) {
    $item = Get-Item -Path $hkcuRun -ErrorAction SilentlyContinue
    if ($item) {
        foreach ($propName in $item.Property) {
            $val = $item.GetValue($propName)
            $en = Test-StartupEnabled $hkcuAppr $propName
            $results += [PSCustomObject]@{
                id = "hkcu_$propName"
                name = $propName
                command = "$val"
                location = "HKCU"
                locationLabel = "Registro (Usuário)"
                enabled = $en
                sourceType = "registry"
            }
        }
    }
}

# 2. HKLM Run
$hklmRun = "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
$hklmAppr = "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run"
if (Test-Path $hklmRun) {
    $item = Get-Item -Path $hklmRun -ErrorAction SilentlyContinue
    if ($item) {
        foreach ($propName in $item.Property) {
            $val = $item.GetValue($propName)
            $en = Test-StartupEnabled $hklmAppr $propName
            $results += [PSCustomObject]@{
                id = "hklm_$propName"
                name = $propName
                command = "$val"
                location = "HKLM"
                locationLabel = "Registro (Sistema)"
                enabled = $en
                sourceType = "registry"
            }
        }
    }
}

# 3. User Startup Folder
$userStartup = [Environment]::GetFolderPath("Startup")
$userAppr = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\StartupFolder"
if ($userStartup -and (Test-Path $userStartup)) {
    Get-ChildItem -Path $userStartup -Filter "*.lnk" -ErrorAction SilentlyContinue | ForEach-Object {
        $en = Test-StartupEnabled $userAppr $_.Name
        $results += [PSCustomObject]@{
            id = "userfolder_$($_.Name)"
            name = $_.BaseName
            command = $_.FullName
            location = "FolderUser"
            locationLabel = "Pasta Inicializar (Usuário)"
            enabled = $en
            sourceType = "folder"
            filePath = $_.FullName
            fileName = $_.Name
        }
    }
}

# 4. Common Startup Folder
$commonStartup = [Environment]::GetFolderPath("CommonStartup")
$commonAppr = "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\StartupFolder"
if ($commonStartup -and (Test-Path $commonStartup)) {
    Get-ChildItem -Path $commonStartup -Filter "*.lnk" -ErrorAction SilentlyContinue | ForEach-Object {
        $en = Test-StartupEnabled $commonAppr $_.Name
        $results += [PSCustomObject]@{
            id = "commonfolder_$($_.Name)"
            name = $_.BaseName
            command = $_.FullName
            location = "FolderCommon"
            locationLabel = "Pasta Inicializar (Todos)"
            enabled = $en
            sourceType = "folder"
            filePath = $_.FullName
            fileName = $_.Name
        }
    }
}

# 5. Third-Party Services (services.msc) - Auto & Manual
$winDir = $env:SystemRoot
Get-CimInstance Win32_Service -ErrorAction SilentlyContinue | Where-Object {
    $_.PathName -and
    ($_.StartMode -eq 'Auto' -or $_.StartMode -eq 'Manual')
} | ForEach-Object {
    $rawPath = $_.PathName.Trim()
    $exeClean = $rawPath
    if ($exeClean -match '^"([^"]+)"') {
        $exeClean = $matches[1]
    } else {
        $exeClean = ($exeClean -split ' ')[0]
    }

    $isWindowsCore = $false
    if ($exeClean -and $winDir) {
        if (
            $exeClean -like "$winDir\\System32\\*" -or
            $exeClean -like "$winDir\\SysWOW64\\*" -or
            $exeClean -like "$winDir\\servicing\\*" -or
            $exeClean -like "$winDir\\WinSxS\\*" -or
            $exeClean -like "$winDir\\SystemApps\\*" -or
            $exeClean -like "*\\svchost.exe"
        ) {
            $isWindowsCore = $true
        }
    }

    if (-not $isWindowsCore) {
        $svcName = $_.Name
        $dispName = if ($_.DisplayName) { $_.DisplayName } else { $svcName }
        $isProtected = $null
        if ($svcName -match '^(vgc|vgk|BEService|EasyAntiCheat|EasyAntiCheat_EOS|FACEITService)$' -or $rawPath -match 'Riot Vanguard|EasyAntiCheat|BattlEye|FACEIT') {
            $isProtected = "Anti-Cheat"
        }
        $results += [PSCustomObject]@{
            id = "svc_$svcName"
            name = $dispName
            command = $rawPath
            location = "Service"
            locationLabel = "Serviço (services.msc)"
            enabled = ($_.StartMode -eq 'Auto')
            sourceType = "service"
            serviceName = $svcName
            protectedReason = $isProtected
        }
    }
}

# 6. Third-Party Scheduled Tasks (Boot / Logon triggers)
try {
    Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object {
        $_.TaskPath -notmatch '^\\Microsoft\\' -and $_.Triggers
    } | ForEach-Object {
        $hasBootOrLogon = $false
        foreach ($trig in $_.Triggers) {
            if ($trig.CimClass.CimClassName -match 'BootTrigger|LogonTrigger') {
                $hasBootOrLogon = $true
                break
            }
        }
        if ($hasBootOrLogon) {
            $act = $_.Actions | Select-Object -First 1
            $execCmd = if ($act -and $act.Execute) { "$($act.Execute) $($act.Arguments)".Trim() } else { "$($_.TaskPath)$($_.TaskName)" }
            $results += [PSCustomObject]@{
                id = "task_$($_.TaskPath)$($_.TaskName)"
                name = $_.TaskName
                command = $execCmd
                location = "Task"
                locationLabel = "Tarefa Agendada"
                enabled = ($_.State -ne 'Disabled')
                sourceType = "task"
                taskPath = $_.TaskPath
            }
        }
    }
} catch {}

if ($results.Count -eq 0) {
    Write-Output "[]"
} else {
    $results | ConvertTo-Json -Compress
}
`
    const res = await executePowerShell(null, { script, name: "get-startup-apps" })
    if (!res.success || !res.output) return []
    const parsed = JSON.parse(res.output.trim())
    const list: StartupAppItem[] = Array.isArray(parsed) ? parsed : [parsed]

    const appsWithIcons = await Promise.all(
      list.map(async (item) => {
        let iconPath: string | null = null
        if (item.sourceType === "folder" && item.filePath) {
          iconPath = item.filePath
        } else if (item.command) {
          iconPath = extractExePath(item.command)
          if (iconPath) {
            try {
              const dir = path.dirname(iconPath)
              const appIco = path.join(dir, "app.ico")
              if (fs.existsSync(appIco)) {
                iconPath = appIco
              }
            } catch {}
          }
        }

        let icon: string | undefined = undefined
        if (iconPath) {
          try {
            icon = await resolveIcon(iconPath)
          } catch {
            icon = undefined
          }
        }
        return {
          ...item,
          icon,
        }
      })
    )
    return appsWithIcons
  } catch (error) {
    console.error("Failed to get startup apps:", error)
    return []
  }
}

async function toggleStartupApp(
  _event: any,
  appItem: {
    name: string
    location: "HKCU" | "HKLM" | "FolderUser" | "FolderCommon" | "Service" | "Task"
    enabled: boolean
    sourceType: "registry" | "folder" | "service" | "task"
    fileName?: string
    serviceName?: string
    taskPath?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (appItem.sourceType === "service") {
      const svcName = (appItem.serviceName || appItem.name).replace(/'/g, "''")
      const targetMode = appItem.enabled ? "Automatic" : "Manual"
      const script = `Set-Service -Name '${svcName}' -StartupType ${targetMode} -ErrorAction Stop`
      const res = await executePowerShell(null, { script, name: "toggle-startup-service" })
      return { success: res.success, error: res.error }
    }

    if (appItem.sourceType === "task") {
      const tName = appItem.name.replace(/'/g, "''")
      const tPath = (appItem.taskPath || "\\").replace(/'/g, "''")
      const script = appItem.enabled
        ? `Enable-ScheduledTask -TaskPath '${tPath}' -TaskName '${tName}' -ErrorAction Stop | Out-Null`
        : `Disable-ScheduledTask -TaskPath '${tPath}' -TaskName '${tName}' -ErrorAction Stop | Out-Null`
      const res = await executePowerShell(null, { script, name: "toggle-startup-task" })
      return { success: res.success, error: res.error }
    }

    const targetByte = appItem.enabled ? "0x02" : "0x03"
    let approvedKey = ""
    let itemName = appItem.name

    if (appItem.location === "HKCU") {
      approvedKey = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run"
    } else if (appItem.location === "HKLM") {
      approvedKey = "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run"
    } else if (appItem.location === "FolderUser") {
      approvedKey = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\StartupFolder"
      itemName = appItem.fileName || `${appItem.name}.lnk`
    } else if (appItem.location === "FolderCommon") {
      approvedKey = "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\StartupFolder"
      itemName = appItem.fileName || `${appItem.name}.lnk`
    }

    const script = `
$key = "${approvedKey}"
if (!(Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
$bytes = [byte[]]( ${targetByte}, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 )
Set-ItemProperty -Path $key -Name "${itemName}" -Value $bytes -Type Binary -Force -ErrorAction SilentlyContinue
`
    const res = await executePowerShell(null, { script, name: "toggle-startup-app" })
    return { success: res.success, error: res.error }
  } catch (error: any) {
    console.error("Failed to toggle startup app:", error)
    return { success: false, error: error.message }
  }
}

interface WindowsUpdateCheckResult {
  success: boolean
  count: number
  updates: string[]
  error?: string
}

async function checkWindowsUpdates(): Promise<WindowsUpdateCheckResult> {
  try {
    const script = `
$res = @{ count = 0; updates = @(); success = $true }
try {
    $service = Get-Service -Name "wuauserv" -ErrorAction SilentlyContinue
    if ($service -and $service.Status -ne 'Running') {
        Start-Service -Name "wuauserv" -ErrorAction SilentlyContinue
    }
    $session = New-Object -ComObject Microsoft.Update.Session
    $searcher = $session.CreateUpdateSearcher()
    $searcher.ServerSelection = 1
    $search = $searcher.Search("IsInstalled=0 and Type='Software' and IsHidden=0")
    $titles = @()
    foreach ($u in $search.Updates) {
        $titles += $u.Title
    }
    $res.count = $search.Updates.Count
    $res.updates = $titles
} catch {
    $res.success = $false
    $res.error = $_.Exception.Message
}
$res | ConvertTo-Json -Compress
`
    const res = await executePowerShell(null, { script, name: "check-windows-updates" })
    if (res.success && res.output) {
      try {
        const parsed = JSON.parse(res.output.trim())
        return {
          success: parsed.success !== false,
          count: parsed.count || 0,
          updates: Array.isArray(parsed.updates) ? parsed.updates : [],
          error: parsed.error,
        }
      } catch {}
    }
    return { success: false, count: 0, updates: [], error: res.error }
  } catch (error: any) {
    console.error("Failed to check Windows updates:", error)
    return { success: false, count: 0, updates: [], error: error.message }
  }
}

async function openWindowsUpdate(): Promise<{ success: boolean; error?: string }> {
  try {
    const script = `
Start-Process "usoclient.exe" "StartInteractiveScan" -ErrorAction SilentlyContinue
Start-Process "ms-settings:windowsupdate"
`
    const res = await executePowerShell(null, { script, name: "open-windows-update" })
    return { success: res.success, error: res.error }
  } catch (error: any) {
    console.error("Failed to open Windows update:", error)
    return { success: false, error: error.message }
  }
}

export const setupSystemHandlers = (): void => {
  ipcMain.handle("restart", restartSystem)
  ipcMain.handle("open-log-folder", openLogFolder)
  ipcMain.handle("clear-agb-cache", clearAgbCache)
  ipcMain.handle("get-system-info", getSystemInfo)
  ipcMain.handle("get-system-metrics", getSystemMetrics)
  ipcMain.handle("get-user-name", getUserName)
  ipcMain.handle("restart-explorer", restartExplorer)
  ipcMain.handle("check-winget", async () => checkWinget())
  ipcMain.handle("get-admin-status", async () => getAdminStatus())
  ipcMain.handle("relaunch-as-admin", async () => relaunchAsAdmin())
  ipcMain.handle("install-winget", ensureWinget)
  ipcMain.handle("activate-game-mode", activateGameMode)
  ipcMain.handle("deactivate-game-mode", deactivateGameMode)
  ipcMain.handle("get-startup-apps", getStartupApps)
  ipcMain.handle("toggle-startup-app", toggleStartupApp)
  ipcMain.handle("check-windows-updates", checkWindowsUpdates)
  ipcMain.handle("open-windows-update", openWindowsUpdate)
  console.log("[AGB main/system.ts]: System handlers setup complete")
}

export const cleanupSystemHandlers = (): void => {
  ipcMain.removeHandler("restart")
  ipcMain.removeHandler("open-log-folder")
  ipcMain.removeHandler("clear-agb-cache")
  ipcMain.removeHandler("get-system-info")
  ipcMain.removeHandler("get-system-metrics")
  ipcMain.removeHandler("get-user-name")
  ipcMain.removeHandler("restart-explorer")
  ipcMain.removeHandler("check-winget")
  ipcMain.removeHandler("get-admin-status")
  ipcMain.removeHandler("relaunch-as-admin")
  ipcMain.removeHandler("install-winget")
  ipcMain.removeHandler("activate-game-mode")
  ipcMain.removeHandler("deactivate-game-mode")
  ipcMain.removeHandler("get-startup-apps")
  ipcMain.removeHandler("toggle-startup-app")
  ipcMain.removeHandler("check-windows-updates")
  ipcMain.removeHandler("open-windows-update")
}

