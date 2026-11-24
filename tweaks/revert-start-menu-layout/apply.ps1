$adv = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
Set-ItemProperty -Path $adv -Name "Start_Layout" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path $adv -Name "Start_IrisRecommendations" -Value 0 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path $adv -Name "Start_AccountNotifications" -Value 0 -Type DWord -ErrorAction SilentlyContinue
$pol = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Explorer"
if (-not (Test-Path $pol)) { New-Item -Path $pol -Force | Out-Null }
Set-ItemProperty -Path $pol -Name "HideRecommendedSection" -Value 1 -Type DWord
Write-Host "Start Menu layout simplified and recommendations hidden."
