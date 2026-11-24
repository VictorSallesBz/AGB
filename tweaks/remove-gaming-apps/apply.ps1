$appsList = 'Microsoft.GamingApp', 'Microsoft.XboxGameOverlay', 'Microsoft.XboxGamingOverlay'

foreach ($app in $appsList) {
    Get-AppxPackage -Name $app -AllUsers | Remove-AppxPackage
    Get-AppxProvisionedPackage -Online | Where-Object DisplayName -EQ $app | Remove-AppxProvisionedPackage -Online
}

# Desativar GameDVR e impedir o popup 'ms-gamingoverlay'
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\GameDVR" -Name "AppCaptureEnabled" -Value 0 -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\System\GameConfigStore" -Name "GameDVR_Enabled" -Value 0 -ErrorAction SilentlyContinue

if (-not (Test-Path "HKCU:\Software\Classes\ms-gamingoverlay")) {
    New-Item -Path "HKCU:\Software\Classes\ms-gamingoverlay" -Force -ErrorAction SilentlyContinue | Out-Null
}
New-ItemProperty -Path "HKCU:\Software\Classes\ms-gamingoverlay" -Name "NoOpenWith" -Value "" -PropertyType String -Force -ErrorAction SilentlyContinue


