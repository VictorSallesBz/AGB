Write-Host "Applying AMD Radeon GPU Optimizations..." -ForegroundColor Cyan

# 1. Disable ULPS (Ultra Low Power State) across all AMD display adapter registry instances
$displayAdapters = Get-ChildItem "HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}" -ErrorAction SilentlyContinue

foreach ($adapter in $displayAdapters) {
    if ($adapter.PSChildName -match '^\d{4}$') {
        $adapterPath = $adapter.PSPath
        
        # Check if it's an AMD/ATI display adapter or contains ULPS keys
        $props = Get-ItemProperty -Path $adapterPath -ErrorAction SilentlyContinue
        if ($props.DriverDesc -match "AMD|Radeon|ATI" -or $props.EnableUlps -ne $null) {
            Write-Host "Disabling ULPS and configuring Shader Cache on $($props.DriverDesc)..." -ForegroundColor Yellow
            Set-ItemProperty -Path $adapterPath -Name "EnableUlps" -Value 0 -Type DWord -Force
            Set-ItemProperty -Path $adapterPath -Name "EnableUlps_NA" -Value 0 -Type DWord -Force
            
            # 2. Optimize AMD Shader Cache
            Set-ItemProperty -Path $adapterPath -Name "KMD_EnableShaderCache" -Value 1 -Type DWord -Force
            
            # 3. Optimize Flip Queue Size (Pre-rendered frames / lower latency)
            Set-ItemProperty -Path $adapterPath -Name "FlipQueueSize" -Value 1 -Type DWord -Force
        }
    }
}

# 4. Increase Graphics TDR Delay to prevent false timeout driver crashes
$graphicsDriversPath = "HKLM:\SYSTEM\CurrentControlSet\Control\GraphicsDrivers"
if (-not (Test-Path $graphicsDriversPath)) {
    New-Item -Path $graphicsDriversPath -Force | Out-Null
}
Set-ItemProperty -Path $graphicsDriversPath -Name "TdrDelay" -Value 8 -Type DWord -Force
Set-ItemProperty -Path $graphicsDriversPath -Name "TdrDdiDelay" -Value 8 -Type DWord -Force

Write-Host "AMD Radeon GPU Optimizations applied successfully!" -ForegroundColor Green
