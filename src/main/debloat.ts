import { ipcMain, app } from "electron"
import { executePowerShell } from "@main/powershell"
import { mainWindow } from "@main/windowState"
import log from "electron-log"
import fs from "fs"
import path from "path"
import crypto from "crypto"

console.log = log.log
console.error = log.error
console.warn = log.warn

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

let cache: InstalledApp[] | null = null

const getInstalledAppsScript = `
$startMenuDirs = @(
  "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs",
  "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs"
)

$shortcuts = @{}
Get-ChildItem -Path $startMenuDirs -Filter "*.lnk" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
  $base = $_.BaseName.ToLower()
  if (-not $shortcuts.ContainsKey($base)) {
    $shortcuts[$base] = $_.FullName
  }
}

$wscript = New-Object -ComObject WScript.Shell
$fso = New-Object -ComObject Scripting.FileSystemObject

function Resolve-Shortcut($lnkPath) {
  try {
    $sc = $wscript.CreateShortcut($lnkPath)
    if ($sc.IconLocation -and $sc.IconLocation -ne ',0') {
      $rawIcon = ($sc.IconLocation -replace '"', '').Split(',')[0].Trim()
      if (Test-Path $rawIcon) { return $rawIcon }
    }
    if ($sc.TargetPath -and (Test-Path $sc.TargetPath)) {
      return $sc.TargetPath
    }
  } catch {}
  return $lnkPath
}

$paths = @(
  "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
  "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
  "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*"
)

$apps = @{}

foreach ($path in $paths) {
  Get-ItemProperty -Path $path -ErrorAction SilentlyContinue |
    Where-Object {
      $_.DisplayName -and
      $_.SystemComponent -ne 1 -and
      $_.DisplayName -notmatch '^(Update for|Security Update|Security Intelligence Update|Hotfix|KB\\d+|Cumulative Update|Definition Update|Update for Microsoft)'
    } |
    ForEach-Object {
      $id = ($_.DisplayName -replace '[^a-zA-Z0-9]', '-').ToLower()
      $size = 0
      if ($_.EstimatedSize) {
        $size = [int64]$_.EstimatedSize * 1024
      } else {
        $loc = $_.InstallLocation
        if (-not $loc -or -not (Test-Path $loc)) {
          if ($_.DisplayIcon) {
            $rawIcon = ($_.DisplayIcon -replace '"', '').Split(',')[0].Trim()
            if ($rawIcon -and (Test-Path $rawIcon)) {
              $parent = Split-Path $rawIcon -Parent
              if ($parent -and (Test-Path $parent) -and $parent -notmatch '^[a-zA-Z]:\\\\?$|Windows|System32|^[a-zA-Z]:\\\\Program Files\\\\?$|^[a-zA-Z]:\\\\Program Files \\(x86\\)\\\\?$') {
                $loc = $parent
              }
            }
          }
        }
        if ($loc -and (Test-Path $loc)) {
          try { $size = $fso.GetFolder($loc).Size } catch {}
        }
      }

      $icon = ""
      if ($_.DisplayIcon) {
        $raw = ($_.DisplayIcon -replace '"', '').Split(',')[0].Trim()
        if (Test-Path $raw) { $icon = $raw }
      }
      if (-not $icon) {
        $cleanName = ($_.DisplayName -replace '[^a-zA-Z0-9]', '').ToLower()
        foreach ($key in $shortcuts.Keys) {
          $cleanKey = ($key -replace '[^a-zA-Z0-9]', '').ToLower()
          if ($cleanKey.Length -ge 4 -and $cleanKey -notmatch 'uninstall|settings|service|services|setup|manual|documentation|website' -and ($cleanName.Contains($cleanKey) -or $cleanKey.Contains($cleanName))) {
            $resolved = Resolve-Shortcut $shortcuts[$key]
            if ($resolved -and (Test-Path $resolved)) {
              $icon = $resolved
              break
            }
          }
        }
      }
      if (-not $icon -and $_.InstallLocation -and (Test-Path $_.InstallLocation)) {
        $exe = Get-ChildItem -Path $_.InstallLocation -Filter "*.exe" -Recurse -Depth 2 -ErrorAction SilentlyContinue |
          Where-Object { $_.Name -notmatch 'uninstall|update|crash|report|helper|setup' } |
          Select-Object -First 1
        if ($exe) { $icon = $exe.FullName }
      }

      $apps[$id] = @{
        id = $id
        name = $_.DisplayName
        version = if ($_.DisplayVersion) { $_.DisplayVersion } else { '' }
        installDate = if ($_.InstallDate) { $_.InstallDate } else { '' }
        displayIcon = $icon
        publisher = if ($_.Publisher) { $_.Publisher } else { '' }
        installLocation = if ($_.InstallLocation) { $_.InstallLocation } else { '' }
        uninstallString = if ($_.UninstallString) { $_.UninstallString -replace '"', '' } else { '' }
        quietUninstallString = if ($_.QuietUninstallString) { $_.QuietUninstallString -replace '"', '' } else { '' }
        isStoreApp = $false
        packageName = ''
        size = $size
      }
    }
}

Get-AppxPackage |
  Where-Object {
    -not $_.NonRemovable -and
    $_.SignatureKind -ne 'System' -and
    -not $_.IsFramework -and
    $_.Name -notmatch 'Microsoft\\.NET|Microsoft\\.VCLibs|Microsoft\\.UI|Microsoft\\.WindowsStore|Microsoft\\.StorePurchaseApp'
  } |
  ForEach-Object {
    $id = ('appx-' + $_.PackageFamilyName).ToLower()
    if (-not $apps.ContainsKey($id)) {
      $size = 0
      $loc = $_.InstallLocation
      if ($loc -and (Test-Path $loc)) {
        try { $size = $fso.GetFolder($loc).Size } catch {}
      }

      $icon = ""
      if ($loc -and (Test-Path "$loc\\AppxManifest.xml")) {
        try {
          [xml]$xml = Get-Content "$loc\\AppxManifest.xml"
          $logoRel = $xml.Package.Applications.Application.VisualElements.Square44x44Logo
          if (-not $logoRel) { $logoRel = $xml.Package.Applications.Application.VisualElements.Square150x150Logo }
          if (-not $logoRel) { $logoRel = $xml.Package.Properties.Logo }
          if ($logoRel) {
            $logoName = [System.IO.Path]::GetFileNameWithoutExtension($logoRel)
            $logoDir = [System.IO.Path]::GetDirectoryName($logoRel)
            $searchDir = if ($logoDir) { "$loc\\$logoDir" } else { $loc }
            if (Test-Path $searchDir) {
              $match = Get-ChildItem -Path $searchDir -Filter "$logoName*.png" -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -notmatch 'targetsize-\\d+_altform|badge|contrast' } |
                Sort-Object Length -Descending |
                Select-Object -First 1
              if ($match) { $icon = $match.FullName }
            }
          }
        } catch {}
      }

      $apps[$id] = @{
        id = $id
        name = $_.Name
        version = $_.Version.ToString()
        installDate = ''
        displayIcon = $icon
        publisher = if ($_.Publisher -match 'O=([^,]+)') { $matches[1].Trim() } elseif ($_.Publisher -match 'CN=([^,]+)') { $matches[1].Trim() } else { $_.Publisher }
        installLocation = $loc
        uninstallString = ''
        quietUninstallString = ''
        isStoreApp = $true
        packageName = $_.PackageFullName
        size = $size
      }
    }
  }

$list = $apps.Values | Sort-Object name

if ($list.Count -eq 0) {
  return '[]'
}

$jsonParts = $list | ForEach-Object { $_ | ConvertTo-Json -Compress }
return "[$($jsonParts -join ',')]"
`

