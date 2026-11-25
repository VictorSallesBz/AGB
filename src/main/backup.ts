import { exec } from "child_process"
import { ipcMain, IpcMainInvokeEvent } from "electron"
import fs from "fs"
import log from "electron-log"
import { getAdminStatus } from "./system"

console.log = log.log
console.error = log.error
console.warn = log.warn

function runPowerShell(cmd: string): Promise<string> {
  const utf8Cmd = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [System.Text.Encoding]::UTF8; ${cmd}`
  return new Promise((resolve, reject) => {
    exec(
      `powershell -NoProfile -ExecutionPolicy Bypass -Command "${utf8Cmd}"`,
      { windowsHide: true },
      (err, stdout, stderr) => {
        if (err) return reject(stderr || err.message)
        resolve(stdout)
      },
    )
  })
}

function runPowerShellEncoded(script: string): Promise<string> {
  const utf8Script = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [System.Text.Encoding]::UTF8;\n${script}`
  const base64 = Buffer.from(utf8Script, "utf16le").toString("base64")
  return new Promise((resolve, reject) => {
    exec(
      `powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${base64}`,
      { windowsHide: true },
      (err, stdout, stderr) => {
        if (err) return reject(stderr || err.message)
        resolve(stdout)
      },
    )
  })
}

async function changeRestorePointCooldown(): Promise<void> {
  try {
    await runPowerShell(
      "New-ItemProperty -Path 'HKLM:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore' -Name 'SystemRestorePointCreationFrequency' -Value 0 -PropertyType DWord -Force",
    )
  } catch {
    // Non-fatal if unprivileged
  }
}

function sanitizeRestorePointName(name: string): string {
  return name.replace(/[^a-zA-Z0-9 _-]/g, "")
}

function getTimestamp(): string {
  const date = new Date()
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const mi = String(date.getMinutes()).padStart(2, "0")
  const ss = String(date.getSeconds()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}`
}

interface BackupResult {
  success: boolean
  label?: string
  message?: string
  error?: string
  points?: any[]
  isAdmin?: boolean
}

export const setupBackupHandlers = (): void => {
  const handleCreateAgbRestorePoint = async (): Promise<BackupResult> => {
    const label = `AGBBackup-${getTimestamp()}`
    try {
      await changeRestorePointCooldown()
      await runPowerShell(`try { Enable-ComputerRestore -Drive 'C:\\' } catch {}; Checkpoint-Computer -Description '${label}'`)
      return { success: true, label }
    } catch (error: any) {
      console.error("Error creating restore point:", error)
      return { success: false, error: error.message }
    }
  }

  ipcMain.handle("create-agb-restore-point", handleCreateAgbRestorePoint)

  ipcMain.handle(
    "create-restore-point",
    async (_event: IpcMainInvokeEvent, name?: string): Promise<BackupResult> => {
      try {
        const safeName = name ? sanitizeRestorePointName(name) : ""
        const label = safeName ? `${safeName}-${getTimestamp()}` : `ManualRestore-${getTimestamp()}`

        await changeRestorePointCooldown()
        await runPowerShell(`try { Enable-ComputerRestore -Drive 'C:\\' } catch {}; Checkpoint-Computer -Description '${label}'`)
        return { success: true, label }
      } catch (error: any) {
        console.error("Error creating custom restore point:", error)
        return { success: false, error: error.message }
      }
    },
  )

  ipcMain.handle(
    "delete-all-restore-points",
    async (_event: IpcMainInvokeEvent, _sequenceNumber?: number): Promise<BackupResult> => {
      try {
        await runPowerShell(`vssadmin delete shadows /all /quiet`)
        await changeRestorePointCooldown()
        return { success: true }
      } catch (error: any) {
        console.error("Error deleting all restore points:", error)
        return { success: false, error: error.message }
      }
    },
  )

  ipcMain.handle("get-restore-points", async (): Promise<BackupResult> => {
    try {
      const sysAdmin = await getAdminStatus().catch(() => false)
      const script = `
        $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
        try {
          $points = Get-ComputerRestorePoint -ErrorAction Stop | Select-Object SequenceNumber, Description, CreationTime, EventType, RestorePointType
          if ($points) {
            $arr = if ($points -is [array]) { $points } else { @($points) }
            @{ points = $arr; isAdmin = $isAdmin } | ConvertTo-Json -Compress
          } else {
            @{ points = @(); isAdmin = $isAdmin } | ConvertTo-Json -Compress
          }
        } catch {
          @{ points = @(); isAdmin = $isAdmin; error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
      `
      const output = await runPowerShellEncoded(script)

      let data: any = {}
      try {
        data = JSON.parse(output.trim())
      } catch {
        data = { points: [], isAdmin: sysAdmin }
      }

      const effectiveAdmin = sysAdmin || data.isAdmin === true
      const points = Array.isArray(data.points) ? data.points : (data.points ? [data.points] : [])
      return { success: true, points, isAdmin: effectiveAdmin, error: data.error }
    } catch (error: any) {
      console.error("Error getting restore points:", error)
      const sysAdmin = await getAdminStatus().catch(() => false)
      return { success: true, points: [], isAdmin: sysAdmin, error: error.message }
    }
  })

  ipcMain.handle(
    "restore-restore-point",
    async (_event: IpcMainInvokeEvent, sequenceNumber: number): Promise<BackupResult> => {
      try {
        await runPowerShell(`Restore-Computer -RestorePoint ${sequenceNumber}`)
        await changeRestorePointCooldown()
        return { success: true }
      } catch (error: any) {
        console.error(error)
        return { success: false, error: error.message }
      }
    },
  )

  const handleDeleteOldBackups = async (): Promise<BackupResult> => {
    return new Promise((resolve) => {
      const folders = [`C:\\AGB`]
      let deletedAny = false
      for (const folder of folders) {
        if (fs.existsSync(folder)) {
          try {
            fs.rmSync(folder, { recursive: true, force: true })
            deletedAny = true
          } catch (err) {
            console.error(`Error deleting ${folder}:`, err)
          }
        }
      }
      resolve({ success: true, message: deletedAny ? "Backups deleted" : "No legacy folder existed" })
    })
  }

  ipcMain.handle("delete-old-agb-backups", handleDeleteOldBackups)
  console.log("[AGB main/backup.ts]: Backup handlers setup complete")
}

export const cleanupBackupHandlers = (): void => {
  ipcMain.removeHandler("create-agb-restore-point")
  ipcMain.removeHandler("create-restore-point")
  ipcMain.removeHandler("delete-all-restore-points")
  ipcMain.removeHandler("get-restore-points")
  ipcMain.removeHandler("restore-restore-point")
  ipcMain.removeHandler("delete-old-agb-backups")
}
