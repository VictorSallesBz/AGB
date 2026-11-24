Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "LaunchTo" -Value 1 -Type DWord
$gal = "HKCU:\Software\Classes\CLSID\{e88865ea-0e1c-4e20-9aa6-edcd0212c87c}"
if (-not (Test-Path $gal)) { New-Item -Path $gal -Force | Out-Null }
Set-ItemProperty -Path $gal -Name "System.IsPinnedToNameSpaceTree" -Value 0 -Type DWord
Write-Host "Explorer set to open This PC and Gallery hidden."
