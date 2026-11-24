Write-Host "Reverting Input Lag optimizations to defaults..."

# Restore default HID queue sizes (100)
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\mouclass\Parameters" -Name "DataQueueSize" -Value 100 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\kbdclass\Parameters" -Name "DataQueueSize" -Value 100 -Type DWord -ErrorAction SilentlyContinue

# Restore default Accessibility flags
Set-ItemProperty -Path "HKCU:\Control Panel\Accessibility\StickyKeys" -Name "Flags" -Value "510" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\Control Panel\Accessibility\Keyboard Response" -Name "Flags" -Value "126" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\Control Panel\Accessibility\ToggleKeys" -Name "Flags" -Value "62" -ErrorAction SilentlyContinue

Write-Host "Input Lag optimizations reverted."
