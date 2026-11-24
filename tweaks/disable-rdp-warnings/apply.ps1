$path = "HKLM:\Software\Policies\Microsoft\Windows NT\Terminal Services\Client"
if (-not (Test-Path $path)) {
    New-Item -Path $path -Force -ErrorAction SilentlyContinue | Out-Null
}
Set-ItemProperty -Path $path -Name "RedirectionWarningDialogVersion" -Value 1 -Type DWord -ErrorAction SilentlyContinue

$termClient = "HKCU:\Software\Microsoft\Terminal Server Client"
if (-not (Test-Path $termClient)) {
    New-Item -Path $termClient -Force -ErrorAction SilentlyContinue | Out-Null
}
Set-ItemProperty -Path $termClient -Name "AuthenticationLevelOverride" -Value 0 -Type DWord -ErrorAction SilentlyContinue

Write-Host "RDP security warnings disabled successfully." -ForegroundColor Green
