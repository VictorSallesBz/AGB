fsutil behavior set disablelastaccess 0 | Out-Null
fsutil behavior set disable8dot3 2 | Out-Null
Write-Host "NTFS settings restored."
