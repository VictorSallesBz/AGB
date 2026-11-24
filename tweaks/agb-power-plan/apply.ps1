Write-Host "Configuring AGB Ultimate Gaming Power Plan..."

# Enable High Performance / Ultimate Power Plan (language-independent GUID detection)
$guidRegex = '([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})'
$matchedLine = powercfg /list | Select-String -Pattern "High performance|Alto desempenho|Desempenho m.ximo|Ultimate Performance|e9a42b02-d5df-448d-aa00-03f14749eb61|8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c" | Select-Object -First 1
$guid = $null
if ($matchedLine -and $matchedLine.Line -match $guidRegex) {
    $guid = $matches[1]
}
if (-not $guid) {
    $dupOut = powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 2>&1 | Out-String
    if ($dupOut -match $guidRegex) {
        $guid = $matches[1]
    }
}
if (-not $guid) {
    $guid = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c" # High Performance fallback
}

powercfg /setactive $guid

# Disable CPU Core Parking (Min cores 100%, Max cores 100%)
powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR 0cc5b647-c1df-4596-9299-d7a6a057d115 100
powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR 893de357-2a68-4d19-b2c0-0450e7a5abe7 100

# Allow dynamic idle scaling (5%) with full 100% max boost so Precision/Turbo Boost hits maximum single-core clocks
powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN 5
powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMAX 100

# Disable PCI Express Link State Power Management (0 = Off)
powercfg /setacvalueindex SCHEME_CURRENT SUB_PCIEXPRESS ee12f906-9904-4f08-9b03-ba8115ca4127 0

# Set Monitor and Sleep timeout to Never (0 = Nunca desligar tela / suspender)
powercfg /change monitor-timeout-ac 0
powercfg /change monitor-timeout-dc 0
powercfg /change standby-timeout-ac 0
powercfg /change standby-timeout-dc 0

# Apply changes
powercfg /setactive SCHEME_CURRENT

Write-Host "AGB Ultimate Gaming Power Plan active with Core Parking disabled and screen/sleep set to Never."
