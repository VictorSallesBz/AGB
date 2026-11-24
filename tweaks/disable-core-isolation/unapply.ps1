$hvciPath = "HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity"
if (-not (Test-Path $hvciPath)) {
    New-Item -Path $hvciPath -Force -ErrorAction Stop | Out-Null
}

Set-ItemProperty -Path $hvciPath `
    -Name "Enabled" -Value 1 -Type DWord -Force -ErrorAction Stop
