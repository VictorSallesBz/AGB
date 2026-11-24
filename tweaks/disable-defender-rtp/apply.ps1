try {
    Set-MpPreference -DisableRealtimeMonitoring $true -ErrorAction SilentlyContinue
    
    $policyPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows Defender\Real-Time Protection"
    if (-not (Test-Path $policyPath)) {
        New-Item -Path $policyPath -Force | Out-Null
    }
    Set-ItemProperty -Path $policyPath -Name "DisableRealtimeMonitoring" -Type DWord -Value 1 -Force -ErrorAction SilentlyContinue
    
    Write-Host "Defender Real-Time Protection disabled successfully." -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not disable Defender RTP. Ensure Tamper Protection is disabled in Windows Security." -ForegroundColor Yellow
}