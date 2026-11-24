import RootDiv from "@/components/rootdiv"
import Button from "@/components/ui/button"
import Card from "@/components/ui/Card"
import Toggle from "@/components/ui/Toggle"
import {
  GpuIcon,
  HardDrive,
  Monitor,
  Volume2Icon,
  WifiIcon,
  Wrench,
  Star,
  NetworkIcon,
  BluetoothIcon,
  SearchIcon,
  Download,
  ExternalLink,
  ShieldCheck,
  Gamepad2,
  RotateCw,
} from "lucide-react"
import { useState, useEffect } from "react"
import { invoke } from "@/lib/electron"
import { toast } from "react-toastify"
import log from "electron-log/renderer"
import { Dropdown } from "@/components/ui/dropdown"
import { LargeInput } from "@/components/ui/input"
import Modal from "@/components/ui/modal"
import useLanguageStore from "@/store/languageStore"

type Utility = {
  name: string
  command?: string
  description: string
  state: boolean
  icon: React.ReactNode
  type: "button" | "toggle" | "dropdown"
  buttonText?: string
  options?: string[]
  checkScript?: string
  applyScript?: string | Record<string, string>
  unapplyScript?: string
  runScript?: string
}

const utilities: Utility[] = [
  {
    name: "System Information",
    command: "msinfo32",
    description: "View detailed information about your system.",
    state: false,
    icon: <Monitor />,
    type: "button",
    buttonText: "View Info",
    runScript: "msinfo32",
  },
  {
    name: "Graphics Driver",
    description: "Restart your graphics driver to fix display issues.",
    state: false,
    icon: <GpuIcon />,
    type: "button",
    buttonText: "Restart",
    runScript: `
try {
    $gpus = Get-PnpDevice -Class Display -Status OK -ErrorAction SilentlyContinue
    if ($gpus) {
        foreach ($gpu in $gpus) {
            Write-Output "Reiniciando $($gpu.FriendlyName)..."
            Disable-PnpDevice -InstanceId $gpu.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
            Enable-PnpDevice -InstanceId $gpu.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
        }
        Write-Output "Driver de video reiniciado com sucesso."
    } else {
        Write-Output "Nenhum dispositivo de video ativo encontrado."
    }
} catch {
    Write-Output "Aviso: $_"
} finally {
    Get-PnpDevice -Class Display -Status Error -ErrorAction SilentlyContinue | Enable-PnpDevice -Confirm:$false -ErrorAction SilentlyContinue
}
`,
  },
  {
    name: "Restart Windows Explorer",
    description: "Restarts Windows Explorer and taskbar to fix display issues or freezes.",
    state: false,
    icon: <Monitor />,
    type: "button",
    buttonText: "Restart",
    runScript: "Stop-Process -Name explorer -Force; Start-Process explorer",
  },
  {
    name: "Windows Search and UI",
    description: "Restart your Windows Search and UI to fix display issues. (May take a while)",
    state: false,
    icon: <Monitor />,
    type: "button",
    buttonText: "Restart",
    runScript: `
try {
    Get-AppxPackage Microsoft.Windows.Search | Reset-AppxPackage
    Write-Output "Microsoft.Windows.Search restart completed."
}
catch {
    Write-Output "An error occured while resetting Microsoft.Windows.Search."
}
try {
    Get-AppxPackage MicrosoftWindows.Client.CBS | Reset-AppxPackage
    Write-Output "MicrosoftWindows.Client.CBS restart completed."
}
catch {
    Write-Output "An error occured while resetting MicrosoftWindows.Client.CBS."
}
`,
  },
  {
    name: "Renew IP Connection",
    command: "ipconfig /renew",
    description: "Re-authenticates network lease with router by releasing and renewing DHCP IP.",
    state: false,
    icon: <NetworkIcon />,
    type: "button",
    buttonText: "Renew IP",
    runScript: `
Write-Output "Liberando concessao de IP antiga..."
ipconfig /release | Out-Null
Start-Sleep -Milliseconds 800
Write-Output "Solicitando novo IP ao roteador (DHCP)..."
$res = ipconfig /renew
$res | ForEach-Object { Write-Output $_ }
Write-Output ""
Write-Output "Conexao de rede restabelecida com sucesso!"
`,
  },
  {
    name: "Fix Bluetooth",
    description: "Restart Bluetooth services to resolve connectivity issues.",
    state: false,
    icon: <BluetoothIcon />,
    type: "button",
    buttonText: "Fix",
    runScript: `
Stop-Service -Name "bthserv" -Force -ErrorAction SilentlyContinue
Start-Service -Name "bthserv" -ErrorAction SilentlyContinue
Write-Output "Bluetooth services restarted."
`,
  },
  {
    name: "System File Checker",
    command: "sfc /scannow",
    description: "Repair corrupted system files to improve stability.",
    state: false,
    icon: <Wrench />,
    type: "button",
    buttonText: "Repair",
    runScript: `
Start-Process powershell -Verb RunAs -WorkingDirectory "$env:SystemRoot\\System32" -ArgumentList "-NoExit", "-Command", "sfc /scannow; Write-Output 'System File Checker completed'"

`,
  },
  {
    name: "DISM Health Restore",
    command: "dism /restorehealth",
    description: "Use DISM to repair the Windows image and fix system issues.",
    state: false,
    icon: <Star />,
    type: "button",
    buttonText: "Repair",
    runScript: `
Start-Process powershell -Verb RunAs -WorkingDirectory "$env:SystemRoot\\System32" -ArgumentList "-NoExit", "-Command", "dism /online /cleanup-image /restorehealth; Write-Output 'DISM Health Restore completed'"

`,
  },
  {
    name: "Check Disk",
    command: "chkdsk",
    description: "Check and fix disk errors on your system safely without SSD wear.",
    state: false,
    icon: <HardDrive />,
    type: "button",
    buttonText: "Check",
    runScript: `
Start-Process powershell -Verb RunAs -WorkingDirectory "$env:SystemRoot\\System32" -ArgumentList "-NoExit", "-Command", "Write-Output 'Iniciando verificacao de integridade do disco (modo seguro para SSD/NVMe/HD)...'; chkdsk.exe $env:SystemDrive /scan; Write-Output ''; Write-Output 'Verificacao de integridade do disco concluida!'"

`,
  },
  {
    name: "Restart Audio Service",
    description: "Fix sound issues by restarting Windows Audio.",
    state: false,
    icon: <Volume2Icon />,
    type: "button",
    buttonText: "Restart",
    runScript: `
Stop-Service -Name "Audiosrv" -Force -ErrorAction SilentlyContinue
Start-Service -Name "Audiosrv" -ErrorAction SilentlyContinue
Write-Output "Audio service restarted."
`,
  },
  {
    name: "Network Reset",
    command: "netsh",
    description: "Reset your network stack to fix connectivity problems.",
    state: false,
    icon: <WifiIcon />,
    type: "button",
    buttonText: "Reset",
    runScript: `
netsh winsock reset
netsh int ip reset
Write-Output "Network stack reset. Restart your PC to apply changes."
`,
  },
  {
    name: "DPC Latency & Driver Diagnostics",
    description: "Check system timer precision and scan for high latency driver interrupts causing audio clicks or game stutters.",
    state: false,
    icon: <Wrench />,
    type: "button",
    buttonText: "Diagnose",
    runScript: `
$code = @'
using System;
using System.Runtime.InteropServices;

public class AGBPrecisionDiagnostics {
    [DllImport("winmm.dll")]
    public static extern uint timeBeginPeriod(uint uPeriod);

    [DllImport("winmm.dll")]
    public static extern uint timeEndPeriod(uint uPeriod);

    [DllImport("ntdll.dll")]
    public static extern int NtQueryTimerResolution(out uint MinimumResolution, out uint MaximumResolution, out uint CurrentResolution);

    [DllImport("ntdll.dll")]
    public static extern int NtSetTimerResolution(uint DesiredResolution, bool SetResolution, out uint CurrentResolution);
}
'@
Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue

$minRes = 0; $maxRes = 0; $curRes = 0
[AGBPrecisionDiagnostics]::NtQueryTimerResolution([ref]$minRes, [ref]$maxRes, [ref]$curRes) | Out-Null
$sysResMs = [math]::Round($curRes / 10000, 3)

$cpu = Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1
$isIntel = ($cpu -and $cpu.Manufacturer -match 'Intel')
$isAmd = ($cpu -and $cpu.Manufacturer -match 'AMD')

$powerPlan = "Nao identificado"
try {
    $planOutput = powercfg /getactivescheme 2>$null
    if ($planOutput -match '\((.+?)\)') { $powerPlan = $matches[1] }
} catch {}

$qpcFreqMhz = [math]::Round([System.Diagnostics.Stopwatch]::Frequency / 1000000, 1)

$origPriority = [System.Threading.Thread]::CurrentThread.Priority
$samples = @()

try {
    [System.Threading.Thread]::CurrentThread.Priority = [System.Threading.ThreadPriority]::Highest
    [AGBPrecisionDiagnostics]::timeBeginPeriod(1) | Out-Null
    $setRes = 0
    [AGBPrecisionDiagnostics]::NtSetTimerResolution(5000, $true, [ref]$setRes) | Out-Null

    # Warm-up JIT and CPU power states
    1..3 | ForEach-Object {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        [System.Threading.Thread]::Sleep(5)
        $sw.Stop()
    }

    # 10 precise test intervals (5 ms target)
    1..10 | ForEach-Object {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        [System.Threading.Thread]::Sleep(5)
        $sw.Stop()
        $samples += [math]::Abs($sw.Elapsed.TotalMilliseconds - 5)
    }
} finally {
    $dummy = 0
    [AGBPrecisionDiagnostics]::NtSetTimerResolution(0, $false, [ref]$dummy) | Out-Null
    [AGBPrecisionDiagnostics]::timeEndPeriod(1) | Out-Null
    [System.Threading.Thread]::CurrentThread.Priority = $origPriority
}

$avgJitter = [math]::Round(($samples | Measure-Object -Average).Average, 3)
$maxJitter = [math]::Round(($samples | Measure-Object -Maximum).Maximum, 3)
$minJitter = [math]::Round(($samples | Measure-Object -Minimum).Minimum, 3)
$avgJitterUs = [math]::Round($avgJitter * 1000, 0)
$maxJitterUs = [math]::Round($maxJitter * 1000, 0)

Write-Output "========================================="
Write-Output "   RELATORIO DE LATENCIA DPC E DRIVERS   "
Write-Output "========================================="
if ($cpu) { Write-Output "Processador: $($cpu.Name.Trim())" }
Write-Output "Plano de Energia: $powerPlan"
Write-Output "Temporizador QPC: $qpcFreqMhz MHz (Alta Precisao)"
Write-Output "Resolucao Base do Sistema: $sysResMs ms"
Write-Output "-----------------------------------------"
Write-Output "Jitter Medio do Temporizador: $avgJitter ms ($avgJitterUs us)"
Write-Output "Pico Maximo de Oscilacao: $maxJitter ms ($maxJitterUs us)"
Write-Output "Menor Oscilacao Medida: $minJitter ms"

if ($avgJitter -lt 0.6 -and $maxJitter -lt 1.5) {
    Write-Output "Avaliacao: EXCELENTE (Latencia ultra-baixa de sub-milissegundo, ideal para eSports e altas taxas de atualizacao)."
} elseif ($avgJitter -lt 1.2 -and $maxJitter -lt 2.5) {
    Write-Output "Avaliacao: BOM (Temporizacao estavel e consistente para jogos e multitarefa)."
} else {
    Write-Output "Avaliacao: ATENCAO (Oscilacao moderada/elevada detectada. Verifique se ha processos pesados em segundo plano)."
}
Write-Output ""

Write-Output "Diagnostico de Dispositivos e Drivers:"
$problem = Get-PnpDevice -Status Error,Degraded -ErrorAction SilentlyContinue
if ($problem) {
    Write-Output "ALERTA: Foram encontrados $($problem.Count) dispositivos com aviso/erro de driver:"
    foreach ($dev in $problem) {
        $devName = if ($dev.FriendlyName) { $dev.FriendlyName } elseif ($dev.Name) { $dev.Name } elseif ($dev.Description) { $dev.Description } else { "Dispositivo PCI Desconhecido ($($dev.InstanceId))" }
        Write-Output " - $devName [Status: $($dev.Status)]"
    }
    Write-Output ""
    Write-Output "CAUSA E CORRECAO:"
    if ($isIntel) {
        Write-Output "Detectado processador INTEL. Dispositivos PCI e Controlador de barramento SM com erro indicam a falta dos drivers de Chipset da sua placa-mae (Intel Chipset INF / Management Engine / Serial IO)."
        Write-Output "A falta desses drivers forca o barramento PCI a operar em fallback generico, elevando a latencia DPC e causando stutters em jogos."
        Write-Output "Solucao recomendada: Use os botoes de acao rapida abaixo para instalar o Assistente Oficial Intel ou verificar drivers pendentes no Windows Update."
    } elseif ($isAmd) {
        Write-Output "Detectado processador AMD. Dispositivos com aviso indicam a falta do pacote oficial AMD Chipset Drivers."
        Write-Output "A falta desses drivers pode prejudicar o escalonamento dos nucleos e a comunicacao de barramento."
        Write-Output "Solucao recomendada: Use os botoes abaixo para abrir o instalador oficial Auto-Detect da AMD ou verificar o Windows Update."
    } else {
        Write-Output "Dispositivos PCI / Barramento com aviso detectados. Instale os drivers de Chipset da sua placa-mae."
    }
} else {
    Write-Output "Status: Todos os drivers e dispositivos essenciais estao operando de forma saudavel."
}
`,
  },
  {
    name: "Windows Update",
    description: "Scan and install pending Windows 11 updates, security patches, and driver fixes.",
    state: false,
    icon: <Download />,
    type: "button",
    buttonText: "Check / Update",
    runScript: `
Write-Output "Iniciando verificacao de atualizacoes do Windows..."
try {
    Start-Process "usoclient.exe" "StartInteractiveScan" -ErrorAction SilentlyContinue
    Start-Process "ms-settings:windowsupdate"
    Write-Output "Windows Update aberto com sucesso!"
    Write-Output "O sistema esta verificando e baixando as atualizacoes pendentes de seguranca e drivers."
} catch {
    Start-Process "ms-settings:windowsupdate"
    Write-Output "Windows Update aberto."
}
`,
  },
  {
    name: "Anti-Cheat Readiness Checker",
    description: "Verify TPM 2.0, Secure Boot, Core Isolation (HVCI) and Virtualization status for FACEIT, GamersClub and Vanguard.",
    state: false,
    icon: <ShieldCheck />,
    type: "button",
    buttonText: "Verify",
    runScript: `
Write-Output "========================================="
Write-Output "  VERIFICADOR ANTI-CHEAT (COMPETITIVO)   "
Write-Output "========================================="

$tpm = $null
try { $tpm = Get-Tpm -ErrorAction SilentlyContinue } catch {}
$tpmStatus = if ($tpm -and $tpm.TpmPresent -and $tpm.TpmReady) { "ATIVO / PRONTO" } elseif ($tpm -and $tpm.TpmPresent) { "PRESENTE (NAO INICIALIZADO)" } else { "DESATIVADO OU AUSENTE" }
Write-Output "TPM 2.0: $tpmStatus"

$sbStatus = "DESCONHECIDO"
try {
    $sb = Confirm-SecureBootUEFI -ErrorAction Stop
    $sbStatus = if ($sb) { "ATIVADO" } else { "DESATIVADO" }
} catch {
    $sbStatus = "INDISPONIVEL (BIOS Legacy ou sem permissao)"
}
Write-Output "Secure Boot: $sbStatus"

$hvci = (Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity" -Name "Enabled" -ErrorAction SilentlyContinue).Enabled
$hvciStatus = if ($hvci -eq 1) { "ATIVADO" } else { "DESATIVADO" }
Write-Output "Integridade de Memoria (HVCI / Core Isolation): $hvciStatus"

$vbs = (Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\\Microsoft\\Windows\\DeviceGuard -ErrorAction SilentlyContinue).VirtualizationBasedSecurityStatus
$vbsStatus = switch ($vbs) { 2 { "EM EXECUCAO" } 1 { "HABILITADA (PARADA)" } default { "DESATIVADA" } }
Write-Output "Seguranca Baseada em Virtualizacao (VBS): $vbsStatus"
Write-Output "-----------------------------------------"

$issues = @()
if ($tpmStatus -notlike "ATIVO*") { $issues += "- TPM 2.0 precisa estar ativo na BIOS para FACEIT / Valorant (Vanguard)." }
if ($sbStatus -ne "ATIVADO") { $issues += "- Secure Boot precisa estar ativo na BIOS para FACEIT / Valorant (Vanguard)." }
if ($hvci -ne 1) { $issues += "- HVCI (Core Isolation) esta DESATIVADO: o FACEIT Anti-Cheat e a GamersClub frequentemente exigem HVCI ativo no Windows 11." }

if ($issues.Count -eq 0) {
    Write-Output "VEREDITO: PRONTO PARA JOGAR! Todos os requisitos de anti-cheat (FACEIT, GamersClub e Vanguard) estao ativos."
} else {
    Write-Output "ATENCAO - PENDENCIAS DETECTADAS:"
    foreach ($i in $issues) { Write-Output $i }
}
`,
  },
  {
    name: "Per-Game Exe Optimizer",
    description: "Select a game .exe to apply High-Performance GPU, Disable Fullscreen Optimizations (FSO) and App DPI control individually.",
    state: false,
    icon: <Gamepad2 />,
    type: "button",
    buttonText: "Select .exe",
    runScript: `
Add-Type -AssemblyName System.Windows.Forms
$topForm = New-Object System.Windows.Forms.Form
$topForm.TopMost = $true
$topForm.StartPosition = 'CenterScreen'
$topForm.ShowInTaskbar = $false
$topForm.Opacity = 0

$dlg = New-Object System.Windows.Forms.OpenFileDialog
$dlg.Title = "AGB - Selecione o executavel (.exe) do jogo"
$dlg.Filter = "Executaveis de Jogos (*.exe)|*.exe"
$dlg.Multiselect = $false

$res = $dlg.ShowDialog($topForm)
$topForm.Dispose()

if ($res -ne [System.Windows.Forms.DialogResult]::OK -or -not $dlg.FileName) {
    Write-Output "Selecao cancelada pelo usuario."
    return
}

$exePath = $dlg.FileName

# 1. GPU de Alto Desempenho no Windows Graphics Settings
$gpuKey = "HKCU:\\Software\\Microsoft\\DirectX\\UserGpuPreferences"
if (-not (Test-Path $gpuKey)) { New-Item -Path $gpuKey -Force | Out-Null }
Set-ItemProperty -Path $gpuKey -Name $exePath -Value "GpuPreference=2;" -Type String -ErrorAction SilentlyContinue

# 2. Desativar Otimizacoes de Tela Cheia (FSO) + Controle de DPI pelo Aplicativo (apenas neste .exe)
$layersKey = "HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers"
if (-not (Test-Path $layersKey)) { New-Item -Path $layersKey -Force | Out-Null }
Set-ItemProperty -Path $layersKey -Name $exePath -Value "~ DISABLEDXMAXIMIZEDWINDOWEDMODE HIGHDPIAWARE" -Type String -ErrorAction SilentlyContinue

Write-Output "========================================="
Write-Output "    OTIMIZACAO POR JOGO APLICADA!        "
Write-Output "========================================="
Write-Output "Executavel: $exePath"
Write-Output ""
Write-Output "Ajustes aplicados exclusivamente neste jogo:"
Write-Output " - GPU Preferida: Alto Desempenho (GpuPreference=2)"
Write-Output " - Otimizacoes de Tela Cheia (FSO): Desativadas para este .exe"
Write-Output " - Escala de DPI: Controlada pelo Aplicativo (HIGHDPIAWARE)"
Write-Output ""
Write-Output "Obs.: Seguro para jogos DX9/DX11 e sem afetar outros jogos DX12/Vulkan."
`,
  },
  {
    name: "Restore Per-Game Exe Optimizations",
    description: "List and revert custom GPU, Fullscreen Optimizations (FSO) and DPI flags previously applied to game executables.",
    state: false,
    icon: <RotateCw />,
    type: "button",
    buttonText: "Revert Games",
    runScript: `
$gpuKey = "HKCU:\\Software\\Microsoft\\DirectX\\UserGpuPreferences"
$layersKey = "HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers"

$restored = New-Object System.Collections.Generic.List[string]

if (Test-Path $layersKey) {
    $props = (Get-Item $layersKey).Property
    foreach ($p in $props) {
        $val = (Get-ItemProperty -Path $layersKey -Name $p -ErrorAction SilentlyContinue).$p
        if ($val -match "DISABLEDXMAXIMIZEDWINDOWEDMODE" -and $p -like "*.exe") {
            Remove-ItemProperty -Path $layersKey -Name $p -ErrorAction SilentlyContinue
            if (Test-Path $gpuKey) {
                Remove-ItemProperty -Path $gpuKey -Name $p -ErrorAction SilentlyContinue
            }
            $restored.Add($p)
        }
    }
}

Write-Output "========================================="
Write-Output "   REVERSAO DE OTIMIZACOES POR JOGO      "
Write-Output "========================================="
if ($restored.Count -eq 0) {
    Write-Output "Nenhum executavel (.exe) com flags de FSO/GPU aplicadas foi encontrado."
} else {
    Write-Output "Jogos restaurados ao padrao ($($restored.Count)):"
    foreach ($exe in $restored) {
        Write-Output " - $exe"
    }
}
`,
  },
]

