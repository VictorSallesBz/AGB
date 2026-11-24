Set-Service -Name "SysMain" -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name "SysMain" -ErrorAction SilentlyContinue
Write-Host "SysMain enabled."
