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

function Test-AppInstalled {
    param(
        [string]$PackagePattern,
        [array]$InstalledPkgs,
        [array]$ProvisionedPkgs
    )

    if ($PackagePattern -eq "Microsoft.OneDrive") {
        $oneDrivePaths = @(
            "$env:LOCALAPPDATA\Microsoft\OneDrive\OneDrive.exe",
            "$env:ProgramFiles\Microsoft OneDrive\OneDrive.exe",
            "${env:ProgramFiles(x86)}\Microsoft OneDrive\OneDrive.exe"
        )
        foreach ($p in $oneDrivePaths) {
            if ($p -and (Test-Path $p)) { return $true }
        }
    }

    foreach ($pkg in $InstalledPkgs) {
        if ($pkg.Name -like "*$PackagePattern*" -or $pkg.PackageFamilyName -like "*$PackagePattern*" -or $pkg.PackageFullName -like "*$PackagePattern*") {
            return $true
        }
    }

    foreach ($prov in $ProvisionedPkgs) {
        if ($prov.DisplayName -like "*$PackagePattern*" -or $prov.PackageName -like "*$PackagePattern*") {
            return $true
        }
    }

    return $false
}

function Show-AppSelectionDialog {
    $installedPkgs = @(Get-AppxPackage -AllUsers -ErrorAction SilentlyContinue)
    if ($installedPkgs.Count -eq 0) {
        $installedPkgs = @(Get-AppxPackage -ErrorAction SilentlyContinue)
    }
    $provisionedPkgs = @()
    try {
        $provisionedPkgs = @(Get-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue)
    } catch {}

    $apps = @()
    foreach ($appDef in $appDefinitions) {
        if (Test-AppInstalled -PackagePattern $appDef.Package -InstalledPkgs $installedPkgs -ProvisionedPkgs $provisionedPkgs) {
            $apps += @{
                Name      = $appDef.FriendlyName
                Package   = $appDef.Package
                IsChecked = $false
            }
        }
    }

    if ($apps.Count -eq 0) {
        [xml]$emptyXaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    Title="AGB — Despoluir o Windows"
    Height="220" Width="480"
    WindowStartupLocation="CenterScreen"
    WindowStyle="None"
    AllowsTransparency="True"
    Background="Transparent"
    ResizeMode="NoResize">
    <Border CornerRadius="14" Background="#0b0b12" BorderBrush="#252538" BorderThickness="1.5">
        <Grid Margin="28">
            <Grid.RowDefinitions>
                <RowDefinition Height="*"/>
                <RowDefinition Height="Auto"/>
            </Grid.RowDefinitions>
            <StackPanel Grid.Row="0" VerticalAlignment="Center">
                <TextBlock Text="Sistema já está limpo"
                          FontSize="19" FontWeight="SemiBold" Foreground="#10b981"
                          HorizontalAlignment="Center" Margin="0,0,0,10"/>
                <TextBlock Text="Nenhum dos bloatwares desta lista foi encontrado instalado no seu computador."
                          FontSize="13.5" Foreground="#94a3b8"
                          HorizontalAlignment="Center" TextAlignment="Center" TextWrapping="Wrap"/>
            </StackPanel>
            <Button Grid.Row="1" x:Name="BtnEmptyClose" Content="Fechar" Width="130" HorizontalAlignment="Center"
                    Background="#6366f1" Foreground="#ffffff" BorderThickness="0" Padding="18,9" FontWeight="SemiBold" Cursor="Hand"/>
        </Grid>
    </Border>
</Window>
"@
        $emptyReader = New-Object System.Xml.XmlNodeReader $emptyXaml
        $emptyWin = [Windows.Markup.XamlReader]::Load($emptyReader)
        $emptyWin.FindName("BtnEmptyClose").Add_Click({ $emptyWin.Close() })
        $emptyWin.ShowDialog() | Out-Null
        return $null
    }

    $apps = $apps | Sort-Object { $_.Name }
    
    [xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    Title="AGB — Despoluir o Windows (Debloat)"
    Height="760" Width="700"
    WindowStartupLocation="CenterScreen"
    WindowStyle="None"
    AllowsTransparency="True"
    ResizeMode="NoResize"
    Background="Transparent">
    <Window.Resources>
        <Style TargetType="CheckBox">
            <Setter Property="Foreground" Value="#e2e8f0"/>
            <Setter Property="FontSize" Value="13"/>
            <Setter Property="Padding" Value="10,6"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="CheckBox">
                        <Border x:Name="RowBorder" Background="Transparent" CornerRadius="8" Padding="8,6" Margin="2,1">
                            <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                                <Border x:Name="CheckBoxRect" Width="18" Height="18" CornerRadius="5"
                                        Background="#171726" BorderBrush="#33334d" BorderThickness="1.5"
                                        VerticalAlignment="Center" Margin="0,0,10,0">
                                    <TextBlock x:Name="CheckMark" Text="&#x2713;" FontSize="12" FontWeight="Bold"
                                               Foreground="#ffffff" HorizontalAlignment="Center" VerticalAlignment="Center"
                                               Visibility="Collapsed"/>
                                </Border>
                                <ContentPresenter VerticalAlignment="Center"/>
                            </StackPanel>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter TargetName="RowBorder" Property="Background" Value="#1a1a2b"/>
                                <Setter TargetName="CheckBoxRect" Property="BorderBrush" Value="#6366f1"/>
                            </Trigger>
                            <Trigger Property="IsChecked" Value="True">
                                <Setter TargetName="CheckBoxRect" Property="Background" Value="#6366f1"/>
                                <Setter TargetName="CheckBoxRect" Property="BorderBrush" Value="#818cf8"/>
                                <Setter TargetName="CheckMark" Property="Visibility" Value="Visible"/>
                                <Setter TargetName="RowBorder" Property="Background" Value="#16162a"/>
                                <Setter Property="Foreground" Value="#ffffff"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#6366f1"/>
            <Setter Property="Foreground" Value="#ffffff"/>
            <Setter Property="BorderThickness" Value="0"/>
            <Setter Property="Padding" Value="16,9"/>
            <Setter Property="FontSize" Value="13"/>
            <Setter Property="FontWeight" Value="SemiBold"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}"
                                BorderBrush="{TemplateBinding BorderBrush}"
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="8"
                                Padding="{TemplateBinding Padding}">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter Property="Background" Value="#4f46e5"/>
                            </Trigger>
                            <Trigger Property="IsPressed" Value="True">
                                <Setter Property="Background" Value="#4338ca"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
        <Style x:Key="SecondaryButton" TargetType="Button" BasedOn="{StaticResource {x:Type Button}}">
            <Setter Property="Background" Value="#171726"/>
            <Setter Property="Foreground" Value="#cbd5e1"/>
            <Setter Property="BorderBrush" Value="#2a2a3d"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="FontWeight" Value="Medium"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}"
                                BorderBrush="{TemplateBinding BorderBrush}"
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="8"
                                Padding="{TemplateBinding Padding}">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter Property="Background" Value="#222236"/>
                                <Setter Property="BorderBrush" Value="#3f3f5e"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
        <Style x:Key="RecommendedButton" TargetType="Button" BasedOn="{StaticResource SecondaryButton}">
            <Setter Property="Background" Value="#1e1b4b"/>
            <Setter Property="Foreground" Value="#a5b4fc"/>
            <Setter Property="BorderBrush" Value="#4338ca"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}"
                                BorderBrush="{TemplateBinding BorderBrush}"
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="8"
                                Padding="{TemplateBinding Padding}">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter Property="Background" Value="#2a2666"/>
                                <Setter Property="BorderBrush" Value="#6366f1"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
        <Style x:Key="CloseButton" TargetType="Button">
            <Setter Property="Background" Value="Transparent"/>
            <Setter Property="Foreground" Value="#94a3b8"/>
            <Setter Property="BorderThickness" Value="0"/>
            <Setter Property="Width" Value="30"/>
            <Setter Property="Height" Value="30"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}" CornerRadius="6">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter Property="Background" Value="#ef4444"/>
                                <Setter Property="Foreground" Value="#ffffff"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
    </Window.Resources>

    <Border CornerRadius="14" Background="#0b0b12" BorderBrush="#252538" BorderThickness="1.5">
        <Grid>
            <Grid.RowDefinitions>
                <RowDefinition Height="46"/>
                <RowDefinition Height="*"/>
            </Grid.RowDefinitions>

            <!-- Custom AGB Header Bar -->
            <Border x:Name="HeaderBar" Grid.Row="0" Background="#12121e" CornerRadius="13,13,0,0"
                    BorderBrush="#252538" BorderThickness="0,0,0,1" Padding="16,0">
                <Grid>
                    <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                        <Border Background="#6366f1" CornerRadius="6" Padding="8,3" Margin="0,0,10,0">
                            <TextBlock Text="AGB" Foreground="#ffffff" FontSize="11" FontWeight="Bold"/>
                        </Border>
                        <TextBlock Text="Despoluir o Windows (Debloat)" Foreground="#f8fafc" FontSize="13.5" FontWeight="SemiBold" VerticalAlignment="Center"/>
                    </StackPanel>
                    <Button x:Name="BtnClose" Content="&#x2715;" FontSize="13" HorizontalAlignment="Right" VerticalAlignment="Center" Style="{StaticResource CloseButton}"/>
                </Grid>
            </Border>

            <!-- Main Content -->
            <Grid Grid.Row="1" Margin="22,18,22,20">
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="*"/>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="Auto"/>
                </Grid.RowDefinitions>

                <TextBlock Grid.Row="0"
                           Text="Selecione os aplicativos para desinstalar"
                           FontSize="17"
                           FontWeight="SemiBold"
                           Foreground="#f8fafc"
                           Margin="0,0,0,4"/>

                <TextBlock Grid.Row="1"
                           Text="Marque os aplicativos que você deseja remover. Os itens desmarcados permanecerão no sistema."
                           FontSize="12.5"
                           Foreground="#94a3b8"
                           TextWrapping="Wrap"
                           Margin="0,0,0,14"/>

                <!-- Search Bar + Selected Counter -->
                <Grid Grid.Row="2" Margin="0,0,0,12">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="Auto"/>
                    </Grid.ColumnDefinitions>
                    <Border Grid.Column="0" Background="#13131f" BorderBrush="#252538" BorderThickness="1" CornerRadius="8" Padding="12,8" Margin="0,0,12,0">
                        <Grid>
                            <TextBlock x:Name="SearchPlaceholder" Text="Pesquisar aplicativo..." Foreground="#64748b" FontSize="13" VerticalAlignment="Center" IsHitTestVisible="False"/>
                            <TextBox x:Name="SearchBox" Background="Transparent" BorderThickness="0" Foreground="#f8fafc" CaretBrush="#818cf8" FontSize="13" VerticalAlignment="Center"/>
                        </Grid>
                    </Border>
                    <Border Grid.Column="1" Background="#13131f" BorderBrush="#252538" BorderThickness="1" CornerRadius="8" Padding="12,8" VerticalAlignment="Center">
                        <TextBlock x:Name="SelectedCountText" Text="0 selecionado(s)" Foreground="#a5b4fc" FontSize="12.5" FontWeight="SemiBold" VerticalAlignment="Center"/>
                    </Border>
                </Grid>

                <!-- App List -->
                <Border Grid.Row="3"
                        Background="#13131f"
                        BorderBrush="#252538"
                        BorderThickness="1"
                        CornerRadius="10"
                        Margin="0,0,0,14">
                    <ScrollViewer VerticalScrollBarVisibility="Auto">
                        <ItemsControl x:Name="AppsList" Margin="8">
                            <ItemsControl.ItemTemplate>
                                <DataTemplate>
                                    <CheckBox Content="{Binding Name}"
                                              IsChecked="{Binding IsChecked, Mode=TwoWay}"/>
                                </DataTemplate>
                            </ItemsControl.ItemTemplate>
                        </ItemsControl>
                    </ScrollViewer>
                </Border>

                <!-- Bulk Action Buttons -->
                <StackPanel Grid.Row="4"
                            Orientation="Horizontal"
                            Margin="0,0,0,14">
                    <Button x:Name="BtnSelectAll"
                            Content="Selecionar Todos"
                            Padding="14,8"
                            Margin="0,0,8,0"
                            Style="{StaticResource SecondaryButton}"/>
                    <Button x:Name="BtnDeselectAll"
                            Content="Desmarcar Todos"
                            Padding="14,8"
                            Margin="0,0,8,0"
                            Style="{StaticResource SecondaryButton}"/>
                    <Button x:Name="BtnSelectRecommended"
                            Content="Selecionar Recomendados"
                            Padding="16,8"
                            Style="{StaticResource RecommendedButton}"/>
                </StackPanel>

                <!-- Footer Confirm / Cancel -->
                <StackPanel Grid.Row="5"
                            Orientation="Horizontal"
                            HorizontalAlignment="Right">
                    <Button x:Name="BtnCancel" Content="Cancelar" Width="110" Margin="0,0,10,0" Style="{StaticResource SecondaryButton}" IsCancel="True"/>
                    <Button x:Name="BtnOK" Content="Desinstalar Selecionados" Width="200" IsDefault="True"/>
                </StackPanel>
            </Grid>
        </Grid>
    </Border>
