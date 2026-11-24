$p1 = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DeliveryOptimization"
$p2 = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\DeliveryOptimization\Config"
if (-not (Test-Path $p1)) { New-Item -Path $p1 -Force | Out-Null }
if (-not (Test-Path $p2)) { New-Item -Path $p2 -Force | Out-Null }
Set-ItemProperty -Path $p1 -Name "DODownloadMode" -Value 0 -Type DWord
Set-ItemProperty -Path $p2 -Name "DODownloadMode" -Value 0 -Type DWord
Write-Host "Delivery Optimization P2P disabled."
