Write-Host "Reverting AMD Radeon GPU Optimizations..." -ForegroundColor Cyan

$displayAdapters = Get-ChildItem "HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}" -ErrorAction SilentlyContinue

foreach ($adapter in $displayAdapters) {
    if ($adapter.PSChildName -match '^\d{4}$') {
        $adapterPath = $adapter.PSPath
        $props = Get-ItemProperty -Path $adapterPath -ErrorAction SilentlyContinue
        if ($props.DriverDesc -match "AMD|Radeon|ATI" -or $props.EnableUlps -ne $null) {
            Write-Host "Restoring default settings on $($props.DriverDesc)..." -ForegroundColor Yellow
            Set-ItemProperty -Path $adapterPath -Name "EnableUlps" -Value 1 -Type DWord -Force
            Set-ItemProperty -Path $adapterPath -Name "EnableUlps_NA" -Value 1 -Type DWord -Force
            Remove-ItemProperty -Path $adapterPath -Name "KMD_EnableShaderCache" -ErrorAction SilentlyContinue
            Remove-ItemProperty -Path $adapterPath -Name "FlipQueueSize" -ErrorAction SilentlyContinue
        }
    }
}

# Restore default TDR Delay (default in Windows is 2 seconds)
$graphicsDriversPath = "HKLM:\SYSTEM\CurrentControlSet\Control\GraphicsDrivers"
if (Test-Path $graphicsDriversPath) {
    Set-ItemProperty -Path $graphicsDriversPath -Name "TdrDelay" -Value 2 -Type DWord -Force
    Set-ItemProperty -Path $graphicsDriversPath -Name "TdrDdiDelay" -Value 2 -Type DWord -Force
}

Write-Host "AMD Radeon GPU Optimizations reverted to defaults." -ForegroundColor Green
