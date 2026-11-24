DISM.exe /Online /Set-ReservedStorageState /State:Disabled /Quiet /NoRestart
if (-not (Test-Path "HKLM:\SOFTWARE\AGB")) { New-Item -Path "HKLM:\SOFTWARE\AGB" -Force | Out-Null }
Set-ItemProperty -Path "HKLM:\SOFTWARE\AGB" -Name "DisableReservedStorage" -Value 1 -Type DWord
Write-Host "Reserved Storage disabled."
