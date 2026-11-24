$dwmPath = "HKLM:\SOFTWARE\Microsoft\Windows\Dwm"
if (-not (Test-Path $dwmPath)) {
    New-Item -Path $dwmPath -Force -ErrorAction Stop | Out-Null
}
Set-ItemProperty -Path $dwmPath -Name "OverlayTestMode" -Value 5 -Type DWord -Force -ErrorAction Stop
Write-Host "MPO disabled successfully (OverlayTestMode = 5)."
