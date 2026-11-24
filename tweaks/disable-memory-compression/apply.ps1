Disable-MMAgent -MemoryCompression -ErrorAction SilentlyContinue
if (-not (Test-Path "HKLM:\SOFTWARE\AGB")) { New-Item -Path "HKLM:\SOFTWARE\AGB" -Force | Out-Null }
Set-ItemProperty -Path "HKLM:\SOFTWARE\AGB" -Name "DisableMemoryCompression" -Value 1 -Type DWord
Write-Host "Memory Compression disabled."
