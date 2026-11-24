$p = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Personalization"
if (-not (Test-Path $p)) { New-Item -Path $p -Force | Out-Null }
Set-ItemProperty -Path $p -Name "NoLockScreen" -Value 1 -Type DWord
Write-Host "Lock screen disabled."
