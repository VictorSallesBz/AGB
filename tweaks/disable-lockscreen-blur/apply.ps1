$p = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\System"
if (-not (Test-Path $p)) { New-Item -Path $p -Force | Out-Null }
Set-ItemProperty -Path $p -Name "DisableAcrylicBackgroundOnLogon" -Value 1 -Type DWord
Write-Host "Lock screen blur disabled."
