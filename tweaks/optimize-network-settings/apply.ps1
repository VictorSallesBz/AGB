Write-Host "Applying balanced gaming & low-latency network tweaks..."

# 1. TCP Global & Netsh Optimizations (compatible with consumer routers/ISPs & UDP games like CS2)
netsh int tcp set heuristics disabled
netsh int tcp set global rss=enabled
netsh int tcp set global ecncapability=default
netsh int tcp set global timestamps=disabled
netsh int tcp set global fastopen=enabled
netsh int tcp set global fastopenfallback=enabled

# 2. Desativação do Algoritmo de Nagle para conexões TCP (TcpAckFrequency & TCPNoDelay)
$interfacesPath = "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces"
if (Test-Path $interfacesPath) {
    Get-ChildItem -Path $interfacesPath | ForEach-Object {
        Set-ItemProperty -Path $_.PSPath -Name "TcpAckFrequency" -Value 1 -Type DWord -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name "TCPNoDelay" -Value 1 -Type DWord -ErrorAction SilentlyContinue
    }
}

# 3. Desativação do Limite de Largura de Banda Reservada (QoS 0%)
$pschedPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Psched"
if (-not (Test-Path $pschedPath)) {
    New-Item -Path $pschedPath -Force -ErrorAction SilentlyContinue | Out-Null
}
Set-ItemProperty -Path $pschedPath -Name "NonBestEffortLimit" -Value 0 -Type DWord -ErrorAction SilentlyContinue

# 4. Otimização do Cache DNS do Windows (TTL Cache)
$dnsCachePath = "HKLM:\SYSTEM\CurrentControlSet\Services\Dnscache\Parameters"
if (-not (Test-Path $dnsCachePath)) {
    New-Item -Path $dnsCachePath -Force -ErrorAction SilentlyContinue | Out-Null
}
Set-ItemProperty -Path $dnsCachePath -Name "MaxCacheTtl" -Value 86400 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path $dnsCachePath -Name "MaxNegativeCacheTtl" -Value 5 -Type DWord -ErrorAction SilentlyContinue

# 5. Economia de Energia da Placa de Rede desativada (sem desativar Interrupt Moderation para evitar picos de DPC/CPU no CS2)
try {
    Get-NetAdapter -Physical -ErrorAction SilentlyContinue | ForEach-Object {
        Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName "*Energy Efficient Ethernet*" -DisplayValue "Disabled" -ErrorAction SilentlyContinue
        Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName "*Green Ethernet*" -DisplayValue "Disabled" -ErrorAction SilentlyContinue
        Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName "*Receive Side Scaling*" -DisplayValue "Enabled" -ErrorAction SilentlyContinue
        Set-NetAdapterPowerManagement -Name $_.Name -DeviceSleepOnDisconnect Disabled -SelectiveSuspend Disabled -ErrorAction SilentlyContinue
    }
} catch {
    Write-Host "Non-critical error setting NIC properties: $_" -ForegroundColor Yellow
}

# 6. Desativar Network Throttling do Windows mantendo 10% para threads auxiliares/áudio (evita starvation no Source 2)
$sysProfilePath = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile"
if (-not (Test-Path $sysProfilePath)) {
    New-Item -Path $sysProfilePath -Force -ErrorAction SilentlyContinue | Out-Null
}
Set-ItemProperty -Path $sysProfilePath -Name "NetworkThrottlingIndex" -Value 0xffffffff -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path $sysProfilePath -Name "SystemResponsiveness" -Value 10 -Type DWord -ErrorAction SilentlyContinue

Write-Host "Network & gaming stack tweaks applied successfully."
