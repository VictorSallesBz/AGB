# AGB Debloat Script
# This script allows the user to select which built-in apps and bloatware to remove
# Made for AGB

param(
    [string[]]$AppsToRemove = @()
)

$version = "2.0.0"

function Test-IsAdmin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdmin)) {
    Write-Host "[AGB Debloat] Este script precisa ser executado como Administrador." -ForegroundColor Red
    exit 1
}

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

# Lista de aplicativos e nomes amigáveis
$appDefinitions = @(
    @{ Package = "Clipchamp.Clipchamp"; FriendlyName = "Clipchamp (Editor de Vídeo)" },
    @{ Package = "Microsoft.3DBuilder"; FriendlyName = "3D Builder" },
    @{ Package = "Microsoft.549981C3F5F10"; FriendlyName = "Cortana" },
    @{ Package = "Microsoft.BingFinance"; FriendlyName = "Bing Finanças / Dinheiro" },
    @{ Package = "Microsoft.BingFoodAndDrink"; FriendlyName = "Bing Culinária" },
    @{ Package = "Microsoft.BingHealthAndFitness"; FriendlyName = "Bing Saúde & Bem-Estar" },
    @{ Package = "Microsoft.BingNews"; FriendlyName = "Bing Notícias" },
    @{ Package = "Microsoft.BingSports"; FriendlyName = "Bing Esportes" },
    @{ Package = "Microsoft.BingTranslator"; FriendlyName = "Bing Tradutor" },
    @{ Package = "Microsoft.BingTravel"; FriendlyName = "Bing Viagens" },
    @{ Package = "Microsoft.BingWeather"; FriendlyName = "Bing Clima / Tempo" },
    @{ Package = "Microsoft.Windows.DevHome"; FriendlyName = "Dev Home" },
    @{ Package = "Microsoft.Copilot"; FriendlyName = "Microsoft Copilot" },
    @{ Package = "Microsoft.Getstarted"; FriendlyName = "Dicas / Primeiros Passos" },
    @{ Package = "Microsoft.Messaging"; FriendlyName = "Mensagens do Windows" },
    @{ Package = "Microsoft.Microsoft3DViewer"; FriendlyName = "Visualizador 3D" },
    @{ Package = "Microsoft.MicrosoftJournal"; FriendlyName = "Microsoft Journal" },
    @{ Package = "Microsoft.MicrosoftOfficeHub"; FriendlyName = "Hub do Office (Promocional)" },
    @{ Package = "Microsoft.MicrosoftPowerBIForWindows"; FriendlyName = "Power BI" },
    @{ Package = "Microsoft.PowerAutomateDesktop"; FriendlyName = "Power Automate" },
    @{ Package = "Microsoft.MicrosoftSolitaireCollection"; FriendlyName = "Solitaire Collection (Paciência)" },
    @{ Package = "Microsoft.MicrosoftStickyNotes"; FriendlyName = "Notas Autoadesivas (Sticky Notes)" },
    @{ Package = "Microsoft.MixedReality.Portal"; FriendlyName = "Portal de Realidade Misturada" },
    @{ Package = "Microsoft.News"; FriendlyName = "Microsoft Notícias" },
    @{ Package = "Microsoft.Office.OneNote"; FriendlyName = "OneNote (App)" },
    @{ Package = "Microsoft.Office.Sway"; FriendlyName = "Office Sway" },
    @{ Package = "Microsoft.OneConnect"; FriendlyName = "Planos de Celular (OneConnect)" },
    @{ Package = "Microsoft.Paint"; FriendlyName = "Paint" },
    @{ Package = "Microsoft.Print3D"; FriendlyName = "Impressão 3D" },
    @{ Package = "Microsoft.SkypeApp"; FriendlyName = "Skype" },
    @{ Package = "Microsoft.Todos"; FriendlyName = "Microsoft To Do" },
    @{ Package = "Microsoft.WindowsAlarms"; FriendlyName = "Alarmes e Relógio" },
    @{ Package = "Microsoft.WindowsCamera"; FriendlyName = "Câmera" },
    @{ Package = "Microsoft.WindowsFeedbackHub"; FriendlyName = "Hub de Comentários" },
    @{ Package = "Microsoft.WindowsMaps"; FriendlyName = "Mapas do Windows" },
    @{ Package = "Microsoft.WindowsNotepad"; FriendlyName = "Bloco de Notas (UWP)" },
    @{ Package = "Microsoft.WindowsSoundRecorder"; FriendlyName = "Gravador de Voz" },
    @{ Package = "Microsoft.XboxApp"; FriendlyName = "Xbox Console Companion (Legado)" },
    @{ Package = "Microsoft.ZuneVideo"; FriendlyName = "Filmes e TV" },
    @{ Package = "MicrosoftCorporationII.MicrosoftFamily"; FriendlyName = "Microsoft Family Safety" },
    @{ Package = "MicrosoftTeams"; FriendlyName = "Microsoft Teams" },
    @{ Package = "MSTeams"; FriendlyName = "Teams (Work/School)" },
    @{ Package = "Microsoft.WindowsCalculator"; FriendlyName = "Calculadora" },
    @{ Package = "Microsoft.Windows.Photos"; FriendlyName = "Fotos do Windows" },
    @{ Package = "microsoft.windowscommunicationsapps"; FriendlyName = "Email e Calendário" },
    @{ Package = "Microsoft.XboxGamingOverlay"; FriendlyName = "Xbox Game Bar" },
    @{ Package = "Microsoft.XboxIdentityProvider"; FriendlyName = "Provedor de Identidade Xbox" },
    @{ Package = "Microsoft.XboxSpeechToTextOverlay"; FriendlyName = "Xbox Speech to Text" },
    @{ Package = "Microsoft.OneDrive"; FriendlyName = "OneDrive" },
    @{ Package = "Amazon.com.Amazon"; FriendlyName = "Amazon" },
    @{ Package = "9P1J8S7CCWWT"; FriendlyName = "Clipchamp (Store App)" },
    @{ Package = "AmazonVideo.PrimeVideo"; FriendlyName = "Prime Video" },
    @{ Package = "Disney"; FriendlyName = "Disney+" },
    @{ Package = "Duolingo-LearnLanguagesforFree"; FriendlyName = "Duolingo" },
    @{ Package = "Facebook"; FriendlyName = "Facebook" },
    @{ Package = "FarmVille2CountryEscape"; FriendlyName = "FarmVille 2" },
    @{ Package = "Instagram"; FriendlyName = "Instagram" },
    @{ Package = "Netflix"; FriendlyName = "Netflix" },
    @{ Package = "PandoraMediaInc.Pandora"; FriendlyName = "Pandora" },
    @{ Package = "Spotify"; FriendlyName = "Spotify" },
    @{ Package = "Twitter"; FriendlyName = "Twitter / X" },
    @{ Package = "TwitterUniversal"; FriendlyName = "Twitter Universal" },
    @{ Package = "YouTube"; FriendlyName = "YouTube" },
    @{ Package = "Plex"; FriendlyName = "Plex" },
    @{ Package = "TikTok"; FriendlyName = "TikTok" },
    @{ Package = "TuneInRadio"; FriendlyName = "TuneIn Radio" },
    @{ Package = "king.com.BubbleWitch3Saga"; FriendlyName = "Bubble Witch 3 Saga" },
    @{ Package = "king.com.CandyCrushSaga"; FriendlyName = "Candy Crush Saga" },
    @{ Package = "king.com.CandyCrushSodaSaga"; FriendlyName = "Candy Crush Soda Saga" },
    @{ Package = "9NBLGGH4QGHW"; FriendlyName = "Sticky Notes" },
    @{ Package = "Phone Link"; FriendlyName = "Vincular ao Celular (Phone Link)" }
)

