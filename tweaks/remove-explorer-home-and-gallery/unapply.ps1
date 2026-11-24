Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "LaunchTo" -Value 2 -Type DWord
$gal = "HKCU:\Software\Classes\CLSID\{e88865ea-0e1c-4e20-9aa6-edcd0212c87c}"
if (Test-Path $gal) {
    Set-ItemProperty -Path $gal -Name "System.IsPinnedToNameSpaceTree" -Value 1 -Type DWord
}
Write-Host "Explorer Home and Gallery restored."
