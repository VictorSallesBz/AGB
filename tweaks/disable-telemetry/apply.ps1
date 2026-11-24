# Registry tweaks
$registrySettings = @(
    @{ Path="HKCU:\Software\Microsoft\Windows\CurrentVersion\AdvertisingInfo"; Name="Enabled"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\Windows\CurrentVersion\Privacy"; Name="TailoredExperiencesWithDiagnosticDataEnabled"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\Speech_OneCore\Settings\OnlineSpeechPrivacy"; Name="HasAccepted"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\Input\TIPC"; Name="Enabled"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\InputPersonalization"; Name="RestrictImplicitInkCollection"; Value=1 },
    @{ Path="HKCU:\Software\Microsoft\InputPersonalization"; Name="RestrictImplicitTextCollection"; Value=1 },
    @{ Path="HKCU:\Software\Microsoft\InputPersonalization\TrainedDataStore"; Name="HarvestContacts"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\Personalization\Settings"; Name="AcceptedPrivacyPolicy"; Value=1 },
    @{ Path="HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection"; Name="AllowTelemetry"; Value=0 },
    @{ Path="HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection"; Name="AllowTelemetry"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"; Name="Start_TrackProgs"; Value=0 },
    @{ Path="HKLM:\SOFTWARE\Policies\Microsoft\Windows\System"; Name="PublishUserActivities"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\Siuf\Rules"; Name="NumberOfSIUFInPeriod"; Value=0 },
    @{ Path="HKLM:\SOFTWARE\Policies\Microsoft\Windows\OOBE"; Name="DisablePrivacyExperience"; Value=1 },
    @{ Path="HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\OOBE"; Name="PrivacyConsentStatus"; Value=1 },
    @{ Path="HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\OOBE"; Name="DisablePrivacyExperience"; Value=1 },
    @{ Path="HKCU:\Software\Microsoft\Windows\CurrentVersion\UserProfileEngagement"; Name="ScoobeSystemSettingEnabled"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; Name="SubscribedContent-310093Enabled"; Value=0 },
    @{ Path="HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; Name="SubscribedContent-338389Enabled"; Value=0 }
)

foreach ($reg in $registrySettings) {
    if (-not (Test-Path $reg.Path)) {
        New-Item -Path $reg.Path -Force -ErrorAction SilentlyContinue | Out-Null
    }
    Set-ItemProperty -Path $reg.Path -Name $reg.Name -Value $reg.Value -Type DWord -ErrorAction SilentlyContinue
}

# Disable Defender Auto Sample Submission
Set-MpPreference -SubmitSamplesConsent 2 -ErrorAction SilentlyContinue

# Disable Connected User Experiences and Telemetry service
Stop-Service -Name diagtrack -Force -ErrorAction SilentlyContinue
Set-Service -Name diagtrack -StartupType Disabled -ErrorAction SilentlyContinue

# Disable Windows Error Reporting Service
Stop-Service -Name WerSvc -Force -ErrorAction SilentlyContinue
Set-Service -Name WerSvc -StartupType Disabled -ErrorAction SilentlyContinue

# Set SvcHostSplitThresholdInKB to total RAM in KB (this can help with performance)
$MemoryKB = (Get-CimInstance Win32_PhysicalMemory | Measure-Object Capacity -Sum).Sum / 1KB
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control" -Name "SvcHostSplitThresholdInKB" -Value ([int]$MemoryKB) -ErrorAction SilentlyContinue

# Remove PeriodInNanoSeconds key if exists
Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Siuf\Rules" -Name "PeriodInNanoSeconds" -ErrorAction SilentlyContinue

Write-Output "Telemetry settings have been applied successfully."