# Aplicativos recomendados para remoção por padrão
$recommendedApps = @(
    "Microsoft.3DBuilder",
    "Microsoft.549981C3F5F10",
    "Microsoft.BingFinance",
    "Microsoft.BingFoodAndDrink",
    "Microsoft.BingHealthAndFitness",
    "Microsoft.BingNews",
    "Microsoft.BingSports",
    "Microsoft.BingTranslator",
    "Microsoft.BingTravel",
    "Microsoft.BingWeather",
    "Microsoft.Windows.DevHome",
    "Microsoft.Copilot",
    "Microsoft.Getstarted",
    "Microsoft.Messaging",
    "Microsoft.Microsoft3DViewer",
    "Microsoft.MicrosoftJournal",
    "Microsoft.MicrosoftOfficeHub",
    "Microsoft.MicrosoftPowerBIForWindows",
    "Microsoft.PowerAutomateDesktop",
    "Microsoft.MicrosoftSolitaireCollection",
    "Microsoft.MixedReality.Portal",
    "Microsoft.News",
    "Microsoft.Office.OneNote",
    "Microsoft.Office.Sway",
    "Microsoft.OneConnect",
    "Microsoft.Print3D",
    "Microsoft.SkypeApp",
    "Microsoft.Todos",
    "Microsoft.WindowsFeedbackHub",
    "Microsoft.WindowsMaps",
    "Microsoft.WindowsSoundRecorder",
    "Microsoft.XboxApp",
    "Microsoft.ZuneVideo",
    "MicrosoftTeams",
    "MSTeams",
    "MicrosoftCorporationII.MicrosoftFamily",
    "Clipchamp.Clipchamp",
    "9P1J8S7CCWWT",
    "Amazon.com.Amazon",
    "AmazonVideo.PrimeVideo",
    "Disney",
    "Duolingo-LearnLanguagesforFree",
    "Facebook",
    "FarmVille2CountryEscape",
    "Instagram",
    "Netflix",
    "PandoraMediaInc.Pandora",
    "Spotify",
    "Twitter",
    "TwitterUniversal",
    "YouTube",
    "Plex",
    "TikTok",
    "TuneInRadio",
    "king.com.BubbleWitch3Saga",
    "king.com.CandyCrushSaga",
    "king.com.CandyCrushSodaSaga"
)

