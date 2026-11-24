import React from "react"

export interface SystemInfo {
  platform?: string
  arch?: string
  version?: string
  hostname?: string
  userInfo?: {
    username: string
    homedir: string
  }
  cpu_model?: string
  cpu_cores?: number
  cpu_threads?: number
  gpu_model?: string
  vram?: string
  hasGPU?: boolean
  isNvidia?: boolean
  isAmd?: boolean
  integrated_gpu?: string
  hasIntegratedGPU?: boolean
  memory_total?: number
  memory_type?: string
  memory_clock?: number
  memory_channels?: string
  memory_slots_used?: number
  memory_sticks_detail?: string
  os?: string
  os_version?: string
  disk_model?: string
  disk_size?: string
  disks?: DiskInfo[]
}

export interface DiskInfo {
  mount: string
  name?: string
  size_gb: number
  used_gb: number
  use_percent: number
}

export interface DiskMetric {
  activity: number
  readSpeedSec: number
  writeSpeedSec: number
}

export interface SystemMetrics {
  cpu_usage?: number
  cpu_temp?: number | null
  gpu_usage?: number | null
  gpu_temp?: number | null
  memory_usage?: number
  memory_used_gb?: number
  disk_metrics?: Record<string, DiskMetric>
}

export interface Tweak {
  id: string
  name: string
  title?: string
  description: string
  deepDescription?: string
  modalDescription?: string
  modal?: boolean
  category: string | string[]
  applyScript: string
  unapplyScript?: string
  restart?: boolean
  top?: boolean
  reversible?: boolean
  warning?: string
  recommended?: boolean
  addedversion?: string
  updatedversion?: string
  risk?: "safe" | "risky" | "caution"
  meta: TweakMeta
}

export interface TweakMeta {
  name: string
  title?: string
  description: string
  deepDescription?: string
  category: string
  author?: string
  version?: string
  recommended?: boolean
  warning?: string
}

export interface AppInfo {
  id: string
  name: string
  version: string
  description?: string
  icon?: string
  installed: boolean
}

export interface BackupItem {
  id: string
  name: string
  path: string
  size: number
  createdAt: Date
}

export interface DNSConfig {
  primary: string
  secondary: string
  name: string
}

export interface ElectronAPI {
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  getSystemInfo: () => Promise<SystemInfo>
  applyTweak: (tweakId: string) => Promise<boolean>
  unapplyTweak: (tweakId: string) => Promise<boolean>
  getTweaks: () => Promise<Tweak[]>
  backupSystem: () => Promise<boolean>
  restoreBackup: (backupId: string) => Promise<boolean>
  setDNS: (config: DNSConfig) => Promise<boolean>
  getApps: () => Promise<AppInfo[]>
}

export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface NavItem {
  id: string
  label: string
  icon: React.ComponentType
  path: string
}
