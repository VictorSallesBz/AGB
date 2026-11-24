Enable-MMAgent -MemoryCompression -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKLM:\SOFTWARE\AGB" -Name "DisableMemoryCompression" -ErrorAction SilentlyContinue
Write-Host "Memory Compression enabled."