const iconCacheDir = path.join(app.getPath("userData"), "icon-cache")

function getIconCacheKey(filePath: string): string {
  return crypto.createHash("md5").update("v3:" + filePath.toLowerCase()).digest("hex")
}

async function getCachedIcon(filePath: string): Promise<string | null> {
  const cachePath = path.join(iconCacheDir, `${getIconCacheKey(filePath)}.icon`)
  try {
    return await fs.promises.readFile(cachePath, "utf-8")
  } catch {
    return null
  }
}

async function setCachedIcon(filePath: string, dataUrl: string): Promise<void> {
  try {
    await fs.promises.mkdir(iconCacheDir, { recursive: true })
    const cachePath = path.join(iconCacheDir, `${getIconCacheKey(filePath)}.icon`)
    await fs.promises.writeFile(cachePath, dataUrl, "utf-8")
  } catch {}
}

export async function resolveIcon(rawDisplayIcon: string): Promise<string | undefined> {
  if (!rawDisplayIcon) return undefined
  const displayIcon = rawDisplayIcon.replace(/^"|"$/g, "").split(",")[0].trim()
  if (!displayIcon) return undefined

  const cached = await getCachedIcon(displayIcon)
  if (cached) return cached

  try {
    await fs.promises.access(displayIcon)
  } catch {
    return undefined
  }

  try {
    const ext = path.extname(displayIcon).toLowerCase()
    if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
      const data = await fs.promises.readFile(displayIcon)
      const mime = ext === ".png" ? "image/png" : "image/jpeg"
      const dataUrl = `data:${mime};base64,${data.toString("base64")}`
      setCachedIcon(displayIcon, dataUrl).catch(() => {})
      return dataUrl
    }

    if (ext === ".ico") {
      const data = await fs.promises.readFile(displayIcon)
      const dataUrl = `data:image/x-icon;base64,${data.toString("base64")}`
      setCachedIcon(displayIcon, dataUrl).catch(() => {})
      return dataUrl
    }

    const nativeIcon = await app.getFileIcon(displayIcon, { size: "normal" })
    const dataUrl = nativeIcon.toDataURL()
    setCachedIcon(displayIcon, dataUrl).catch(() => {})
    return dataUrl
  } catch {
    return undefined
  }
}

