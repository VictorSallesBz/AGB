Write-Host "Reverting Discord Performance Optimizations..." -ForegroundColor Cyan

# Close running Discord processes so backup can be restored cleanly
$procNames = @("Discord", "DiscordPTB", "DiscordCanary")
$runningDiscord = Get-Process -Name $procNames -ErrorAction SilentlyContinue
if ($runningDiscord) {
    Write-Host "Closing running Discord processes to safely restore settings..." -ForegroundColor Yellow
    $runningDiscord | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 800
}

$discordPaths = @(
    "$env:APPDATA\discord",
    "$env:APPDATA\discordptb",
    "$env:APPDATA\discordcanary"
)

foreach ($discPath in $discordPaths) {
    if (Test-Path $discPath) {
        $backupFile = Join-Path $discPath "settings.json.agb_backup"
        $settingsFile = Join-Path $discPath "settings.json"
        
        if (Test-Path $backupFile) {
            Copy-Item -Path $backupFile -Destination $settingsFile -Force -ErrorAction SilentlyContinue
            Remove-Item -Path $backupFile -Force -ErrorAction SilentlyContinue
            Write-Host "Restored original settings.json for $discPath." -ForegroundColor Green
        }
    }
}

# Remove overlay disable environment variable
[Environment]::SetEnvironmentVariable("DISCORD_DISABLE_OVERLAY", $null, "User")

Write-Host "Discord settings reverted successfully." -ForegroundColor Green
