try {
    Set-MpPreference -DisableRealtimeMonitoring $false -ErrorAction SilentlyContinue
    
    $policyPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows Defender\Real-Time Protection"
    if (Test-Path $policyPath) {
        Set-ItemProperty -Path $policyPath -Name "DisableRealtimeMonitoring" -Type DWord -Value 0 -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "Defender Real-Time Protection re-enabled successfully." -ForegroundColor Green
} catch {
    Write-Host "Failed to re-enable Defender RTP: $_" -ForegroundColor Red
}