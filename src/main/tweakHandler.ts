import { ipcMain, app, IpcMainInvokeEvent } from "electron"
import fs from "fs/promises"
import fsSync from "fs"
import path from "path"
import { exec } from "child_process"
import { logo } from "@main/windowState"
import { executePowerShell } from "@main/powershell"
import { detectGPU } from "@main/gpu"
import log from "electron-log"

console.log = log.log
console.error = log.error
console.warn = log.warn

const userDataPath = app.getPath("userData")
const tweaksStatePath = path.join(userDataPath, "tweakStates.json")
const isDev = !app.isPackaged
const tweaksDir = isDev ? path.join(app.getAppPath(), "tweaks") : path.join(app.getAppPath(), "tweaks")

interface Tweak {
  name: string
  dirName?: string
  psapply: string
  psunapply: string
  category?: string
  description?: string
  [key: string]: any
}

const getExePath = (exeName: string): string => {
  if (isDev) {
    return path.resolve(app.getAppPath(), "resources", exeName)
  }
  return path.join(process.resourcesPath, exeName)
}

let tweaksCache: Tweak[] | null = null
let stateWriteQueue: Promise<void> = Promise.resolve()

async function updateTweakStates(
  updater: (states: Record<string, boolean>) => Record<string, boolean>,
): Promise<Record<string, boolean>> {
  const run = stateWriteQueue.then(async () => {
    let currentStates: Record<string, boolean> = {}
    try {
      if (fsSync.existsSync(tweaksStatePath)) {
        const data = await fs.readFile(tweaksStatePath, "utf8")
        currentStates = JSON.parse(data)
      }
    } catch (error) {
      console.warn("Could not read saved tweak states:", error)
    }
    const nextStates = updater(currentStates)
    await fs.mkdir(path.dirname(tweaksStatePath), { recursive: true })
    await fs.writeFile(tweaksStatePath, JSON.stringify(nextStates, null, 2), "utf8")
    return nextStates
  })
  stateWriteQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function loadTweaks(): Promise<Tweak[]> {
  if (tweaksCache) return tweaksCache
  const entries = await fs.readdir(tweaksDir, { withFileTypes: true })
  const tweaks: Tweak[] = []
  for (const dir of entries) {
    if (!dir.isDirectory()) continue

    const name = dir.name
    const folder = path.join(tweaksDir, name)

    const applyPath = path.join(folder, "apply.ps1")
    const metaPath = path.join(folder, "meta.json")

    const hasMeta = await fs
      .access(metaPath)
      .then(() => true)
      .catch(() => false)

    if (!hasMeta) continue

    const unapplyPath = path.join(folder, "unapply.ps1")

    let psapply = ""
    let psunapply = ""

    try {
      psapply = await fs.readFile(applyPath, "utf8")
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        console.warn(`Error reading apply.ps1 for tweak: ${name}`, error)
      }
    }

    try {
      psunapply = await fs.readFile(unapplyPath, "utf8")
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        console.warn(`Error reading unapply.ps1 for tweak: ${name}`, error)
      }
    }

    let meta: any = {}

    try {
      meta = JSON.parse(await fs.readFile(metaPath, "utf8"))
    } catch (error) {
      console.warn(`Error reading meta.json for tweak: ${name}`, error)
      continue
    }

    tweaks.push({
      dirName: name,
      name: meta.name || name,
      psapply,
      psunapply: psunapply || "",
      ...meta,
    })
  }
  tweaksCache = tweaks
  return tweaks
}

const getNipPath = (): string => {
  if (isDev) {
    return path.resolve(app.getAppPath(), "resources", "agbnvidia.nip")
  }
  return path.join(process.resourcesPath, "agbnvidia.nip")
}

const isGPUTweak = (tweak: Tweak): boolean => {
  if (tweak.name === "disable-mpo") return false
  return !!(tweak.category && (tweak.category === "gpu" || tweak.category.includes("gpu") || tweak.category.includes("GPU")))
}

const isNvidiaTweak = (tweak: Tweak): boolean => {
  return tweak.name.toLowerCase().includes("nvidia")
}

const isAmdTweak = (tweak: Tweak): boolean => {
  return tweak.name.toLowerCase().includes("amd")
}

