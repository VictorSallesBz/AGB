$guidRegex = '([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})'
$existing = powercfg /list | Select-String -Pattern "Ultimate Performance|Desempenho m.ximo|M.ximo rendimiento|e9a42b02-d5df-448d-aa00-03f14749eb61" | Select-Object -First 1
$ultimatePlanGUID = $null

if ($existing -and $existing.Line -match $guidRegex) {
    $ultimatePlanGUID = $matches[1]
    Write-Host "Ultimate Performance plan already exists ($ultimatePlanGUID)."
} else {
    Write-Host "Ultimate Performance plan not found. Creating..."
    $dupOut = powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 2>&1 | Out-String
    if ($dupOut -match $guidRegex) {
        $ultimatePlanGUID = $matches[1]
    }
}

if (-not $ultimatePlanGUID) {
    $ultimatePlanGUID = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"
}

powercfg -setactive $ultimatePlanGUID

# Set Monitor and Sleep timeout to Never (0 = Nunca desligar tela / suspender)
powercfg /change monitor-timeout-ac 0
powercfg /change monitor-timeout-dc 0
powercfg /change standby-timeout-ac 0
powercfg /change standby-timeout-dc 0

Write-Host "Ultimate Performance power plan is now active with screen/sleep set to Never."
