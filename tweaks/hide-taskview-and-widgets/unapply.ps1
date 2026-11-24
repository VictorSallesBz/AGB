Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "ShowTaskViewButton" -Type DWord -Value 1 -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "TaskbarDa" -Type DWord -Value 1 -ErrorAction SilentlyContinue

Write-Host "Reinstalling Windows Widgets..."
try {
    winget install 9MSSGKG348SP --accept-source-agreements --accept-package-agreements --silent
} catch {}

Stop-Process -Name explorer -Force
Start-Process explorer

Write-Host "Task View and Widgets restored."


