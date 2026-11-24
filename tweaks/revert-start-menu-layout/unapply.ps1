$adv = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
Set-ItemProperty -Path $adv -Name "Start_Layout" -Value 0 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path $adv -Name "Start_IrisRecommendations" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path $adv -Name "Start_AccountNotifications" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Explorer" -Name "HideRecommendedSection" -ErrorAction SilentlyContinue
Write-Host "Start Menu layout restored."
