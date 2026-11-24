# Hide Task View button and Widgets icon on Taskbar
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "ShowTaskViewButton" -Type DWord -Value 0 -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "TaskbarDa" -Type DWord -Value 0 -ErrorAction SilentlyContinue

# Remove Widgets package
Get-AppxPackage *WebExperience* -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue

# Restart Explorer to apply changes
Stop-Process -Name explorer -Force
Start-Process explorer

Write-Host "Widgets and Task View hidden successfully."