function Get-FriendlyName {
    param([string]$PackageName)
    $def = $appDefinitions | Where-Object { $_.Package -eq $PackageName }
    if ($def) {
        return $def.FriendlyName
    }
    return $PackageName -replace "MicrosoftCorporationII\.", "" -replace "Microsoft\.", "" -replace "\.", " "
}

function Show-AppSelectionDialog {
    $apps = @()
    foreach ($appDef in $appDefinitions) {
        $apps += @{ 
            Name      = $appDef.FriendlyName
            Package   = $appDef.Package
            IsChecked = $false
        }
    }
    
    $apps = $apps | Sort-Object { $_.Name }
    
    [xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    Title="AGB Debloat — Despoluir o Windows" 
    Height="750" Width="650" 
    WindowStartupLocation="CenterScreen"
    ResizeMode="NoResize"
    Background="#0c121f">
    <Window.Resources>
        <Style TargetType="CheckBox">
            <Setter Property="Foreground" Value="#f0f4f8"/>
            <Setter Property="FontSize" Value="13"/>
            <Setter Property="Padding" Value="8,5"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Style.Triggers>
                <Trigger Property="IsMouseOver" Value="True">
                    <Setter Property="Foreground" Value="#3b82f6"/>
                </Trigger>
            </Style.Triggers>
        </Style>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#3b82f6"/>
            <Setter Property="Foreground" Value="#ffffff"/>
            <Setter Property="BorderThickness" Value="0"/>
            <Setter Property="Padding" Value="16,8"/>
            <Setter Property="FontSize" Value="13"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}" 
                                BorderBrush="{TemplateBinding BorderBrush}"
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="6"
                                Padding="{TemplateBinding Padding}">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter Property="Background" Value="#2563eb"/>
                            </Trigger>
                            <Trigger Property="IsPressed" Value="True">
                                <Setter Property="Background" Value="#1d4ed8"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
        <Style x:Key="SecondaryButton" TargetType="Button" BasedOn="{StaticResource {x:Type Button}}">
            <Setter Property="Background" Value="#1e293b"/>
            <Setter Property="Foreground" Value="#f0f4f8"/>
            <Setter Property="BorderBrush" Value="#334155"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}" 
                                BorderBrush="{TemplateBinding BorderBrush}"
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="6"
                                Padding="{TemplateBinding Padding}">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter Property="Background" Value="#334155"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
    </Window.Resources>
    
    <Grid Margin="24">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>
        
        <TextBlock Grid.Row="0" 
                   Text="Selecione os aplicativos para desinstalar" 
                   FontSize="18" 
                   FontWeight="SemiBold" 
                   Foreground="#f0f4f8"
                   Margin="0,0,0,6"/>
        
        <TextBlock Grid.Row="1" 
                   Text="Marque os aplicativos que você deseja remover. Os itens desmarcados permanecerão no sistema." 
                   FontSize="13" 
                   Foreground="#94a3b8"
                   TextWrapping="Wrap"
                   Margin="0,0,0,14"/>

        <Border Grid.Row="2" 
                Background="#111827" 
                BorderBrush="#1e293b" 
                BorderThickness="1" 
                CornerRadius="8"
                Margin="0,0,0,14">
            <ScrollViewer VerticalScrollBarVisibility="Auto">
                <ItemsControl x:Name="AppsList" Margin="12">
                    <ItemsControl.ItemTemplate>
                        <DataTemplate>
                            <CheckBox Content="{Binding Name}" 
                                     IsChecked="{Binding IsChecked}" 
                                     Margin="4,3"/>
                        </DataTemplate>
                    </ItemsControl.ItemTemplate>
                </ItemsControl>
            </ScrollViewer>
        </Border>
        
        <StackPanel Grid.Row="3" 
                    Orientation="Horizontal" 
                    Margin="0,0,0,14">
            <Button x:Name="BtnSelectAll" 
                    Content="Selecionar Todos" 
                    Width="130" 
                    Margin="0,0,10,0"
                    Style="{StaticResource SecondaryButton}"/>
            <Button x:Name="BtnDeselectAll" 
                    Content="Desmarcar Todos" 
                    Width="130" 
                    Margin="0,0,10,0"
                    Style="{StaticResource SecondaryButton}"/>
            <Button x:Name="BtnSelectRecommended" 
                    Content="Selecionar Recomendados" 
                    Width="180"
                    Background="#1e293b"
                    Foreground="#38bdf8"/>
        </StackPanel>
        
        <StackPanel Grid.Row="4" 
                    Orientation="Horizontal" 
                    HorizontalAlignment="Right">
            <Button x:Name="BtnOK" Content="Desinstalar Selecionados" Width="180" Margin="0,0,12,0" IsDefault="True"/>
            <Button x:Name="BtnCancel" Content="Cancelar" Width="100" Style="{StaticResource SecondaryButton}" IsCancel="True"/>
        </StackPanel>
    </Grid>