async function getInstalledApps(): Promise<InstalledApp[]> {
  if (cache) return cache

  try {
    const result = await executePowerShell(null, {
      script: getInstalledAppsScript,
      name: "Get-InstalledApps",
    })

    if (!result.success) {
      console.error("Failed to get installed apps:", result.error)
      return []
    }

    const rawApps = JSON.parse(result.output!)
    const rawList = Array.isArray(rawApps) ? rawApps : [rawApps]

    fs.promises.mkdir(iconCacheDir, { recursive: true }).catch(() => {})

    const apps = await Promise.all(
      rawList.map(async (raw) => {
        const iconDataUrl = await resolveIcon(raw.displayIcon)
        return {
          id: raw.id,
          name: raw.name,
          publisher: raw.publisher || "",
          version: raw.version || "Unknown",
          installDate: raw.installDate || "Unknown",
          icon: iconDataUrl,
          uninstallString: raw.uninstallString || "",
          quietUninstallString: raw.quietUninstallString || "",
          isStoreApp: raw.isStoreApp || false,
          packageName: raw.packageName || "",
          size: typeof raw.size === "number" ? raw.size : Number(raw.size) || 0,
        } as InstalledApp
      }),
    )

    cache = apps
    return apps
  } catch (error) {
    console.error("Error getting installed apps:", error)
    return []
  }
}

async function uninstallApps(
  _event: Electron.IpcMainInvokeEvent,
  apps: Array<{
    name: string
    uninstallString: string
    quietUninstallString: string
    isStoreApp: boolean
    packageName: string
  }>,
): Promise<{
  success: boolean
  results: Array<{ name: string; success: boolean; error?: string }>
}> {
  const results: Array<{ name: string; success: boolean; error?: string }> = []

  for (const { name, uninstallString, quietUninstallString, isStoreApp, packageName } of apps) {
    if (!mainWindow) {
      results.push({ name, success: false, error: "Main window not available" })
      continue
    }

    mainWindow.webContents.send("uninstall-progress", name)

    try {
      if (isStoreApp) {
        const script = `Remove-AppxPackage "${packageName}"`
        const result = await executePowerShell(null, { script, name: `Uninstall-${name}` })
        const success = result.success
        console.log(`Uninstall Store app ${name}: ${success ? "success" : "failed"}`)
        results.push({ name, success, error: success ? undefined : result.error })
        continue
      }

      const raw = quietUninstallString || uninstallString
      if (!raw) {
        results.push({ name, success: false, error: "No uninstall string available" })
        continue
      }

      const msiMatch = raw.match(/MsiExec\.exe\s+(.+)/i)

      if (!msiMatch) {
        const exeMatch = raw.match(/^(.+?\.exe)(.*)/i)
        if (!exeMatch) {
          results.push({ name, success: false, error: "Could not parse uninstall string" })
          continue
        }
        const exePath = exeMatch[1].trim()
        const exeArgs = exeMatch[2].trim()
        const script = `$p = Start-Process '${exePath.replace(/'/g, "''")}' -ArgumentList '${exeArgs || "/S"}' -PassThru; $p.WaitForExit(); Start-Sleep -Seconds 2; $p.ExitCode`

        const result = await executePowerShell(null, { script, name: `Uninstall-${name}` })
        const exitCode = parseInt(result.output?.trim() ?? "1", 10)
        const success = result.success && (exitCode === 0 || exitCode === 3010)
        console.log(`Uninstall ${name}: exit ${exitCode}`)
        results.push({ name, success, error: success ? undefined : `Exit code ${exitCode}` })
        continue
      }

      const script = `$p = Start-Process msiexec.exe -ArgumentList '${msiMatch[1].trim()} /quiet /norestart' -PassThru; $p.WaitForExit(); $p.ExitCode`

      const result = await executePowerShell(null, {
        script,
        name: `Uninstall-${name}`,
      })

      const exitCode = parseInt(result.output?.trim() ?? "1", 10)
      const success = result.success && (exitCode === 0 || exitCode === 3010)

      console.log(`Uninstall ${name}: exit ${exitCode}`)
      results.push({ name, success, error: success ? undefined : `Exit code ${exitCode}` })
    } catch (err) {
      console.error(`Uninstall ${name} failed:`, err)
      results.push({ name, success: false, error: String(err) })
    }
  }

  if (mainWindow) {
    mainWindow.webContents.send("uninstall-complete")
  }

  if (results.some((r) => r.success)) {
    cache = null
  }

  return { success: results.some((r) => r.success), results }
}

async function reloadApps(): Promise<InstalledApp[]> {
  cache = null
  return await getInstalledApps()
}

export const setupDebloatHandlers = (): void => {
  ipcMain.handle("get-installed-apps", getInstalledApps)
  ipcMain.handle("reload-installed-apps", reloadApps)
  ipcMain.handle("uninstall-apps", uninstallApps)
}

export const cleanupDebloatHandlers = (): void => {
  ipcMain.removeHandler("get-installed-apps")
  ipcMain.removeHandler("reload-installed-apps")
  ipcMain.removeHandler("uninstall-apps")
}
