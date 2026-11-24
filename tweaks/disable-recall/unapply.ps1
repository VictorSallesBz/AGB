Write-Host "Re-enabling Windows Recall..." -ForegroundColor Cyan

# 1. Remove Recall Group Policy
$path = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI"
if (Test-Path $path) {
    Remove-ItemProperty -Path $path -Name "AllowRecallEnablement" -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path $path -Name "DisableAIDataAnalysis" -ErrorAction SilentlyContinue
}

# 2. Re-enable optional feature via DISM silently if supported
try {
    DISM /Online /Enable-Feature /FeatureName:Recall /NoRestart /Quiet
} catch {}

Write-Host "Windows Recall re-enabled." -ForegroundColor Green