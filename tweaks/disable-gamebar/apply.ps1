try {
    winget uninstall 9nzkpstsnw4p --silent --accept-source-agreements 
    Get-AppxPackage Microsoft.XboxGamingOverlay | Remove-AppxPackage -ErrorAction Stop

    Write-Output 'Successfully removed Xbox Gaming Overlay via AppxPackage'
}
catch {
    Write-Output 'AppxPackage removal failed, trying to remove via winget'
    try {
        winget uninstall 9nzkpstsnw4p --silent --accept-source-agreements 
        Write-Output 'Successfully removed Xbox Gaming Overlay via winget'
    }
    catch {
        Write-Output 'Winget uninstall failed'
    }
}

# Desativar GameDVR e atalhos no registro do Windows
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\GameDVR" -Name "AppCaptureEnabled" -Value 0 -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\System\GameConfigStore" -Name "GameDVR_Enabled" -Value 0 -ErrorAction SilentlyContinue

if (-not (Test-Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\GameDVR")) {
    New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\GameDVR" -Force -ErrorAction SilentlyContinue | Out-Null
}
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\GameDVR" -Name "AllowGameDVR" -Value 0 -ErrorAction SilentlyContinue

# Impedir o popup 'Obter um aplicativo para abrir este ms-gamingoverlay link'
if (-not (Test-Path "HKCU:\Software\Classes\ms-gamingoverlay")) {
    New-Item -Path "HKCU:\Software\Classes\ms-gamingoverlay" -Force -ErrorAction SilentlyContinue | Out-Null
}
New-ItemProperty -Path "HKCU:\Software\Classes\ms-gamingoverlay" -Name "NoOpenWith" -Value "" -PropertyType String -Force -ErrorAction SilentlyContinue