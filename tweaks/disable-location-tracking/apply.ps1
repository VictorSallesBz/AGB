$path = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection"
if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
Set-ItemProperty -Path $path -Name "AllowTelemetry" -Value 0 -Type DWord -Force

Stop-Service -Name "DiagTrack" -Force -ErrorAction SilentlyContinue
Set-Service -Name "DiagTrack" -StartupType Disabled -ErrorAction SilentlyContinue

$path = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location"
if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
Set-ItemProperty -Path $path -Name "Value" -Value "Deny" -Type String -Force

$path = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Sensor\Overrides\{BFA794E4-F964-4FDB-90F6-51056BFE4B44}"
if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
Set-ItemProperty -Path $path -Name "SensorPermissionState" -Value 0 -Type DWord -Force

$locPolicy = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\LocationAndSensors"
if (-not (Test-Path $locPolicy)) { New-Item -Path $locPolicy -Force -ErrorAction SilentlyContinue | Out-Null }
Set-ItemProperty -Path $locPolicy -Name "DisableLocation" -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue

Stop-Service -Name "lfsvc" -Force -ErrorAction SilentlyContinue
Set-Service -Name "lfsvc" -StartupType Disabled -ErrorAction SilentlyContinue

Write-Host "Location tracking disabled successfully." -ForegroundColor Green