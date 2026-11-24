$assocPath = "HKLM:\SOFTWARE\Microsoft\Windows Photo Viewer\Capabilities\FileAssociations"
$exts = @(".bmp", ".dib", ".gif", ".jfif", ".jpe", ".jpeg", ".jpg", ".jxr", ".png", ".tif", ".tiff", ".wdp")
foreach ($ext in $exts) {
    Remove-ItemProperty -Path $assocPath -Name $ext -ErrorAction SilentlyContinue
}
Remove-ItemProperty -Path "HKLM:\SOFTWARE\AGB" -Name "LegacyPhotoViewer" -ErrorAction SilentlyContinue
Write-Host "Classic Windows Photo Viewer associations reverted."
