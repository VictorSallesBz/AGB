fsutil behavior set disablelastaccess 1 | Out-Null
fsutil behavior set disable8dot3 1 | Out-Null
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "NtfsDisableLastAccessUpdate" -Value 2147483649 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "NtfsDisable8dot3NameCreation" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Write-Host "NTFS optimizations applied."