const NvidiaProfileInspector = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const nipPath = getNipPath()
    const exePath = getExePath("nvidiaProfileInspector.exe")

    exec(`"${exePath}" "${nipPath}"`, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        resolve(stdout || stderr)
      }
    })
  })
}

import { detectSystemTweaks } from "./detectTweaks"

let detectingPromise: Promise<Record<string, boolean>> | null = null

export async function getMergedTweakStates(): Promise<Record<string, boolean>> {
  if (detectingPromise) return detectingPromise

  detectingPromise = (async () => {
    let savedStates: Record<string, boolean> = {}
    try {
      if (fsSync.existsSync(tweaksStatePath)) {
        const data = await fs.readFile(tweaksStatePath, "utf8")
        savedStates = JSON.parse(data)
        const legacyKey = Object.keys(savedStates).find(
          (k) => k.includes("power-plan") && k !== "agb-power-plan" && k !== "ultimate-performance-plan",
        )
        if (legacyKey) {
          if (savedStates[legacyKey]) {
            savedStates["agb-power-plan"] = true
          }
          delete savedStates[legacyKey]
        }
      }
    } catch (error) {
      console.warn("Could not read saved tweak states:", error)
    }

    // Detect live system tweak states
    const detectedStates = await detectSystemTweaks()

    // For tweaks without a direct registry check (e.g., optimize-nvidia-settings via NVAPI,
    // debloat-windows interactive package remover), preserve the saved state if it was applied by the user
    const uncheckableTweaks = ["optimize-nvidia-settings", "debloat-windows", "set-services-to-manual"]
    for (const tweakName of uncheckableTweaks) {
      if (savedStates[tweakName]) {
        detectedStates[tweakName] = true
      }
    }

    // Merge: detected states take precedence for any detected keys, preserve others
    const merged: Record<string, boolean> = {
      ...savedStates,
      ...detectedStates,
    }

    // Only keep states for valid, existing tweaks to prevent deleted or alias keys from polluting
    const allTweaks = await loadTweaks()
    const validTweakNames = new Set(allTweaks.map((t) => t.name))
    const cleanedMerged: Record<string, boolean> = {}
    for (const key of Object.keys(merged)) {
      if (validTweakNames.has(key)) {
        cleanedMerged[key] = merged[key]
      }
    }

    // Save merged state to disk safely
    try {
      await fs.mkdir(path.dirname(tweaksStatePath), { recursive: true })
      await fs.writeFile(tweaksStatePath, JSON.stringify(cleanedMerged, null, 2), "utf8")
    } catch (error) {
      console.error("Error writing merged tweak states:", error)
    }

    return cleanedMerged
  })().finally(() => {
    detectingPromise = null
  })

  return detectingPromise
}

