Write-Host "Reverting network tweaks to defaults..."

# 1. TCP Global & Netsh Defaults
netsh int tcp set heuristics enabled
netsh int tcp set supplemental template=internet congestionprovider=default
netsh int tcp set global rss=default
netsh int tcp set global ecncapability=default
netsh int tcp set global timestamps=default
netsh int tcp set global fastopen=default
netsh int tcp set global fastopenfallback=default
netsh int tcp set supplemental template=custom icw=4

# 2. Reverter Nagle Algorithm
$interfacesPath = "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces"
if (Test-Path $interfacesPath) {
    Get-ChildItem -Path $interfacesPath | ForEach-Object {
        Remove-ItemProperty -Path $_.PSPath -Name "TcpAckFrequency" -ErrorAction SilentlyContinue
        Remove-ItemProperty -Path $_.PSPath -Name "TCPNoDelay" -ErrorAction SilentlyContinue
        Remove-ItemProperty -Path $_.PSPath -Name "TcpDelAckTicks" -ErrorAction SilentlyContinue
    }
}

# 3. Reverter QoS Bandwidth Limit
$pschedPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Psched"
if (Test-Path $pschedPath) {
    Remove-ItemProperty -Path $pschedPath -Name "NonBestEffortLimit" -ErrorAction SilentlyContinue
}

# 4. Reverter DNS Cache TTL
$dnsCachePath = "HKLM:\SYSTEM\CurrentControlSet\Services\Dnscache\Parameters"
if (Test-Path $dnsCachePath) {
    Remove-ItemProperty -Path $dnsCachePath -Name "MaxCacheTtl" -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path $dnsCachePath -Name "MaxNegativeCacheTtl" -ErrorAction SilentlyContinue
}

# 5. Reverter Network Throttling para padrão do Windows
$sysProfilePath = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile"
if (Test-Path $sysProfilePath) {
    Set-ItemProperty -Path $sysProfilePath -Name "NetworkThrottlingIndex" -Value 10 -Type DWord -ErrorAction SilentlyContinue
    Set-ItemProperty -Path $sysProfilePath -Name "SystemResponsiveness" -Value 20 -Type DWord -ErrorAction SilentlyContinue
}

# 6. Reverter Economia de Energia da Placa de Rede para padrões
try {
    Get-NetAdapter -Physical -ErrorAction SilentlyContinue | ForEach-Object {
        Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName "*Energy Efficient Ethernet*" -DisplayValue "Enabled" -ErrorAction SilentlyContinue
        Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName "*Green Ethernet*" -DisplayValue "Enabled" -ErrorAction SilentlyContinue
        Set-NetAdapterPowerManagement -Name $_.Name -AllowComputerToTurnOffDevice Enabled -ErrorAction SilentlyContinue
    }
} catch {}

Write-Host "Network tweaks reverted to defaults."

