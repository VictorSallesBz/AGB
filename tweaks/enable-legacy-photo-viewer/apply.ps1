$assocPath = "HKLM:\SOFTWARE\Microsoft\Windows Photo Viewer\Capabilities\FileAssociations"
if (-not (Test-Path $assocPath)) { New-Item -Path $assocPath -Force | Out-Null }
$exts = @(".bmp", ".dib", ".gif", ".jfif", ".jpe", ".jpeg", ".jpg", ".jxr", ".png", ".tif", ".tiff", ".wdp")
foreach ($ext in $exts) {
    Set-ItemProperty -Path $assocPath -Name $ext -Value "PhotoViewer.FileAssoc.Tiff" -Type String -ErrorAction SilentlyContinue
}
$agbKey = "HKLM:\SOFTWARE\AGB"
if (-not (Test-Path $agbKey)) { New-Item -Path $agbKey -Force | Out-Null }
Set-ItemProperty -Path $agbKey -Name "LegacyPhotoViewer" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Write-Host "Classic Windows Photo Viewer restored."