function Utilities() {
  const { t, language, tUtility } = useLanguageStore()
  const [dropdownValues, setDropdownValues] = useState<Record<string, string>>({})
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({})
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState("")
  const [diagnosticModal, setDiagnosticModal] = useState<{ title: string; output: string } | null>(null)

  const filteredUtilities = utilities.filter((util) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    const translated = tUtility(util.name, util.name, util.description, util.buttonText)
    return (
      translated.name.toLowerCase().includes(q) ||
      translated.description.toLowerCase().includes(q) ||
      util.name.toLowerCase().includes(q) ||
      util.description.toLowerCase().includes(q) ||
      (util.command && util.command.toLowerCase().includes(q))
    )
  })

  useEffect(() => {
    const checkAllStates = async () => {
      const checkPromises = utilities.map(async (util) => {
        if (util.type === "toggle" && util.checkScript) {
          setLoadingStates((prev) => ({ ...prev, [util.name]: true }))
          try {
            const result = await invoke({
              channel: "run-powershell",
              payload: {
                script: util.checkScript,
                name: `check-${util.name}`,
              },
            })
            if (result.success) {
              const isEnabled = result.output.trim().toLowerCase() === "enabled"
              setToggleStates((prev) => ({ ...prev, [util.name]: isEnabled }))
            }
          } catch (error) {
            console.error(`Failed to check ${util.name}:`, error)
            log.error(`Failed to check ${util.name}:`, error)
          } finally {
            setLoadingStates((prev) => ({ ...prev, [util.name]: false }))
          }
        } else if (util.type === "dropdown" && util.checkScript) {
          setLoadingStates((prev) => ({ ...prev, [util.name]: true }))
          try {
            const result = await invoke({
              channel: "run-powershell",
              payload: {
                script: util.checkScript,
                name: `check-${util.name}`,
              },
            })
            if (result.success) {
              const value = result.output.trim()
              setDropdownValues((prev) => ({ ...prev, [util.name]: value }))
            }
          } catch (error) {
            console.error(`Failed to check ${util.name}:`, error)
            log.error(`Failed to check ${util.name}:`, error)
          } finally {
            setLoadingStates((prev) => ({ ...prev, [util.name]: false }))
          }
        }
      })

      await Promise.all(checkPromises)
    }

    checkAllStates()
  }, [])

  const powerPlanLabels: Record<string, string> = {
    Balanced: t("powerPlanBalanced") || "Equilibrado",
    "High Performance": t("powerPlanHigh") || "Alto Desempenho",
    "Power Saver": t("powerPlanSaver") || "Economia de Energia",
    "Ultimate Performance": t("powerPlanUltimate") || "Desempenho Máximo",
  }

  const handleToggleChange = async (util: Utility, newState: boolean) => {
    toast.dismiss()
    const previousState = toggleStates[util.name]
    setToggleStates((prev) => ({ ...prev, [util.name]: newState }))
    const translated = tUtility(util.name, util.name, util.description, util.buttonText || t("runNow"))
    const displayName = translated.name

    const script = newState ? util.applyScript : util.unapplyScript
    if (script) {
      const loadingToastId = toast.loading(
        `${newState ? (language === "pt" ? "Aplicando" : "Applying") : (language === "pt" ? "Desativando" : "Unapplying")} ${displayName}...`,
      )
      try {
        const result = await invoke({
          channel: "run-powershell",
          payload: {
            script,
            name: `${newState ? "apply" : "unapply"}-${util.name}`,
          },
        })
        if (!result.success) {
          throw new Error(result.error || "Failed to execute script")
        }
        toast.update(loadingToastId, {
          render: `${displayName} ${newState ? (language === "pt" ? "ativado com sucesso" : "applied") : (language === "pt" ? "desativado" : "unapplied")}`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
      } catch (error) {
        console.error(`Error toggling ${util.name}:`, error)
        log.error(`Error toggling ${util.name}:`, error)
        setToggleStates((prev) => ({ ...prev, [util.name]: previousState }))
        toast.update(loadingToastId, {
          render: `${language === "pt" ? "Falha ao alterar" : "Failed to change"} ${displayName}`,
          type: "error",
          isLoading: false,
          autoClose: 3000,
        })
      }
    }
  }

  const handleDropdownChange = async (util: Utility, value: string) => {
    toast.dismiss()
    const previousValue = dropdownValues[util.name]
    setDropdownValues((prev) => ({ ...prev, [util.name]: value }))
    const translated = tUtility(util.name, util.name, util.description, util.buttonText || t("runNow"))
    const displayName = translated.name
    const displayVal = util.name === "Power Plan" ? (powerPlanLabels[value] || value) : value

    if (util.applyScript) {
      const script =
        typeof util.applyScript === "object" ? util.applyScript[value] : util.applyScript
      if (script) {
        const loadingToastId = toast.loading(
          `${language === "pt" ? "Aplicando" : "Applying"} ${displayName}: ${displayVal}...`,
        )
        try {
          const result = await invoke({
            channel: "run-powershell",
            payload: {
              script,
              name: `apply-${util.name}-${value}`,
            },
          })
          if (!result.success) {
            throw new Error(result.error || "Failed to execute script")
          }
          toast.update(loadingToastId, {
            render: `${displayName}: ${displayVal} ${language === "pt" ? "aplicado com sucesso" : "applied successfully"}`,
            type: "success",
            isLoading: false,
            autoClose: 3000,
          })
        } catch (error) {
          console.error(`Error applying ${util.name}:`, error)
          log.error(`Error applying ${util.name}:`, error)
          setDropdownValues((prev) => ({ ...prev, [util.name]: previousValue }))
          toast.update(loadingToastId, {
            render: `${language === "pt" ? "Falha ao aplicar" : "Failed to apply"} ${displayName}: ${displayVal}`,
            type: "error",
            isLoading: false,
            autoClose: 3000,
          })
        }
      }
    }
  }

  const handleButtonClick = async (util: Utility) => {
    toast.dismiss()
    const translated = tUtility(util.name, util.name, util.description, util.buttonText || t("runNow"))
    const displayName = translated.name

    if (util.runScript) {
      const loadingToastId = toast.loading(
        `${language === "pt" ? "Executando" : "Running"} ${displayName}...`,
      )
      try {
        const result = await invoke({
          channel: "run-powershell",
          payload: {
            script: util.runScript,
            name: `run-${util.name}`,
          },
        })
        if (!result.success) {
          throw new Error(result.error || "Failed to execute script")
        }

        if (
          result.output &&
          (util.name.includes("DPC") ||
            util.name.includes("Diagnostics") ||
            util.name.includes("Anti-Cheat") ||
            util.name.includes("Per-Game"))
        ) {
          toast.dismiss(loadingToastId)
          setDiagnosticModal({
            title: displayName,
            output: result.output.trim(),
          })
        } else {
          toast.update(loadingToastId, {
            render: `${displayName} ${language === "pt" ? "concluído com sucesso" : "completed successfully"}`,
            type: "success",
            isLoading: false,
            autoClose: 3000,
          })
        }
      } catch (error) {
        console.error(`Error running ${util.name}:`, error)
        log.error(`Error running ${util.name}:`, error)
        toast.update(loadingToastId, {
          render: `${language === "pt" ? "Falha ao executar" : "Failed to run"} ${displayName}`,
          type: "error",
          isLoading: false,
          autoClose: 3000,
        })
      }
    }
  }

  const handleInstallIntelDSA = async () => {
    toast.info(language === "pt" ? "Iniciando instalador do Intel Driver & Support Assistant..." : "Starting Intel Driver & Support Assistant installer...")
    try {
      const script = `Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'AGB: Instalando Assistente Oficial da Intel...' -ForegroundColor Cyan; winget install Intel.IntelDriverAndSupportAssistant --accept-package-agreements --accept-source-agreements; Start-Process 'https://www.intel.com.br/content/www/br/pt/support/intel-driver-support-assistant.html'"`
      await invoke({ channel: "run-powershell", payload: { script, name: "install-intel-dsa" } })
    } catch (e) {
      toast.error(language === "pt" ? "Falha ao iniciar instalador." : "Failed to start installer.")
    }
  }

  const handleOpenAMD = () => {
    invoke({
      channel: "run-powershell",
      payload: { script: "Start-Process 'https://www.amd.com/pt/support/download/drivers.html'", name: "open-amd-drivers" },
    })
  }

  const handleOpenWindowsUpdate = () => {
    invoke({
      channel: "run-powershell",
      payload: { script: "Start-Process 'ms-settings:windowsupdate-optionalupdates'", name: "open-optional-updates" },
    })
  }

  return (
    <>
      <RootDiv>
        <div className="flex gap-4 flex-col pb-12">
          <LargeInput
            placeholder={t("searchUtilitiesPlaceholder")}
            className="w-full"
            icon={SearchIcon}
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
          {filteredUtilities.length === 0 && (
            <p className="text-agb-text-secondary flex text-center items-center justify-center gap-2">
              {language === "pt" ? "Nenhum utilitário encontrado." : "No utilities match your search."}
            </p>
          )}
          {filteredUtilities !== null &&
            filteredUtilities.map((util) => {
              const translated = tUtility(util.name, util.name, util.description, util.buttonText || t("runNow"))
              const displayName = translated.name
              const displayDesc = translated.description
              const displayBtn = translated.buttonText || t("runNow")

              return (
                <Card className="p-4 sm:p-5 flex items-center justify-between gap-4 rounded-xl hover:border-agb-primary/50 transition-all duration-150" key={util.name}>
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-agb-primary/10 text-agb-primary flex items-center justify-center shrink-0 [&>svg]:w-5 [&>svg]:h-5">
                      {util.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center">
                        <h3 className="text-sm font-semibold text-agb-text truncate">{displayName}</h3>
                        {util.command && (
                          <span className="text-[11px] font-mono text-agb-text-muted bg-agb-accent/40 border border-agb-border/60 px-2 py-0.5 rounded-md shrink-0">
                            CMD: {util.command}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-agb-text-secondary mt-0.5 leading-relaxed">{displayDesc}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end ml-auto shrink-0 pl-2">
                    {util.type === "toggle" &&
                      (loadingStates[util.name] ? (
                        <div className="w-6 h-6 border-2 border-agb-border-secondary border-t-agb-primary rounded-full animate-spin" />
                      ) : (
                        <Toggle
                          checked={toggleStates[util.name] || false}
                          onChange={(checked: boolean) => handleToggleChange(util, checked)}
                        />
                      ))}
                    {util.type === "button" && (
                      <Button
                        onClick={() => handleButtonClick(util)}
                        variant="secondary"
                        size="sm"
                        className="font-medium hover:border-agb-primary hover:text-agb-primary min-w-24 justify-center"
                      >
                        {displayBtn}
                      </Button>
                    )}
                    {util.type === "dropdown" &&
                      (loadingStates[util.name] ? (
                        <div className="w-6 h-6 border-2 border-agb-border-secondary border-t-agb-primary rounded-full animate-spin" />
                      ) : (
                        <Dropdown
                          options={util.options || []}
                          value={dropdownValues[util.name] || util.options?.[0] || ""}
                          onChange={(value) => handleDropdownChange(util, value)}
                          labels={util.name === "Power Plan" ? powerPlanLabels : undefined}
                        />
                      ))}
                  </div>
                </Card>
              )
            })}
        </div>
      </RootDiv>

      <Modal open={!!diagnosticModal} onClose={() => setDiagnosticModal(null)}>
        {diagnosticModal && (
          <div className="p-6 bg-agb-card border border-agb-border rounded-2xl max-w-xl w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-agb-primary/10 text-agb-primary">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-agb-text">{diagnosticModal.title}</h3>
                <p className="text-xs text-agb-text-secondary">
                  {language === "pt" ? "Relatório de precisão de hardware e drivers" : "Hardware precision and driver report"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-agb-bg border border-agb-border font-mono text-xs text-agb-text whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto custom-scrollbar mb-4">
              {diagnosticModal.output}
            </div>

            {/* Ações de Correção Rápida de Drivers Faltantes */}
            {diagnosticModal.output.includes("ALERTA") && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <h4 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{language === "pt" ? "Assistentes de Correção de Drivers:" : "Driver Fix Assistants:"}</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {diagnosticModal.output.includes("INTEL") ? (
                    <Button
                      onClick={handleInstallIntelDSA}
                      variant="primary"
                      className="text-xs flex items-center gap-1.5 py-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{language === "pt" ? "Instalar Assistente Intel (Auto-Detect)" : "Install Intel Assistant (Auto-Detect)"}</span>
                    </Button>
                  ) : diagnosticModal.output.includes("AMD") ? (
                    <Button
                      onClick={handleOpenAMD}
                      variant="primary"
                      className="text-xs flex items-center gap-1.5 py-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{language === "pt" ? "Abrir Auto-Detect AMD" : "Open AMD Auto-Detect"}</span>
                    </Button>
                  ) : null}

                  <Button
                    onClick={handleOpenWindowsUpdate}
                    variant="secondary"
                    className="text-xs flex items-center gap-1.5 py-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{language === "pt" ? "Buscar no Windows Update" : "Search in Windows Update"}</span>
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-agb-border/40">
              <Button
                onClick={() => {
                  invoke({
                    channel: "run-powershell",
                    payload: { script: "Start-Process devmgmt.msc", name: "open-devmgmt" },
                  })
                }}
                variant="secondary"
                className="text-xs flex items-center gap-1.5"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>{language === "pt" ? "Gerenciador de Dispositivos" : "Device Manager"}</span>
              </Button>

              <Button onClick={() => setDiagnosticModal(null)} variant="primary">
                {language === "pt" ? "Fechar" : "Close"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default Utilities
