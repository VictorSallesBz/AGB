Write-Host "Disabling Windows Recall..." -ForegroundColor Cyan

# 1. Disable Recall via Group Policy
$path = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI"
if (-not (Test-Path $path)) {
    New-Item -Path $path -Force -ErrorAction SilentlyContinue | Out-Null
}
Set-ItemProperty -Path $path -Name "AllowRecallEnablement" -Type DWord -Value 0 -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path $path -Name "DisableAIDataAnalysis" -Type DWord -Value 1 -Force -ErrorAction SilentlyContinue

# 2. Disable optional feature via DISM silently if present
try {
    DISM /Online /Disable-Feature /FeatureName:Recall /NoRestart /Quiet
} catch {}

Write-Host "Windows Recall has been disabled successfully." -ForegroundColor Green