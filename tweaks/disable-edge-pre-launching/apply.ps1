Write-Host "Disabling Microsoft Edge background pre-launching and startup tasks..."

# Disable Edge pre-launching & tab pre-loading
$edgePath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge"
if (-not (Test-Path $edgePath)) { New-Item -Path $edgePath -Force | Out-Null }
Set-ItemProperty -Path $edgePath -Name "AllowPrelaunch" -Value 0 -Type DWord -ErrorAction SilentlyContinue

$edgeMainPath = "HKLM:\SOFTWARE\Policies\Microsoft\MicrosoftEdge\Main"
if (-not (Test-Path $edgeMainPath)) { New-Item -Path $edgeMainPath -Force | Out-Null }
Set-ItemProperty -Path $edgeMainPath -Name "AllowPrelaunch" -Value 0 -Type DWord -ErrorAction SilentlyContinue

$edgeTabPath = "HKLM:\SOFTWARE\Policies\Microsoft\MicrosoftEdge\TabPreloading"
if (-not (Test-Path $edgeTabPath)) { New-Item -Path $edgeTabPath -Force | Out-Null }
Set-ItemProperty -Path $edgeTabPath -Name "AllowTabPreloading" -Value 0 -Type DWord -ErrorAction SilentlyContinue

# Disable Edge Startup Boost & Background Mode via Edge Policies
Set-ItemProperty -Path $edgePath -Name "StartupBoostEnabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path $edgePath -Name "BackgroundModeEnabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue

$edgeUserPolicy = "HKCU:\SOFTWARE\Policies\Microsoft\Edge"
if (-not (Test-Path $edgeUserPolicy)) { New-Item -Path $edgeUserPolicy -Force | Out-Null }
Set-ItemProperty -Path $edgeUserPolicy -Name "StartupBoostEnabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path $edgeUserPolicy -Name "BackgroundModeEnabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue

Write-Host "Microsoft Edge background pre-launching disabled safely."