</Window>
"@

    $reader = New-Object System.Xml.XmlNodeReader $xaml
    $window = [Windows.Markup.XamlReader]::Load($reader)
    
    $appsList = $window.FindName("AppsList")
    $btnSelectAll = $window.FindName("BtnSelectAll")
    $btnDeselectAll = $window.FindName("BtnDeselectAll")
    $btnSelectRecommended = $window.FindName("BtnSelectRecommended")
    $btnOK = $window.FindName("BtnOK")
    $btnCancel = $window.FindName("BtnCancel")
    
    $observableApps = New-Object System.Collections.ObjectModel.ObservableCollection[Object]
    foreach ($app in $apps) {
        $observableApps.Add((New-Object PSObject -Property $app))
    }
    $appsList.ItemsSource = $observableApps
    
    $script:dialogResult = $null
    
    $btnSelectAll.Add_Click({
        foreach ($item in $observableApps) {
            $item.IsChecked = $true
        }
        $appsList.Items.Refresh()
    })
    
    $btnDeselectAll.Add_Click({
        foreach ($item in $observableApps) {
            $item.IsChecked = $false
        }
        $appsList.Items.Refresh()
    })
    
    $btnSelectRecommended.Add_Click({
        foreach ($item in $observableApps) {
            if ($recommendedApps -contains $item.Package) {
                $item.IsChecked = $true
            }
        }
        $appsList.Items.Refresh()
    })
    
    $btnOK.Add_Click({
        $script:dialogResult = @()
        foreach ($item in $observableApps) {
            if ($item.IsChecked) {
                $script:dialogResult += $item.Package
            }
        }
        $window.DialogResult = $true
        $window.Close()
    })
    
    $btnCancel.Add_Click({
        $script:dialogResult = $null
        $window.DialogResult = $false
        $window.Close()
    })
    
    $window.Add_Closing({
        if ($null -eq $script:dialogResult) {
            $script:dialogResult = $null
        }
    })
    
    $result = $window.ShowDialog()
    if ($result -eq $false) {
        return $null
    }
    return $script:dialogResult
}

