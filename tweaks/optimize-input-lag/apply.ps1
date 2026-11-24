Write-Host "Applying Input Lag optimizations for Mouse & Keyboard..."

# 1. Optimize HID Queue Buffer Size to 64 (Lower latency while remaining safe for 1000Hz-8000Hz mice)
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\mouclass\Parameters" -Name "DataQueueSize" -Value 64 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\kbdclass\Parameters" -Name "DataQueueSize" -Value 64 -Type DWord -ErrorAction SilentlyContinue

# 2. Disable Keyboard Accessibility Hooks (StickyKeys, FilterKeys, ToggleKeys)
$accPath = "HKCU:\Control Panel\Accessibility"

# StickyKeys
if (-not (Test-Path "$accPath\StickyKeys")) { New-Item -Path "$accPath\StickyKeys" -Force | Out-Null }
Set-ItemProperty -Path "$accPath\StickyKeys" -Name "Flags" -Value "506" -ErrorAction SilentlyContinue

# FilterKeys
if (-not (Test-Path "$accPath\Keyboard Response")) { New-Item -Path "$accPath\Keyboard Response" -Force | Out-Null }
Set-ItemProperty -Path "$accPath\Keyboard Response" -Name "Flags" -Value "122" -ErrorAction SilentlyContinue

# ToggleKeys
if (-not (Test-Path "$accPath\ToggleKeys")) { New-Item -Path "$accPath\ToggleKeys" -Force | Out-Null }
Set-ItemProperty -Path "$accPath\ToggleKeys" -Name "Flags" -Value "58" -ErrorAction SilentlyContinue

# 3. Disable Mouse Acceleration (Enhance Pointer Precision)
Set-ItemProperty -Path "HKCU:\Control Panel\Mouse" -Name "MouseSpeed" -Value "0" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\Control Panel\Mouse" -Name "MouseThreshold1" -Value "0" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\Control Panel\Mouse" -Name "MouseThreshold2" -Value "0" -ErrorAction SilentlyContinue

Write-Host "Input Lag optimizations applied successfully."
