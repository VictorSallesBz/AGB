import { executePowerShell } from "./powershell"
import log from "electron-log"

const DETECTION_SCRIPT = `
$results = @{}

function Get-RegVal($path, $name) {
    try {
        if (Test-Path $path) {
            $prop = Get-ItemProperty -Path $path -Name $name -ErrorAction SilentlyContinue
            if ($null -ne $prop) { return $prop.$name }
        }
    } catch {}
    return $null
}

# 24-hour-clock
$sTime = Get-RegVal 'HKCU:\\Control Panel\\International' 'sTimeFormat'
$results['24-hour-clock'] = [bool]($sTime -and ($sTime.StartsWith('HH') -or $sTime.StartsWith('H:')))

# align-taskbar-left
$al = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'TaskbarAl'
$results['align-taskbar-left'] = ($al -eq 0)

# debloat-windows
# Debloat is handled as an uncheckable/user-tracked action to avoid false positives from missing standard apps
$results['debloat-windows'] = $false

# detailed-bsod
$bsod = Get-RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\CrashControl' 'DisplayParameters'
$emot = Get-RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\CrashControl' 'DisableEmoticon'
$results['detailed-bsod'] = ($bsod -eq 1 -and $emot -eq 1)

# disable-background-ms-store-apps
$bg = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications' 'GlobalUserDisabled'
$results['disable-background-ms-store-apps'] = ($bg -eq 1)

# disable-consumer-features
$cf = Get-RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\CloudContent' 'DisableWindowsConsumerFeatures'
$cfActive = ($cf -eq 1)
$results['disable-consumer-features'] = $cfActive
$results['consumer-features'] = $cfActive

# disable-copilot
$cp1 = Get-RegVal 'HKCU:\\Software\\Policies\\Microsoft\\Windows\\WindowsCopilot' 'TurnOffWindowsCopilot'
$cp2 = Get-RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsCopilot' 'TurnOffWindowsCopilot'
$results['disable-copilot'] = ($cp1 -eq 1 -or ($cp1 -ne $null -and $cp2 -eq 1))

# disable-core-isolation
$ci = Get-RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity' 'Enabled'
$results['disable-core-isolation'] = ($ci -eq 0)

# disable-defender-rtp
try {
    $mp = Get-MpPreference -ErrorAction SilentlyContinue
    if ($mp) {
        $results['disable-defender-rtp'] = [bool]($mp.DisableRealtimeMonitoring -eq $true)
    } else {
        $def1 = Get-RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\\Real-Time Protection' 'DisableRealtimeMonitoring'
        $def2 = Get-RegVal 'HKLM:\\SOFTWARE\\Microsoft\\Windows Defender\\Real-Time Protection' 'DisableRealtimeMonitoring'
        $results['disable-defender-rtp'] = ($def1 -eq 1 -and $def2 -eq 1)
    }
} catch {
    $results['disable-defender-rtp'] = $false
}

# disable-gamebar
$gb1 = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR' 'AppCaptureEnabled'
$gb2 = Get-RegVal 'HKCU:\\System\\GameConfigStore' 'GameDVR_Enabled'
$results['disable-gamebar'] = ($gb1 -eq 0 -and $gb2 -eq 0)

# disable-hibernation
$hib = Get-RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Power' 'HibernateEnabled'
$results['disable-hibernation'] = ($hib -eq 0)

# disable-location-tracking
$loc1 = Get-RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\LocationAndSensors' 'DisableLocation'
$loc2 = Get-RegVal 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location' 'Value'
$results['disable-location-tracking'] = ($loc1 -eq 1 -and $loc2 -eq 'Deny')

# disable-lockscreen-tips
$tips1 = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager' 'RotatingLockScreenOverlayEnabled'
$tips2 = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager' 'SubscribedContent-338387Enabled'
$results['disable-lockscreen-tips'] = ($tips1 -eq 0 -and $tips2 -eq 0)

# disable-mouse-acceleration
$mouse = Get-RegVal 'HKCU:\\Control Panel\\Mouse' 'MouseSpeed'
$mThresh1 = Get-RegVal 'HKCU:\\Control Panel\\Mouse' 'MouseThreshold1'
$results['disable-mouse-acceleration'] = ($mouse -eq '0' -and $mThresh1 -eq '0')

# disable-rdp-warnings
$rdp1 = Get-RegVal 'HKLM:\\Software\\Policies\\Microsoft\\Windows NT\\Terminal Services\\Client' 'RedirectionWarningDialogVersion'
$rdp2 = Get-RegVal 'HKCU:\\Software\\Microsoft\\Terminal Server Client' 'AuthenticationLevelOverride'
$results['disable-rdp-warnings'] = ($rdp1 -eq 1 -and $rdp2 -eq 0)

# disable-recall
$recall1 = Get-RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsAI' 'AllowRecallEnablement'
$recall2 = Get-RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsAI' 'DisableAIDataAnalysis'
$recallActive = ($recall1 -eq 0 -and $recall2 -eq 1)
$results['disable-recall'] = $recallActive
$results['disable-windows-recall'] = $recallActive

# disable-taskbar-search
$tbSearch = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Search' 'SearchboxTaskbarMode'
$results['disable-taskbar-search'] = ($tbSearch -eq 0)

# disable-telemetry
$telem1 = Get-RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection' 'AllowTelemetry'
$telem2 = Get-RegVal 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\DataCollection' 'AllowTelemetry'
$diag = Get-Service -Name 'diagtrack' -ErrorAction SilentlyContinue
$results['disable-telemetry'] = [bool](($diag -and $diag.StartType -eq 'Disabled') -and ($telem1 -eq 0 -or $telem2 -eq 0))

# disable-wifi-sense
$wifi1 = Get-RegVal 'HKLM:\\SOFTWARE\\Microsoft\\PolicyManager\\default\\WiFi\\AllowWiFiHotSpotReporting' 'value'
$wifi2 = Get-RegVal 'HKLM:\\SOFTWARE\\Microsoft\\PolicyManager\\default\\WiFi\\AllowAutoConnectToWiFiSenseHotspots' 'value'
$results['disable-wifi-sense'] = ($wifi1 -eq 0 -and $wifi2 -eq 0)

# enable-dark-mode
$darkApps = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize' 'AppsUseLightTheme'
$darkSys = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize' 'SystemUsesLightTheme'
$results['enable-dark-mode'] = ($darkApps -eq 0 -and $darkSys -eq 0)

# enable-end-task-right-click
$endTask = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\\TaskbarDeveloperSettings' 'TaskbarEndTask'
$results['enable-end-task-right-click'] = ($endTask -eq 1)

# enable-game-mode
$gameMode1 = Get-RegVal 'HKCU:\\Software\\Microsoft\\GameBar' 'AutoGameModeEnabled'
$gameMode2 = Get-RegVal 'HKCU:\\Software\\Microsoft\\GameBar' 'AllowAutoGameMode'
$results['enable-game-mode'] = ($gameMode1 -eq 1 -and $gameMode2 -eq 1)

# enable-hags
$hags = Get-RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers' 'HwSchMode'
$results['enable-hags'] = ($hags -eq 2)

# enable-optimization-for-windowed-games
$winGames = Get-RegVal 'HKCU:\\Software\\Microsoft\\DirectX\\UserGpuPreferences' 'DirectXUserGlobalSettings'
$results['enable-optimization-for-windowed-games'] = [bool]($winGames -and ($winGames -match 'SwapEffectUpgradeEnable=1'))

# hide-taskview-and-widgets
$tv = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'ShowTaskViewButton'
$da = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'TaskbarDa'
$results['hide-taskview-and-widgets'] = ($tv -eq 0 -and $da -eq 0)

# menu-show-delay-zero
$menu = Get-RegVal 'HKCU:\\Control Panel\\Desktop' 'MenuShowDelay'
$results['menu-show-delay-zero'] = ($menu -eq '0')

# optimize-network-settings
$net = Get-RegVal 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' 'NetworkThrottlingIndex'
$resp = Get-RegVal 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' 'SystemResponsiveness'
$results['optimize-network-settings'] = (($net -eq -1 -or $net -eq 4294967295) -and ($resp -ne $null -and $resp -le 10))

# optimize-input-lag
$mouQueue = Get-RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\mouclass\\Parameters' 'DataQueueSize'
$kbdQueue = Get-RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\kbdclass\\Parameters' 'DataQueueSize'
$results['optimize-input-lag'] = ($mouQueue -gt 0 -and $mouQueue -le 64 -and $kbdQueue -gt 0 -and $kbdQueue -le 64)

# optimize-amd-settings
try {
    $amdUlps = Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\*" -Name "EnableUlps" -ErrorAction SilentlyContinue | Select-Object -First 1
    $results['optimize-amd-settings'] = ($amdUlps -ne $null -and $amdUlps.EnableUlps -eq 0)
} catch {
    $results['optimize-amd-settings'] = $false
}

# optimize-discord
try {
    $discEnv = [Environment]::GetEnvironmentVariable("DISCORD_DISABLE_OVERLAY", "User")
    $hasBackup = (Test-Path "$env:APPDATA\\discord\\settings.json.agb_backup") -or (Test-Path "$env:APPDATA\\discordptb\\settings.json.agb_backup") -or (Test-Path "$env:APPDATA\\discordcanary\\settings.json.agb_backup")
    $results['optimize-discord'] = [bool]($discEnv -eq "1" -or $hasBackup)
} catch {
    $results['optimize-discord'] = $false
}

# disable-edge-pre-launching
$edgePl = Get-RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge' 'AllowPrelaunch'
$edgeSbLM = Get-RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge' 'StartupBoostEnabled'
$edgeSbCU = Get-RegVal 'HKCU:\\SOFTWARE\\Policies\\Microsoft\\Edge' 'StartupBoostEnabled'
$results['disable-edge-pre-launching'] = [bool]($edgePl -eq 0 -or $edgeSbLM -eq 0 -or $edgeSbCU -eq 0)

# remove-gaming-apps
try {
    $xboxApp = Get-AppxPackage -Name "Microsoft.GamingApp" -ErrorAction SilentlyContinue
    $noOpenWith = Get-RegVal 'HKCU:\\Software\\Classes\\ms-gamingoverlay' 'NoOpenWith'
    $results['remove-gaming-apps'] = [bool]($xboxApp -eq $null -and $noOpenWith -ne $null)
} catch {
    $results['remove-gaming-apps'] = $false
}

# remove-ms-bing-integration
$bing1 = Get-RegVal 'HKCU:\\Software\\Policies\\Microsoft\\Windows\\Explorer' 'DisableSearchBoxSuggestions'
$bing2 = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Search' 'BingSearchEnabled'
$results['remove-ms-bing-integration'] = ($bing1 -eq 1 -and $bing2 -eq 0)

# remove-onedrive
$results['remove-onedrive'] = (-not (Test-Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\OneDriveSetup.exe') -and -not (Test-Path "$env:localappdata\\Microsoft\\OneDrive\\OneDrive.exe"))

# revert-context-menu
$results['revert-context-menu'] = (Test-Path 'HKCU:\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32')

# set-powershell7-default
$wtSettings = "$env:LOCALAPPDATA\\Packages\\Microsoft.WindowsTerminal_8wekyb3d8bbwe\\LocalState\\settings.json"
if (Test-Path $wtSettings) {
    try {
        $json = Get-Content $wtSettings -Raw | ConvertFrom-Json
        $ps7 = $json.profiles.list | Where-Object { $_.name -eq 'PowerShell' }
        $results['set-powershell7-default'] = [bool]($ps7 -and $json.defaultProfile -eq $ps7.guid)
    } catch {
        $results['set-powershell7-default'] = $false
    }
} else {
    $results['set-powershell7-default'] = $false
}

# set-services-to-manual
$svcMarker = Get-RegVal 'HKLM:\\SOFTWARE\\AGB' 'SetServicesToManual'
$results['set-services-to-manual'] = ($svcMarker -eq 1)

# set-win32-priority-separation
$pri = Get-RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl' 'Win32PrioritySeparation'
$results['set-win32-priority-separation'] = ($pri -eq 38 -or $pri -eq 36)

# show-seconds-in-system-clock
$sec = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'ShowSecondsInSystemClock'
$secActive = ($sec -eq 1)
$results['show-seconds-in-system-clock'] = $secActive
$results['show-seconds-in-taskbar-clock'] = $secActive

# agb-power-plan & ultimate-performance-plan
try {
    $plan = powercfg -getactivescheme
    $isPerf = [bool]($plan -match 'High performance|Alto desempenho|Ultimate Performance|Desempenho M.ximo|8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c|e9a42b02-d5df-448d-aa00-03f14749eb61')
    $isUltimate = [bool]($plan -match 'Ultimate Performance|Desempenho M.ximo|M.ximo rendimiento|e9a42b02-d5df-448d-aa00-03f14749eb61')
    $results['agb-power-plan'] = $isPerf
    $results['ultimate-performance-plan'] = $isUltimate
} catch {
    $results['agb-power-plan'] = $false
    $results['ultimate-performance-plan'] = $false
}

# wpbt
$wpbt = Get-RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager' 'DisableWpbtExecution'
$results['wpbt'] = ($wpbt -eq 1)

# disable-mpo
$mpo = Get-RegVal 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\Dwm' 'OverlayTestMode'
$results['disable-mpo'] = ($mpo -eq 5)

# disable-usb-selective-suspend
$usbSusp = Get-RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\USB' 'DisableSelectiveSuspend'
$results['disable-usb-selective-suspend'] = ($usbSusp -eq 1)

# disable-delivery-optimization
$do1 = Get-RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization' 'DODownloadMode'
$do2 = Get-RegVal 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\DeliveryOptimization\\Config' 'DODownloadMode'
$results['disable-delivery-optimization'] = ($do1 -eq 0 -or $do2 -eq 0)

# disable-fast-startup
$hb = Get-RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power' 'HiberbootEnabled'
$results['disable-fast-startup'] = ($hb -eq 0)

# disable-reserved-storage
$rs1 = Get-RegVal 'HKLM:\\SOFTWARE\\AGB' 'DisableReservedStorage'
$rs2 = Get-RegVal 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\ReserveManager' 'BaseHardReserveSize'
$results['disable-reserved-storage'] = ($rs1 -eq 1 -or $rs2 -eq 0)

# disable-sysmain
$sm = Get-Service -Name 'SysMain' -ErrorAction SilentlyContinue
$results['disable-sysmain'] = [bool]($sm -and $sm.StartType -eq 'Disabled')

# disable-memory-compression
$mc = Get-RegVal 'HKLM:\\SOFTWARE\\AGB' 'DisableMemoryCompression'
$results['disable-memory-compression'] = ($mc -eq 1)

# optimize-ntfs
$ntfs83 = Get-RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\FileSystem' 'NtfsDisable8dot3NameCreation'
$results['optimize-ntfs'] = ($ntfs83 -eq 1)

# optimize-visual-effects
$ta = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'TaskbarAnimations'
$results['optimize-visual-effects'] = ($ta -eq 0)

# keyboard-repeat-rate
$kd = Get-RegVal 'HKCU:\\Control Panel\\Keyboard' 'KeyboardDelay'
$results['keyboard-repeat-rate'] = ($kd -eq '0')

# prefer-ipv4-over-ipv6
$ipv4 = Get-RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip6\\Parameters' 'DisabledComponents'
$results['prefer-ipv4-over-ipv6'] = ($ipv4 -eq 32)

# disable-teredo
$teredo = Get-RegVal 'HKLM:\\SOFTWARE\\AGB' 'DisableTeredo'
$results['disable-teredo'] = ($teredo -eq 1)

# disable-lockscreen-blur
$blur = Get-RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\System' 'DisableAcrylicBackgroundOnLogon'
$results['disable-lockscreen-blur'] = ($blur -eq 1)

# enable-long-paths
$lp = Get-RegVal 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\FileSystem' 'LongPathsEnabled'
$results['enable-long-paths'] = ($lp -eq 1)

# show-hidden-files
$hid = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'Hidden'
$results['show-hidden-files'] = ($hid -eq 1)

# show-file-extensions
$fext = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'HideFileExt'
$results['show-file-extensions'] = ($fext -eq 0)

# revert-start-menu-layout
$sIris = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'Start_IrisRecommendations'
$sRec = Get-RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Explorer' 'HideRecommendedSection'
$results['revert-start-menu-layout'] = ($sIris -eq 0 -or $sRec -eq 1)

# disable-store-search-suggestions
$ssSug = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\SearchSettings' 'IsDynamicSearchBoxEnabled'
$results['disable-store-search-suggestions'] = ($ssSug -eq 0)

# remove-explorer-home-and-gallery
$lt = Get-RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' 'LaunchTo'
$results['remove-explorer-home-and-gallery'] = ($lt -eq 1)

# enable-numlock-on-startup
$nl = Get-RegVal 'HKCU:\\Control Panel\\Keyboard' 'InitialKeyboardIndicators'
$results['enable-numlock-on-startup'] = ($nl -eq '2')

# disable-lockscreen
$nls = Get-RegVal 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization' 'NoLockScreen'
$results['disable-lockscreen'] = ($nls -eq 1)

# enable-legacy-photo-viewer
$lpv = Get-RegVal 'HKLM:\\SOFTWARE\\AGB' 'LegacyPhotoViewer'
$results['enable-legacy-photo-viewer'] = ($lpv -eq 1)

# disable-xbox-services
$xbl = Get-Service -Name 'XblAuthManager' -ErrorAction SilentlyContinue
$results['disable-xbox-services'] = [bool]($xbl -and $xbl.StartType -eq 'Disabled')

ConvertTo-Json $results -Compress
`

export async function detectSystemTweaks(): Promise<Record<string, boolean>> {
  try {
    const result = await executePowerShell(null, {
      script: DETECTION_SCRIPT,
      name: "detect-tweaks",
    })

    if (result && result.success && result.output) {
      const parsed = JSON.parse(result.output.trim())
      return parsed
    }
  } catch (error) {
    log.error("Failed to detect system tweaks:", error)
  }
  return {}
}
