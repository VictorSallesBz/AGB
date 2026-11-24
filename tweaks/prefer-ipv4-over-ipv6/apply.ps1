Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters" -Name "DisabledComponents" -Value 32 -Type DWord
Write-Host "Preferred IPv4 over IPv6 (DisabledComponents = 0x20)."
