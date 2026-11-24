$ve = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects"
if (-not (Test-Path $ve)) { New-Item -Path $ve -Force | Out-Null }
Set-ItemProperty -Path $ve -Name "VisualFXSetting" -Value 3 -Type DWord
Set-ItemProperty -Path "HKCU:\Control Panel\Desktop\WindowMetrics" -Name "MinAnimate" -Value "0" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name "FontSmoothing" -Value "2" -ErrorAction SilentlyContinue
$adv = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
Set-ItemProperty -Path $adv -Name "TaskbarAnimations" -Value 0 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path $adv -Name "ListviewAlphaSelect" -Value 0 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path $adv -Name "ListviewShadow" -Value 0 -Type DWord -ErrorAction SilentlyContinue
Write-Host "Visual effects optimized for performance."
