$pol = "HKCU:\Software\Policies\Microsoft\Windows\Explorer"
if (-not (Test-Path $pol)) { New-Item -Path $pol -Force | Out-Null }
Set-ItemProperty -Path $pol -Name "DisableSearchBoxSuggestions" -Value 1 -Type DWord
$ss = "HKCU:\Software\Microsoft\Windows\CurrentVersion\SearchSettings"
if (-not (Test-Path $ss)) { New-Item -Path $ss -Force | Out-Null }
Set-ItemProperty -Path $ss -Name "IsDynamicSearchBoxEnabled" -Value 0 -Type DWord
Write-Host "Store search suggestions disabled."
