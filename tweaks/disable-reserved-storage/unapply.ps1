DISM.exe /Online /Set-ReservedStorageState /State:Enabled /Quiet /NoRestart
Remove-ItemProperty -Path "HKLM:\SOFTWARE\AGB" -Name "DisableReservedStorage" -ErrorAction SilentlyContinue
Write-Host "Reserved Storage enabled."
