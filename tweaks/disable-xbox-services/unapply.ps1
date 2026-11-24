$services = @("XblAuthManager", "XblGameSave", "XboxGipSvc", "XboxNetApiSvc")
foreach ($svc in $services) {
    Set-Service -Name $svc -StartupType Manual -ErrorAction SilentlyContinue
}
Write-Host "Xbox services restored to Manual."
