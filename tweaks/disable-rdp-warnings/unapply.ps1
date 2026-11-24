$path = "HKLM:\Software\Policies\Microsoft\Windows NT\Terminal Services\Client"
if (Test-Path $path) {
    Remove-ItemProperty -Path $path -Name "RedirectionWarningDialogVersion" -ErrorAction SilentlyContinue
}

$termClient = "HKCU:\Software\Microsoft\Terminal Server Client"
if (Test-Path $termClient) {
    Remove-ItemProperty -Path $termClient -Name "AuthenticationLevelOverride" -ErrorAction SilentlyContinue
}

Write-Host "RDP security warnings re-enabled successfully." -ForegroundColor Green
