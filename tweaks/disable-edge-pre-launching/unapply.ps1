Write-Host "Re-enabling Microsoft Edge background pre-launching..."

$edgePath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge"
if (Test-Path $edgePath) {
    Remove-ItemProperty -Path $edgePath -Name "AllowPrelaunch" -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path $edgePath -Name "StartupBoostEnabled" -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path $edgePath -Name "BackgroundModeEnabled" -ErrorAction SilentlyContinue
}

$edgeUserPolicy = "HKCU:\SOFTWARE\Policies\Microsoft\Edge"
if (Test-Path $edgeUserPolicy) {
    Remove-ItemProperty -Path $edgeUserPolicy -Name "StartupBoostEnabled" -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path $edgeUserPolicy -Name "BackgroundModeEnabled" -ErrorAction SilentlyContinue
}

$edgeMainPath = "HKLM:\SOFTWARE\Policies\Microsoft\MicrosoftEdge\Main"
if (Test-Path $edgeMainPath) { Remove-ItemProperty -Path $edgeMainPath -Name "AllowPrelaunch" -ErrorAction SilentlyContinue }

$edgeTabPath = "HKLM:\SOFTWARE\Policies\Microsoft\MicrosoftEdge\TabPreloading"
if (Test-Path $edgeTabPath) { Remove-ItemProperty -Path $edgeTabPath -Name "AllowTabPreloading" -ErrorAction SilentlyContinue }

Write-Host "Microsoft Edge background pre-launching restored."