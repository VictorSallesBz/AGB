Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\GameDVR" -Name "AppCaptureEnabled" -Value 1 -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\System\GameConfigStore" -Name "GameDVR_Enabled" -Value 1 -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\GameDVR" -Name "AllowGameDVR" -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKCU:\Software\Classes\ms-gamingoverlay" -Name "NoOpenWith" -ErrorAction SilentlyContinue
winget install 9NZKPSTSNW4P --source msstore --accept-source-agreements --accept-package-agreements --silent