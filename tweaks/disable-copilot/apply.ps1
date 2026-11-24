Write-Host "Disabling Microsoft Copilot..." -ForegroundColor Cyan

# 1. Disable Copilot via Group Policies (User and Machine)
$paths = @(
    "HKCU:\Software\Policies\Microsoft\Windows\WindowsCopilot",
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsCopilot"
)

foreach ($path in $paths) {
    if (-not (Test-Path $path)) {
        New-Item -Path $path -Force -ErrorAction SilentlyContinue | Out-Null
    }
    Set-ItemProperty -Path $path -Name "TurnOffWindowsCopilot" -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
}

# 2. Remove Copilot package for all users
Get-AppxPackage -AllUsers -Name "*Microsoft.Copilot*" -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue

Write-Host "Microsoft Copilot disabled successfully." -ForegroundColor Green