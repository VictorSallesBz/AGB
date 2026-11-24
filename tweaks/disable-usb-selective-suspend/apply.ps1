powercfg /setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setdcvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setactive SCHEME_CURRENT
if (-not (Test-Path "HKLM:\SYSTEM\CurrentControlSet\Services\USB")) { New-Item -Path "HKLM:\SYSTEM\CurrentControlSet\Services\USB" -Force | Out-Null }
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\USB" -Name "DisableSelectiveSuspend" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Write-Host "USB Selective Suspend disabled."
