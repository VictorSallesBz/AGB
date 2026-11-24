$regPath = "HKCU:\Software\Microsoft\DirectX\UserGpuPreferences"
$keyName = "DirectXUserGlobalSettings"

if (Test-Path $regPath) {
    Remove-ItemProperty -Path $regPath -Name $keyName -ErrorAction SilentlyContinue
    Write-Host "DirectX game optimization removed successfully."
} else {
    Write-Host "Registry path does not exist, nothing to remove."
}