export const setupTweaksHandlers = (): void => {
  ipcMain.handle("tweak-states:load", async (): Promise<string> => {
    try {
      const states = await getMergedTweakStates()
      return JSON.stringify(states)
    } catch (error: any) {
      console.error("Error loading tweak states:", error)
      return JSON.stringify({})
    }
  })

  ipcMain.handle("tweak-states:detect", async (): Promise<string> => {
    try {
      const states = await getMergedTweakStates()
      return JSON.stringify(states)
    } catch (error: any) {
      console.error("Error detecting tweak states:", error)
      return JSON.stringify({})
    }
  })

  ipcMain.handle(
    "tweak-states:save",
    async (_event: IpcMainInvokeEvent, payload: string): Promise<boolean> => {
      try {
        const parsed = JSON.parse(payload)
        await updateTweakStates(() => parsed)
        return true
      } catch (error) {
        console.error("Error saving tweak states:", error)
        throw error
      }
    },
  )

  ipcMain.handle("tweaks:fetch", async (): Promise<Tweak[]> => {
    return await loadTweaks()
  })

  async function runSingleTweak(name: string, mode: "apply" | "unapply"): Promise<any> {
    if (mode === "unapply" && name === "optimize-nvidia-settings") {
      await updateTweakStates((states) => ({ ...states, "optimize-nvidia-settings": false }))
      return { success: true, message: "NVIDIA profile marked as restored." }
    }

    const tweaks = await loadTweaks()
    const tweak = tweaks.find((t) => t.name === name || t.dirName === name)
    if (!tweak) {
      throw new Error(`No tweak found: ${name}`)
    }

    if (mode === "apply") {
      if (isGPUTweak(tweak) || isNvidiaTweak(tweak) || isAmdTweak(tweak)) {
        const gpuInfo = await detectGPU()
        if (isGPUTweak(tweak) && !gpuInfo.hasGPU) {
          throw new Error(`This tweak requires a dedicated GPU, but no compatible GPU was detected.`)
        }
        if (isNvidiaTweak(tweak) && !gpuInfo.isNvidia) {
          throw new Error(`This tweak is only for NVIDIA GPUs, but no NVIDIA GPU was detected.`)
        }
        if (isAmdTweak(tweak) && !gpuInfo.isAmd) {
          throw new Error(`This tweak is only for AMD Radeon GPUs, but no AMD GPU was detected.`)
        }
      }

      let result: any
      if (name === "optimize-nvidia-settings") {
        console.log(logo, "Running Nvidia settings optimization...")
        result = await NvidiaProfileInspector()
      } else {
        result = await executePowerShell(null, { script: tweak.psapply, name })
      }

      if (result?.success !== false) {
        await updateTweakStates((states) => {
          const next = { ...states, [name]: true }
          if (tweak.dirName) next[tweak.dirName] = true
          return next
        })
      }
      return result
    } else {
      if (!tweak.psunapply) {
        throw new Error(`No unapply script found for tweak: ${name}`)
      }
      const result = await executePowerShell(null, { script: tweak.psunapply, name })
      if (result?.success !== false) {
        await updateTweakStates((states) => {
          const next = { ...states, [name]: false }
          if (tweak.dirName) next[tweak.dirName] = false
          return next
        })
      }
      return result
    }
  }

  async function runBatchTweaks(
    names: string[],
    mode: "apply" | "unapply",
  ): Promise<Record<string, { success: boolean; error?: string }>> {
    const outcomes: Record<string, { success: boolean; error?: string }> = {}
    if (!Array.isArray(names) || names.length === 0) return outcomes

    const tweaks = await loadTweaks()
    const gpuInfo = mode === "apply" ? await detectGPU() : null
    const psBatchItems: Array<{ name: string; dirName?: string; script: string }> = []

    for (const name of names) {
      if (mode === "unapply" && name === "optimize-nvidia-settings") {
        outcomes[name] = { success: true }
        continue
      }

      const tweak = tweaks.find((t) => t.name === name || t.dirName === name)
      if (!tweak) {
        outcomes[name] = { success: false, error: `Tweak not found: ${name}` }
        continue
      }

      if (mode === "apply" && gpuInfo) {
        if (isGPUTweak(tweak) && !gpuInfo.hasGPU) {
          outcomes[name] = { success: false, error: "Requires dedicated GPU" }
          continue
        }
        if (isNvidiaTweak(tweak) && !gpuInfo.isNvidia) {
          outcomes[name] = { success: false, error: "Requires NVIDIA GPU" }
          continue
        }
        if (isAmdTweak(tweak) && !gpuInfo.isAmd) {
          outcomes[name] = { success: false, error: "Requires AMD GPU" }
          continue
        }
      }

      if (mode === "apply" && name === "optimize-nvidia-settings") {
        try {
          const res: any = await NvidiaProfileInspector()
          outcomes[name] = { success: res?.success !== false, error: res?.error }
        } catch (err: any) {
          outcomes[name] = { success: false, error: err?.message || String(err) }
        }
        continue
      }

      const script = mode === "apply" ? tweak.psapply : tweak.psunapply
      if (!script) {
        outcomes[name] = { success: false, error: `No ${mode} script for ${name}` }
        continue
      }

      if (/\bexit\b/i.test(script)) {
        const res = await executePowerShell(null, { script, name: `${mode}-${name}` })
        outcomes[name] = { success: res.success, error: res.error }
      } else {
        psBatchItems.push({ name, dirName: tweak.dirName, script })
      }
    }

    if (psBatchItems.length > 0) {
      const encodedEntries = psBatchItems.map((item) => ({
        name: item.name,
        b64: Buffer.from(item.script, "utf8").toString("base64"),
      }))
      const batchScript = `
$ErrorActionPreference = 'Continue'
$items = '${JSON.stringify(encodedEntries).replace(/'/g, "''")}' | ConvertFrom-Json
$batchResults = @{}
foreach ($item in $items) {
    try {
        $code = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($item.b64))
        $sb = [ScriptBlock]::Create($code)
        & $sb | Out-Null
        $batchResults[$item.name] = @{ success = $true }
    } catch {
        $batchResults[$item.name] = @{ success = $false; error = $_.Exception.Message }
    }
}
Write-Output ("__AGB_BATCH_START__" + ($batchResults | ConvertTo-Json -Compress) + "__AGB_BATCH_END__")
`
      const res = await executePowerShell(null, { script: batchScript, name: `batch-${mode}` })
      const match = res.output?.match(/__AGB_BATCH_START__(.*?)__AGB_BATCH_END__/)
      if (res.success && match) {
        try {
          const parsed = JSON.parse(match[1])
          for (const item of psBatchItems) {
            const entry = parsed[item.name]
            outcomes[item.name] = entry ? { success: !!entry.success, error: entry.error } : { success: true }
          }
        } catch {
          for (const item of psBatchItems) {
            outcomes[item.name] = { success: true }
          }
        }
      } else {
        for (const item of psBatchItems) {
          outcomes[item.name] = { success: res.success, error: res.error }
        }
      }
    }

    await updateTweakStates((states) => {
      const next = { ...states }
      for (const [name, outcome] of Object.entries(outcomes)) {
        if (outcome.success) {
          const val = mode === "apply"
          next[name] = val
          const tweak = tweaks.find((t) => t.name === name || t.dirName === name)
          if (tweak?.dirName) next[tweak.dirName] = val
        }
      }
      return next
    })

    return outcomes
  }

  ipcMain.handle("tweak:apply", async (_: any, name: string): Promise<any> => {
    return await runSingleTweak(name, "apply")
  })

  ipcMain.handle("tweak:unapply", async (_: any, name: string): Promise<any> => {
    return await runSingleTweak(name, "unapply")
  })

  ipcMain.handle("tweak:apply-batch", async (_: any, names: string[]) => {
    return await runBatchTweaks(names, "apply")
  })

  ipcMain.handle("tweak:unapply-batch", async (_: any, names: string[]) => {
    return await runBatchTweaks(names, "unapply")
  })

  ipcMain.handle("nvidia:open-control-panel", async () => {
    return new Promise((resolve) => {
      exec(
        'powershell -NoProfile -Command "Start-Process shell:AppsFolder\\NVIDIACorp.NVIDIAControlPanel_56jybvy8sckqj!NVIDIACorp.NVIDIAControlPanel"',
        (err) => {
          if (!err) {
            resolve({ success: true })
          } else {
            exec('start "" nvcplui.exe', (err2) => {
              if (!err2) {
                resolve({ success: true })
              } else {
                resolve({ success: false, error: err2.message })
              }
            })
          }
        },
      )
    })
  })

  ipcMain.handle("nvidia-inspector", (_: any, _args: any): Promise<string> => {
    return NvidiaProfileInspector()
  })

  ipcMain.handle("tweak:active", async (): Promise<string[]> => {
    try {
      const states = await getMergedTweakStates()
      return Object.keys(states).filter((key) => states[key])
    } catch (error) {
      console.error("Error detecting active tweaks in tweak:active:", error)
      return getActiveTweaks()
    }
  })
  console.log("[AGB main/tweakHandler.ts]: Tweak handlers setup complete")
}

export const getActiveTweaks = (): string[] => {
  try {
    if (!fsSync.existsSync(tweaksStatePath)) {
      return []
    }
    const data = fsSync.readFileSync(tweaksStatePath, "utf8")
    const parsed = JSON.parse(data)
    return Object.keys(parsed).filter((key) => parsed[key])
  } catch (error) {
    console.error("Error loading tweak states:", error)
    return []
  }
}

export const cleanupTweaksHandlers = (): void => {
  ipcMain.removeHandler("tweak-states:load")
  ipcMain.removeHandler("tweak-states:detect")
  ipcMain.removeHandler("tweak-states:save")
  ipcMain.removeHandler("tweaks:fetch")
  ipcMain.removeHandler("tweak:apply")
  ipcMain.removeHandler("tweak:unapply")
  ipcMain.removeHandler("tweak:apply-batch")
  ipcMain.removeHandler("tweak:unapply-batch")
  ipcMain.removeHandler("tweak:active")
  ipcMain.removeHandler("nvidia-inspector")
}

export default {
  setupTweaksHandlers,
  cleanupTweaksHandlers,
}
