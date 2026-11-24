netsh interface teredo set state disabled | Out-Null
if (-not (Test-Path "HKLM:\SOFTWARE\AGB")) { New-Item -Path "HKLM:\SOFTWARE\AGB" -Force | Out-Null }
Set-ItemProperty -Path "HKLM:\SOFTWARE\AGB" -Name "DisableTeredo" -Value 1 -Type DWord
Write-Host "Teredo tunneling disabled."
