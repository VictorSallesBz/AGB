netsh interface teredo set state default | Out-Null
Remove-ItemProperty -Path "HKLM:\SOFTWARE\AGB" -Name "DisableTeredo" -ErrorAction SilentlyContinue
Write-Host "Teredo tunneling restored."
