Set-ItemProperty -Path "Registry::HKEY_USERS\.DEFAULT\Control Panel\Keyboard" -Name "InitialKeyboardIndicators" -Value "2" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\Control Panel\Keyboard" -Name "InitialKeyboardIndicators" -Value "2" -ErrorAction SilentlyContinue
Write-Host "Num Lock enabled on startup."
