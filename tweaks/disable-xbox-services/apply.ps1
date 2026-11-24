$services = @("XblAuthManager", "XblGameSave", "XboxGipSvc", "XboxNetApiSvc")
foreach ($svc in $services) {
    Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
    Set-Service -Name $svc -StartupType Disabled -ErrorAction SilentlyContinue
}
Write-Host "Xbox background services disabled."
