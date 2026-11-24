Write-Host "Re-enabling Microsoft Copilot..." -ForegroundColor Cyan

$paths = @(
    "HKCU:\Software\Policies\Microsoft\Windows\WindowsCopilot",
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsCopilot"
)

foreach ($path in $paths) {
    if (Test-Path $path) {
        Remove-ItemProperty -Path $path -Name "TurnOffWindowsCopilot" -ErrorAction SilentlyContinue
    }
}

try {
    winget install 9NHT9RB2F4HD --source msstore --accept-source-agreements --accept-package-agreements --silent
} catch {}

Write-Host "Microsoft Copilot re-enabled." -ForegroundColor Green