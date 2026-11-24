Write-Host "Applying Discord Performance Optimizations..." -ForegroundColor Cyan

# 0. Close running Discord processes to safely edit configuration without file locks or in-memory overwrites
$procNames = @("Discord", "DiscordPTB", "DiscordCanary")
$runningDiscord = Get-Process -Name $procNames -ErrorAction SilentlyContinue
if ($runningDiscord) {
    Write-Host "Closing running Discord processes to safely apply settings..." -ForegroundColor Yellow
    $runningDiscord | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 800
}

$discordPaths = @(
    "$env:APPDATA\discord",
    "$env:APPDATA\discordptb",
    "$env:APPDATA\discordcanary"
)

$foundAny = $false

foreach ($discPath in $discordPaths) {
    if (Test-Path $discPath) {
        $foundAny = $true
        Write-Host "Found Discord installation at: $discPath" -ForegroundColor Yellow
        $settingsFile = Join-Path $discPath "settings.json"
        
        # Backup original settings if not backed up yet
        $backupFile = Join-Path $discPath "settings.json.agb_backup"
        if ((Test-Path $settingsFile) -and -not (Test-Path $backupFile)) {
            Copy-Item -Path $settingsFile -Destination $backupFile -Force -ErrorAction SilentlyContinue
        }

        # Load or create settings.json (PS 5.1 compatible — no -AsHashtable)
        $settings = @{}
        if (Test-Path $settingsFile) {
            try {
                $content = Get-Content $settingsFile -Raw -ErrorAction SilentlyContinue
                if ($content) {
                    $pso = $content | ConvertFrom-Json
                    $pso.PSObject.Properties | ForEach-Object { $settings[$_.Name] = $_.Value }
                }
            } catch {
                $settings = @{}
            }
        }

        # 1. Disable Hardware Acceleration (frees 100% GPU and VRAM for the game, avoids GPU contention/stutters)
        $settings["ENABLE_HWACCEL"] = $false
        # 2. Minimize to tray when closed to reduce memory and viewport rendering
        $settings["MINIMIZE_TO_TRAY"] = $true
        # 3. Disable opening on Windows startup
        $settings["OPEN_ON_STARTUP"] = $false
        # 4. Set dark background color default
        $settings["BACKGROUND_COLOR"] = "#202225"
        # 5. Disable DevTools overhead
        $settings["DANGEROUS_ENABLE_DEVTOOLS_ONLY_ENABLE_IF_YOU_KNOW_WHAT_YOURE_DOING"] = $false

        # Save settings.json
        try {
            $jsonOutput = $settings | ConvertTo-Json -Depth 10 -Compress
            Set-Content -Path $settingsFile -Value $jsonOutput -Force -Encoding UTF8
            Write-Host "Updated settings.json successfully." -ForegroundColor Green
        } catch {
            Write-Host "Could not write settings.json: $_" -ForegroundColor Red
        }

        # 6. Clean heavy cache, telemetry dumps, crashpads and log directories
        $cleanupDirs = @(
            "Cache",
            "Code Cache",
            "GPUCache",
            "DawnGraphiteCache",
            "DawnWebGPUCache",
            "Crashpad",
            "logs",
            "sentry",
            "telemetry"
        )
        foreach ($cDir in $cleanupDirs) {
            $targetDir = Join-Path $discPath $cDir
            if (Test-Path $targetDir) {
                Remove-Item -Path "$targetDir\*" -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# 7. Disable Discord in-game overlay globally via User environment variable
[Environment]::SetEnvironmentVariable("DISCORD_DISABLE_OVERLAY", "1", "User")

if (-not $foundAny) {
    Write-Host "Discord app data directory not found yet. Overlay hook disabled globally via environment." -ForegroundColor Yellow
}

Write-Host "Discord Performance Optimizations applied successfully!" -ForegroundColor Green