function Remove-SelectedApps {
    param([string[]]$AppsToRemove)

    Write-Host "Iniciando despoluição do Windows..." -ForegroundColor Green

    $removeNames = $AppsToRemove | ForEach-Object { Get-FriendlyName $_ }
    Write-Host "Aplicativos a serem desinstalados: $($removeNames -join ', ')" -ForegroundColor Yellow
    Write-Host "Total de aplicativos para remover: $($AppsToRemove.Count)" -ForegroundColor Cyan
    
    foreach ($app in $AppsToRemove) {
        try {
            $friendlyName = Get-FriendlyName $app
            Write-Host "Removendo $friendlyName ($app)..." -ForegroundColor Yellow

            $pkg = Get-AppxPackage -Name *$app* -ErrorAction SilentlyContinue
            if ($pkg) {
                $pkg | ForEach-Object {
                    Remove-AppxPackage -Package $_.PackageFullName -ErrorAction SilentlyContinue
                }
                Write-Host "Desinstalado: $friendlyName" -ForegroundColor Green
            }

            $prov = Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like "*$app*"
            if ($prov) {
                $prov | ForEach-Object {
                    Remove-AppxProvisionedPackage -Online -PackageName $_.PackageName -ErrorAction SilentlyContinue
                }
            }
        }
        catch {
            Write-Host "Não foi possível remover ${friendlyName}: $_" -ForegroundColor Red
        }
    }

    Write-Host "Despoluição concluída com sucesso!" -ForegroundColor Green
}

try {
    $script:appsWereRemoved = $false
    
    if ($AppsToRemove.Count -gt 0) {
        Write-Host "Removendo $($AppsToRemove.Count) aplicativos especificados..." -ForegroundColor Green
        Remove-SelectedApps -AppsToRemove $AppsToRemove
        $script:appsWereRemoved = $true
    }
    else {
        # Abre diretamente a janela de seleção visual
        $selectedApps = Show-AppSelectionDialog
        
        if ($null -eq $selectedApps -or $selectedApps.Count -eq 0) {
            Write-Host "Nenhum aplicativo foi selecionado. Operação cancelada." -ForegroundColor Yellow
            exit 0
        }
        
        Remove-SelectedApps -AppsToRemove $selectedApps
        $script:appsWereRemoved = $true
    }

    if ($script:appsWereRemoved -and -not (Get-Process -Name "agb" -ErrorAction SilentlyContinue)) {
        [xml]$xaml = @"
<Window 
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    Title="AGB Debloat" 
    Height="200" 
    Width="480"
    WindowStartupLocation="CenterScreen"
    Background="#0c121f"
    ResizeMode="NoResize">
    <Window.Resources>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#3b82f6"/>
            <Setter Property="Foreground" Value="#ffffff"/>
            <Setter Property="BorderThickness" Value="0"/>
            <Setter Property="Padding" Value="24,10"/>
            <Setter Property="FontSize" Value="14"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}" 
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="6"
                                Padding="{TemplateBinding Padding}">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
    </Window.Resources>
    
    <Grid Margin="30">
        <Grid.RowDefinitions>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>
        
        <StackPanel Grid.Row="0" VerticalAlignment="Center">
            <TextBlock Text="Despoluição Concluída" 
                      FontSize="20"
                      FontWeight="SemiBold" 
                      Foreground="#10b981"
                      HorizontalAlignment="Center"
                      Margin="0,0,0,10"/>
            <TextBlock Text="Os aplicativos selecionados foram removidos com sucesso." 
                      FontSize="14"
                      Foreground="#94a3b8"
                      HorizontalAlignment="Center"
                      TextAlignment="Center"
                      TextWrapping="Wrap"
                      Margin="0,0,0,5"/>
        </StackPanel>
                  
        <Button Grid.Row="1" 
               x:Name="BtnOK" 
               Content="Concluir" 
               Width="120"
               HorizontalAlignment="Center"/>
    </Grid>
</Window>
"@

        $reader = New-Object System.Xml.XmlNodeReader $xaml
        $window = [Windows.Markup.XamlReader]::Load($reader)
        $btnOK = $window.FindName("BtnOK")
        $btnOK.Add_Click({ $window.Close() })
        $window.ShowDialog() | Out-Null
    }
}
catch {
    Write-Host "Erro durante o processo de debloat: $_" -ForegroundColor Red
    exit 1
}