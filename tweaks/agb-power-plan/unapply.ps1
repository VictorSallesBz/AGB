Write-Host "Reverting power plan settings to Windows Balanced..."

# Set Balanced Power Plan
$balancedGuid = "381b4222-f694-41f0-9685-ff5bb260df2e"
powercfg /setactive $balancedGuid

# Restore standard timeout defaults (15 min monitor, 30 min sleep)
powercfg /change monitor-timeout-ac 15
powercfg /change standby-timeout-ac 30

Write-Host "Power plan reverted to Balanced."
