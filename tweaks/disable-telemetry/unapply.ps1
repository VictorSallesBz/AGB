
# Registry cleanup (removes entries we added)
$registrySettings = @(
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\AdvertisingInfo\Enabled",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Privacy\TailoredExperiencesWithDiagnosticDataEnabled",
    "HKCU:\Software\Microsoft\Speech_OneCore\Settings\OnlineSpeechPrivacy\HasAccepted",
    "HKCU:\Software\Microsoft\Input\TIPC\Enabled",
    "HKCU:\Software\Microsoft\InputPersonalization\RestrictImplicitInkCollection",
    "HKCU:\Software\Microsoft\InputPersonalization\RestrictImplicitTextCollection",
    "HKCU:\Software\Microsoft\InputPersonalization\TrainedDataStore\HarvestContacts",
    "HKCU:\Software\Microsoft\Personalization\Settings\AcceptedPrivacyPolicy",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection\AllowTelemetry",
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection\AllowTelemetry",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced\Start_TrackProgs",
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\System\PublishUserActivities",
    "HKCU:\Software\Microsoft\Siuf\Rules\NumberOfSIUFInPeriod"
)

foreach ($reg in $registrySettings) {
    Remove-ItemProperty -Path ($reg -replace '\\[^\\]+$','') -Name ($reg -split '\\')[-1] -ErrorAction SilentlyContinue
}

# Enable Defender Auto Sample Submission
Set-MpPreference -SubmitSamplesConsent 1 -ErrorAction SilentlyContinue

# Enable Connected User Experiences and Telemetry service
Set-Service -Name diagtrack -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name diagtrack -ErrorAction SilentlyContinue

# Restore default telemetry level
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection" -Name "AllowTelemetry" -Value 1 -Type DWord -ErrorAction SilentlyContinue

# Enable Windows Error Reporting Service
Set-Service -Name WerSvc -StartupType Manual -ErrorAction SilentlyContinue
Start-Service -Name WerSvc -ErrorAction SilentlyContinue

# Reset SvcHostSplitThresholdInKB to default value
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control" -Name "SvcHostSplitThresholdInKB" -Value 399360 -Type DWord -ErrorAction SilentlyContinue

Write-Output "Telemetry settings have been reverted to default."