</Window>
"@

    $reader = New-Object System.Xml.XmlNodeReader $xaml
    $window = [Windows.Markup.XamlReader]::Load($reader)

    $headerBar = $window.FindName("HeaderBar")
    $btnClose = $window.FindName("BtnClose")
    $searchBox = $window.FindName("SearchBox")
    $searchPlaceholder = $window.FindName("SearchPlaceholder")
    $selectedCountText = $window.FindName("SelectedCountText")
    $appsList = $window.FindName("AppsList")
    $btnSelectAll = $window.FindName("BtnSelectAll")
    $btnDeselectAll = $window.FindName("BtnDeselectAll")
    $btnSelectRecommended = $window.FindName("BtnSelectRecommended")
    $btnOK = $window.FindName("BtnOK")
    $btnCancel = $window.FindName("BtnCancel")

    $allApps = @()
    $observableApps = New-Object System.Collections.ObjectModel.ObservableCollection[Object]
    foreach ($app in $apps) {
        $obj = New-Object PSObject -Property $app
        $allApps += $obj
        $observableApps.Add($obj)
    }
    $appsList.ItemsSource = $observableApps

    function Update-SelectedCount {
        $count = ($allApps | Where-Object { $_.IsChecked }).Count
        $selectedCountText.Text = "$count selecionado(s)"
    }

    $script:dialogResult = $null

    $headerBar.Add_MouseLeftButtonDown({ $window.DragMove() })

    $btnClose.Add_Click({
        $script:dialogResult = $null
        $window.DialogResult = $false
        $window.Close()
    })

    $searchBox.Add_TextChanged({
        $q = $searchBox.Text.Trim().ToLower()
        $searchPlaceholder.Visibility = if ([string]::IsNullOrEmpty($searchBox.Text)) { "Visible" } else { "Collapsed" }
        $observableApps.Clear()
        foreach ($item in $allApps) {
            if ([string]::IsNullOrEmpty($q) -or $item.Name.ToLower().Contains($q) -or $item.Package.ToLower().Contains($q)) {
                $observableApps.Add($item)
            }
        }
    })

    $appsList.AddHandler([System.Windows.Controls.Primitives.ToggleButton]::CheckedEvent, [System.Windows.RoutedEventHandler]{ Update-SelectedCount })
    $appsList.AddHandler([System.Windows.Controls.Primitives.ToggleButton]::UncheckedEvent, [System.Windows.RoutedEventHandler]{ Update-SelectedCount })

    $btnSelectAll.Add_Click({
        foreach ($item in $observableApps) {
            $item.IsChecked = $true
        }
        $appsList.Items.Refresh()
        Update-SelectedCount
    })

    $btnDeselectAll.Add_Click({
        foreach ($item in $observableApps) {
            $item.IsChecked = $false
        }
        $appsList.Items.Refresh()
        Update-SelectedCount
    })

    $btnSelectRecommended.Add_Click({
        foreach ($item in $allApps) {
            if ($recommendedApps -contains $item.Package) {
                $item.IsChecked = $true
            }
        }
        $appsList.Items.Refresh()
        Update-SelectedCount
    })

    $btnOK.Add_Click({
        $script:dialogResult = @()
        foreach ($item in $allApps) {
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
        $friendlyName = Get-FriendlyName $app
        try {
            Write-Host "Removendo $friendlyName ($app)..." -ForegroundColor Yellow

            if ($app -eq "Microsoft.OneDrive") {
                Stop-Process -Name "OneDrive" -Force -ErrorAction SilentlyContinue
                $odSetup = @(
                    "$env:SystemRoot\System32\OneDriveSetup.exe",
                    "$env:SystemRoot\SysWOW64\OneDriveSetup.exe"
                ) | Where-Object { Test-Path $_ } | Select-Object -First 1
                if ($odSetup) {
                    Start-Process -FilePath $odSetup -ArgumentList "/uninstall" -Wait -WindowStyle Hidden -ErrorAction SilentlyContinue
                }
            }

            $pkgs = @(Get-AppxPackage -AllUsers -Name "*$app*" -ErrorAction SilentlyContinue)
            if ($pkgs.Count -eq 0) {
                $pkgs = @(Get-AppxPackage -Name "*$app*" -ErrorAction SilentlyContinue)
            }
            foreach ($p in $pkgs) {
                try {
                    Remove-AppxPackage -Package $p.PackageFullName -AllUsers -ErrorAction Stop
                } catch {
                    Remove-AppxPackage -Package $p.PackageFullName -ErrorAction SilentlyContinue
                }
            }

            $provs = @(Get-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like "*$app*" -or $_.PackageName -like "*$app*" })
            foreach ($pr in $provs) {
                Remove-AppxProvisionedPackage -Online -PackageName $pr.PackageName -ErrorAction SilentlyContinue | Out-Null
            }

            # Verify removal
            $remaining = @(Get-AppxPackage -Name "*$app*" -ErrorAction SilentlyContinue)
            if ($remaining.Count -eq 0) {
                Write-Host "Desinstalado e verificado: $friendlyName" -ForegroundColor Green
            } else {
                Write-Host "Aviso: $friendlyName ainda possui pacote protegido pelo sistema ($($remaining[0].PackageFullName))." -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "Não foi possível remover ${friendlyName}: $_" -ForegroundColor Red
        }
    }

    Write-Host "Despoluição concluída!" -ForegroundColor Green
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
    Title="AGB — Despoluir o Windows"
    Height="220"
    Width="480"
    WindowStartupLocation="CenterScreen"
    WindowStyle="None"
    AllowsTransparency="True"
    Background="Transparent"
    ResizeMode="NoResize">
    <Window.Resources>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#6366f1"/>
            <Setter Property="Foreground" Value="#ffffff"/>
            <Setter Property="BorderThickness" Value="0"/>
            <Setter Property="Padding" Value="24,10"/>
            <Setter Property="FontSize" Value="13.5"/>
            <Setter Property="FontWeight" Value="SemiBold"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}"
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="8"
                                Padding="{TemplateBinding Padding}">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter Property="Background" Value="#4f46e5"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
    </Window.Resources>

    <Border CornerRadius="14" Background="#0b0b12" BorderBrush="#252538" BorderThickness="1.5">
        <Grid Margin="28">
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
                          FontSize="13.5"
                          Foreground="#94a3b8"
                          HorizontalAlignment="Center"
                          TextAlignment="Center"
                          TextWrapping="Wrap"
                          Margin="0,0,0,5"/>
            </StackPanel>

            <Button Grid.Row="1"
                   x:Name="BtnOK"
                   Content="Concluir"
                   Width="140"
                   HorizontalAlignment="Center"/>
        </Grid>
    </Border>
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