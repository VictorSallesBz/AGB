# ⚡ AGB — Advanced Gaming Booster

> Otimizador gratuito e de código aberto para **Windows 10 e Windows 11**, feito para reduzir latência, limpar processos em segundo plano e melhorar a resposta do sistema em jogos e no dia a dia.

[![Versão](https://img.shields.io/badge/Versão-1.0.0-10b981?style=for-the-badge)](https://github.com/VictorSallesBz/AGB/releases/latest)
[![Baixar Instalador](https://img.shields.io/badge/Download-Instalador_.EXE-2563eb?style=for-the-badge&logo=windows)](https://github.com/VictorSallesBz/AGB/releases/latest/download/agb-1.0.0-setup.exe)
[![Ajustes](https://img.shields.io/badge/Ajustes-66_Tweaks-6366f1?style=for-the-badge)](#manual-completo-dos-66-ajustes)
[![Windows](https://img.shields.io/badge/Windows-10%20%2F%2011-0078D6?style=for-the-badge&logo=windows)](https://github.com/VictorSallesBz/AGB)
[![Discord](https://img.shields.io/badge/Discord-Comunidade_AGB-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/b3HekDzKGS)
[![Apoiar](https://img.shields.io/badge/Ko--fi-Apoiar_o_Projeto-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/victorsalles)

> ### ⬇️ Baixar AGB v1.0.0 (Windows 10 e 11)
> - 🚀 [**Baixar Instalador (`agb-1.0.0-setup.exe`) — Recomendado**](https://github.com/VictorSallesBz/AGB/releases/latest/download/agb-1.0.0-setup.exe) *(abre direto com dois cliques e cria atalho na Área de Trabalho)*
> - 📦 [**Baixar Versão Portátil (`AGB-1.0.0-win.zip`)**](https://github.com/VictorSallesBz/AGB/releases/latest/download/AGB-1.0.0-win.zip) *(sem instalação: basta extrair a pasta e abrir `agb.exe`)*
> - 📋 [**Página de Releases**](https://github.com/VictorSallesBz/AGB/releases/latest)

> ### ❤️ Apoiar o desenvolvimento
> O AGB é gratuito e mantido de forma independente. Se o programa ajudou a melhorar seu PC, você pode contribuir para manter o projeto ativo e atualizado:
> - **PIX (Brasil):** QR Code e chave Copia e Cola dentro do aplicativo, clicando em **Apoiar o AGB** no canto inferior esquerdo (ou na aba **Configurações**).
> - **Ko-fi (PayPal / Cartão / Internacional):** [**ko-fi.com/victorsalles**](https://ko-fi.com/victorsalles)
> - **Bugs, sugestões e comunidade:** reporte problemas ou peça novos recursos em [**GitHub Issues**](https://github.com/VictorSallesBz/AGB/issues/new/choose) ou entre no [**Discord**](https://discord.gg/b3HekDzKGS).

---

## 📋 Sumário

- [Sobre o AGB](#-sobre-o-agb)
- [Instalação e Primeiros Passos](#-instalação-e-primeiros-passos)
- [Guia das Abas do Aplicativo](#-guia-das-abas-do-aplicativo)
  - [1. Painel (Home) e Perfis Rápidos](#1-painel-home-e-perfis-rápidos)
  - [2. Ajustes (Tweaks)](#2-ajustes-tweaks)
  - [3. Aplicativos (Debloat, Inicialização e Serviços)](#3-aplicativos-debloat-inicialização-e-serviços)
  - [4. Utilitários (16 Ferramentas)](#4-utilitários-16-ferramentas)
  - [5. Limpeza do Sistema (9 Módulos)](#5-limpeza-do-sistema-9-módulos)
  - [6. Restauração e Backup](#6-restauração-e-backup)
  - [7. Gerenciador e Benchmark de DNS](#7-gerenciador-e-benchmark-de-dns)
  - [8. Configurações, Apoio e Reporte de Bugs](#8-configurações-apoio-e-reporte-de-bugs)
- [Índice dos 66 Ajustes](#-índice-dos-66-ajustes)
- [Manual Completo dos 66 Ajustes](#-manual-completo-dos-66-ajustes)

---

## 🛡️ Sobre o AGB

- **Código aberto e transparente:** todos os **66 ajustes** usam scripts PowerShell (`apply.ps1` e `unapply.ps1`) que você pode ler no repositório ou direto dentro do app pelo botão **Scripts**.
- **Fácil de reverter:** quase todos os ajustes guardam a configuração original e podem ser desfeitos um por um na aba **Ajustes** ou todos juntos na aba **Restauração**.
- **Manual integrado:** clicar em **Manual** em qualquer ajuste dentro do AGB abre este documento direto na explicação daquele item.

---

## 🚀 Instalação e Primeiros Passos

### Opção 1 — Instalador `.exe` (Recomendado)
Você não precisa instalar Node.js nem mexer com comandos:
1. Baixe [**agb-1.0.0-setup.exe**](https://github.com/VictorSallesBz/AGB/releases/latest/download/agb-1.0.0-setup.exe).
2. Dê dois cliques no arquivo.
   > **ℹ️ SmartScreen:** se o Windows mostrar a tela azul ("O Windows protegeu o computador"), clique em **"Mais informações"** e depois em **"Executar assim mesmo"**. Isso acontece porque o aplicativo ainda não usa certificado pago de assinatura digital.
3. Avance no instalador para criar os atalhos na Área de Trabalho e no Menu Iniciar.
4. Ao abrir o **AGB**, aceite a permissão de **Administrador** (ela é necessária para alterar chaves de registro, planos de energia e serviços do Windows).

### Opção 2 — Versão Portátil `.zip`
1. Baixe [**AGB-1.0.0-win.zip**](https://github.com/VictorSallesBz/AGB/releases/latest/download/AGB-1.0.0-win.zip).
2. Clique com o botão direito no arquivo e escolha **Extrair tudo...**.
3. Abra a pasta extraída e execute **`agb.exe`** como Administrador.

<details>
<summary>💻 <strong>Opção 3 — Para Desenvolvedores:</strong> rodar pelo código-fonte (Node.js 20+ e pnpm)</summary>

```powershell
git clone https://github.com/VictorSallesBz/AGB.git
cd AGB
pnpm install
pnpm run build:registry -- -y
pnpm run dev
```

</details>

### Primeiros passos após instalar
1. **Crie um Ponto de Restauração:** na aba **Restauração**, crie um ponto rápido antes de aplicar mudanças maiores.
2. **Escolha um Perfil ou ajuste manualmente:** no **Painel**, você pode aplicar **Leve**, **Recomendado** ou **Agressivo** (clique em **Ver ajustes** para conferir cada item antes), ou escolher um por um na aba **Ajustes**.
3. **Revise Aplicativos e Limpeza:** use a aba **Aplicativos** para tirar programas pesados da inicialização/serviços e a aba **Limpeza** para apagar arquivos temporários.
4. **Teste o DNS:** na aba **Gerenciador DNS**, rode **Testar Latência** para ver qual servidor responde mais rápido na sua internet.
5. **Reinicie o PC:** vários ajustes de Registro, Rede e Sistema só passam a valer por completo depois de reiniciar o Windows.

---

## 🧭 Guia das Abas do Aplicativo

### 1. Painel (Home) e Perfis Rápidos

![Painel do AGB](images/screenshots/01-painel.png)

O Painel centraliza a visão geral da sua máquina e oferece otimização rápida em um clique:
- **Telemetria em Tempo Real:** Exibe modelo de CPU, uso de memória RAM, GPU instalada, armazenamento principal, versão do Windows e contagem de ajustes ativos no momento.
- **Game Booster Ativo:** Alternador rápido dedicado a sessões de jogo que otimiza o plano de energia, prioridades e reduz interferências durante partidas.
- **Perfis de Otimização Pré-Configurados:**
  - **Perfil Leve (9 ajustes):** Ideal para notebooks, PCs de trabalho ou quem busca estabilidade total com melhorias essenciais de resposta e telemetria básica.
  - **Perfil Recomendado (18 ajustes):** Equilíbrio ideal para a maioria dos jogadores (inclusive CS2), reduzindo processos secundários e melhorando rede, MPO, USB e tempo de resposta sem sacrificar recursos comuns do Windows.
  - **Perfil Agressivo (29 ajustes no perfil / 28 aplicados conforme sua GPU):** Focado em máximo FPS e latência mínima. Detecta automaticamente se sua placa de vídeo é **NVIDIA** ou **AMD** e aplica exclusivamente a otimização correspondente (`optimize-nvidia-settings` ou `optimize-amd-settings`).
- **Botão "Ver ajustes" do Perfil:** Abre o modal detalhando todos os ajustes do perfil, se cada um já está **Ativo** ou **Desativado**, um botão **Manual** individual (que leva direto para a seção correspondente neste README) e o botão para aplicar todo o perfil com um clique.

![Detalhes dos Ajustes do Perfil](images/screenshots/02-perfil-detalhes.png)

### 2. Ajustes (Tweaks)

![Aba Ajustes do AGB](images/screenshots/03-ajustes.png)

Lista todos os **66 ajustes** disponíveis no AGB com controle total:
- **Barra de Busca:** Filtra instantaneamente por nome, palavra-chave ou descrição.
- **Filtros de Status e Categoria:** Alterne entre *Todos os Ajustes*, *Ativos*, *Inativos*, *Favoritos (★)* e categorias como *Desempenho*, *Jogos*, *Rede*, *Privacidade*, *Sistema*, *Aparência* e *GPU*.
- **Favoritar:** fixa seus ajustes preferidos no topo da lista.
- **Exportar / Importar Perfis (`.json`):** Salve sua seleção pessoal de ajustes em um arquivo `.json` para fazer backup ou compartilhar com amigos e outros PCs.
- **Botão `Manual` e Botão `Scripts`:** Em cada cartão, clique em **Manual** para abrir este documento exatamente na explicação do ajuste, ou no ícone de código (**Scripts**) para inspecionar os códigos exatos `apply.ps1` e `unapply.ps1` antes de executar.

![Visualização transparente de scripts PowerShell](images/screenshots/04-ajustes-scripts.png)

### 3. Aplicativos (Debloat, Inicialização e Serviços)

Dividida em três ferramentas essenciais:
- **Aplicativos Instalados (Desinstalador):** Lista aplicativos instalados e pacotes do Windows com opção de selecionar vários de uma vez e desinstalar em lote.
- **Inicialização do Windows (Startup Apps):** Lista apenas programas e tarefas agendadas que iniciam com o Windows, permitindo ativar ou desativar entradas sem abrir o Gerenciador de Tarefas.
- **Serviços (services.msc):** Lista serviços de terceiros (filtrando serviços nativos do Windows) para alternar com 1 clique entre **Automático** e **Manual**, protegendo Anti-Cheats contra desativação acidental.

![Aplicativos Instalados](images/screenshots/05a-aplicativos-instalados.png)

![Aplicativos na Inicialização do Windows](images/screenshots/05b-aplicativos-inicializacao.png)

![Serviços de Terceiros (services.msc)](images/screenshots/05c-servicos-inicializacao.png)

![Janela Debloat — Despoluir o Windows](images/screenshots/05d-debloat-janela.png)

### 4. Utilitários (16 Ferramentas)

![Utilitários do Sistema](images/screenshots/06-utilitarios.png)

Atalhos rápidos e automações do sistema agrupados em um só lugar:

| Utilitário | O que faz |
| :--- | :--- |
| **Informações do Sistema** | Exibe informações técnicas detalhadas sobre o seu sistema e hardware. |
| **Driver de Vídeo** | Reinicia o driver de vídeo para corrigir falhas visuais ou travamentos de tela. |
| **Reiniciar Windows Explorer** | Reinicia o Windows Explorer e a barra de tarefas para corrigir travamentos ou congelamentos. |
| **Pesquisa e Interface do Windows** | Reinicia os serviços da Pesquisa do Windows e interface gráfica (pode levar alguns instantes). |
| **Renovar Conexão IP** | Libera e renova a concessão DHCP com o roteador para resolver quedas e conflitos de IP de forma segura. |
| **Corrigir Bluetooth** | Reinicia os serviços de Bluetooth para resolver falhas de conectividade. |
| **Verificador de Arquivos do Sistema (SFC)** | Repara arquivos corrompidos do sistema para melhorar a estabilidade geral. |
| **Restauração de Imagem DISM** | Usa o DISM para reparar a imagem do Windows e corrigir problemas do sistema. |
| **Verificar Disco (CHKDSK)** | Verifica a integridade do sistema de arquivos de forma rápida e segura para SSDs, NVMe e HDs. |
| **Reiniciar Serviço de Áudio** | Corrige problemas de som reiniciando o serviço de áudio do Windows. |
| **Redefinir Rede (Stack TCP/IP)** | Redefine a pilha TCP/IP e rede para corrigir problemas profundos de conexão. |
| **Diagnóstico de Latência DPC e Drivers** | Verifica a precisão do temporizador do sistema e busca interrupções de drivers com alta latência que causam estalos de áudio ou travamentos em jogos. |
| **Windows Update** | Verifica e instala atualizações de segurança, patches cumulativos e drivers oficiais no Windows 11. |
| **Verificador Anti-Cheat (FACEIT / GamersClub / Vanguard)** | Verifica se TPM 2.0, Secure Boot, Integridade de Memória (HVCI) e Virtualização estão prontos para jogos competitivos. |
| **Otimizar Jogo Específico (.exe)** | Escolha o .exe de um jogo para aplicar GPU de Alto Desempenho, desativar Otimizações de Tela Cheia (FSO) e ajustar DPI só para ele. |
| **Reverter Otimizações de Jogos (.exe)** | Lista e remove as flags personalizadas de GPU, FSO e DPI aplicadas anteriormente em executáveis de jogos. |

### 5. Limpeza do Sistema (9 Módulos)

![Limpeza do Sistema](images/screenshots/07-limpeza.png)

Permite analisar e limpar arquivos desnecessários com segurança, além de incluir atalho para o **Sensor de Armazenamento (Storage Sense)** no Windows 11:

| Módulo de Limpeza | O que remove |
| :--- | :--- |
| **Limpar Arquivos Temporários** | Remove arquivos temporários residuais do sistema e do usuário. |
| **Limpar Arquivos Prefetch** | Exclui arquivos de pré-carregamento da pasta Windows Prefetch. |
| **Esvaziar Lixeira** | Remove permanentemente todos os arquivos contidos na Lixeira. |
| **Limpar Cache do Windows Update** | Remove arquivos residuais de download e instalação do Windows Update. |
| **Limpar Cache de Miniaturas** | Remove imagens em miniatura salvas em cache pelo Explorador de Arquivos. |
| **Limpar Relatórios de Erros e Dumps** | Exclui relatórios de erros, logs de diagnóstico e arquivos crash dump. |
| **Limpeza Profunda de Cache de Shaders** | Limpa shaders compilados antigos (DirectX, NVIDIA, AMD, Intel e Steam) para liberar espaço e evitar micro-travamentos em jogos. |
| **Limpar Cache de Navegadores** | Remove apenas arquivos temporários de cache (Chrome, Edge, Brave, Opera) sem apagar senhas, cookies, logins ou histórico. |
| **Otimizar e Liberar Memória RAM Ociosa** | Libera RAM presa por aplicativos em segundo plano com segurança, sem tocar em jogos, Steam ou Discord. |

### 6. Restauração e Backup

Central de segurança do usuário:
- **Pontos de Restauração do Windows (VSS):** Crie pontos nomeados ou rápidos a qualquer instante, visualize pontos existentes e restaure o sistema caso precise voltar atrás.
- **Reverter Ajustes Aplicados:** Veja todos os ajustes ativos detectados pelo AGB e desfaça individualmente ou todos de uma vez com um clique.

![Pontos de Restauração do Windows](images/screenshots/08a-restauracao-pontos.png)

![Reverter Ajustes Aplicados](images/screenshots/08b-restauracao-reverter.png)

### 7. Gerenciador e Benchmark de DNS

![Gerenciador e Benchmark de DNS](images/screenshots/09-dns.png)

Permite testar e aplicar servidores DNS diretamente nos adaptadores de rede ativos:
- **Teste de Ping em Tempo Real:** Mede a latência atual para o provedor escolhido ou IP customizado.
- **Benchmark Completo (Testar Latência):** Compara todos os provedores suportados automaticamente e destaca o mais rápido para a sua operadora/região.
- **Limpar Cache DNS (Flush DNS):** Executa `ipconfig /flushdns` rapidamente para resolver rotas desatualizadas.
- **Provedores Suportados:**
  - **Cloudflare:** DNS ultra rápido, seguro e totalmente focado na privacidade do usuário. _(Rápido, Foco em Privacidade, Seguro)_
  - **G-Core Gaming:** Rotas e infraestrutura de baixíssima latência otimizadas para jogos online. _(Baixa Latência, Otimizado para Jogos, Anycast)_
  - **Control D Anycast:** DNS moderno de alta velocidade com política estrita de zero registro de logs. _(Sem Logs, Ultra Rápido, Anycast)_
  - **Google:** Serviço DNS global da Google, altamente confiável, estável e veloz. _(Confiável, Rápido, Alta Disponibilidade)_
  - **OpenDNS:** Serviço DNS da Cisco com filtragem de conteúdo e proteção contra phishing. _(Filtro de Conteúdo, Confiável, Segurança)_
  - **Quad9:** Bloqueia domínios maliciosos, sites de phishing e ameaças cibernéticas conhecidas. _(Segurança, Sem Logs, Proteção Malware)_
  - **AdGuard DNS:** DNS com bloqueio integrado de anúncios, rastreadores e proteção de privacidade. _(Bloqueador de Anúncios, Privacidade, Anti-Rastreamento)_
  - **Automatic (DHCP):** Usa os servidores DNS padrão fornecidos pelo seu roteador ou provedor de internet (ISP). _(Padrão, Fornecido pelo Provedor, Sem Configuração)_
- **DNS Personalizado:** Permite definir IPs primário e secundário manuais (IPv4).

### 8. Configurações, Apoio e Reporte de Bugs

![Configurações, Apoio e Reporte de Bugs](images/screenshots/10-configuracoes.png)

- **Personalização & Comportamento:** Escolha entre temas visuais (*Sistema*, *Escuro*, *Claro*), alterne idioma (**PT-BR** / **English**), verifique atualizações no GitHub, configure minimização na bandeja do sistema e limpe backups/caches antigos do app.
- **Apoiar o AGB:** Se o AGB ajudou a melhorar seu PC, você pode contribuir via **PIX** (QR Code / Copia e Cola integrado no app) ou [**Ko-fi**](https://ko-fi.com/victorsalles).
- **Bugs e Sugestões:** Área e modal dedicados para abrir [**Issues no GitHub**](https://github.com/VictorSallesBz/AGB/issues/new/choose) (Reportar Bug ou Solicitar Funcionalidade/Ajuste).
- **Comunidade:** Entre no [**Discord Oficial do AGB**](https://discord.gg/b3HekDzKGS) para tirar dúvidas e conversar com outros usuários.

![Modal Apoiar o AGB — PIX e Ko-fi](images/screenshots/11-apoiar.png)

![Modal Bugs e Sugestões via GitHub](images/screenshots/12-feedback.png)

---

## 📑 Índice dos 66 Ajustes

Clique em qualquer item para ir direto até a explicação dele:

| Ajuste | ID | Categorias | Risco | Reversível | Perfis |
| :--- | :--- | :--- | :---: | :---: | :--- |
| [Relógio em Formato 24 Horas](#24-hour-clock) | `24-hour-clock` | Geral, Aparência | Baixo | Sim | — |
| [Plano de Energia Gamer AGB](#agb-power-plan) | `agb-power-plan` | Desempenho, Jogos (Gaming) | Baixo | Sim | Recomendado, Agressivo |
| [Alinhar Barra de Tarefas à Esquerda](#align-taskbar-left) | `align-taskbar-left` | Geral, Aparência | Baixo | Sim | — |
| [Despoluir o Windows (Debloat)](#debloat-windows) | `debloat-windows` | Desempenho, Privacidade | Baixo | Não | — |
| [Tela Azul Detalhada (BSOD)](#detailed-bsod) | `detailed-bsod` | Geral | Baixo | Sim | — |
| [Desativar Apps da MS Store em Segundo Plano](#disable-background-ms-store-apps) | `disable-background-ms-store-apps` | Desempenho, Privacidade | Baixo | Sim | Agressivo |
| [Desativar Sugestões e Apps Promocionais](#consumer-features) | `consumer-features` | Privacidade | Baixo | Sim | Leve, Recomendado, Agressivo |
| [Desativar Microsoft Copilot](#disable-copilot) | `disable-copilot` | Desempenho, Privacidade | Baixo | Sim | Agressivo |
| [Desativar Isolamento de Núcleo (HVCI)](#disable-core-isolation) | `disable-core-isolation` | Desempenho, Jogos (Gaming) | Baixo | Sim | — |
| [Desativar Proteção em Tempo Real do Defender](#disable-defender-rtp) | `disable-defender-rtp` | Desempenho, Geral | Baixo | Sim | — |
| [Desativar Delivery Optimization (Updates P2P)](#disable-delivery-optimization) | `disable-delivery-optimization` | Rede, Desempenho, Privacidade | Baixo | Sim | Leve, Recomendado, Agressivo |
| [Desativar Pré-carregamento do Microsoft Edge](#disable-edge-pre-launching) | `disable-edge-pre-launching` | Sistema, Privacidade | Baixo | Sim | Leve, Recomendado, Agressivo |
| [Desativar Inicialização Rápida (Fast Startup)](#disable-fast-startup) | `disable-fast-startup` | Sistema, Desempenho | Baixo | Sim | Recomendado, Agressivo |
| [Desativar Xbox Game Bar](#disable-gamebar) | `disable-gamebar` | Desempenho | Baixo | Sim | — |
| [Desativar Hibernação do Sistema](#disable-hibernation) | `disable-hibernation` | Desempenho, Geral | Baixo | Sim | — |
| [Desativar Rastreamento de Localização](#disable-location-tracking) | `disable-location-tracking` | Privacidade | Baixo | Sim | Leve, Recomendado, Agressivo |
| [Desativar Tela de Bloqueio](#disable-lockscreen) | `disable-lockscreen` | Aparência, Geral | Baixo | Sim | — |
| [Desativar Desfoque da Tela de Bloqueio](#disable-lockscreen-blur) | `disable-lockscreen-blur` | Aparência, Geral | Baixo | Sim | — |
| [Desativar Dicas na Tela de Bloqueio](#disable-lockscreen-tips) | `disable-lockscreen-tips` | Geral | Baixo | Sim | — |
| [Desativar Compressão de Memória RAM](#disable-memory-compression) | `disable-memory-compression` | Desempenho, Jogos (Gaming) | Baixo | Sim | — |
| [Desativar Aceleração do Mouse (Entrada 1:1)](#disable-mouse-acceleration) | `disable-mouse-acceleration` | Desempenho, Jogos (Gaming) | Baixo | Sim | Leve, Recomendado, Agressivo |
| [Desativar Multiplane Overlay (MPO)](#disable-mpo) | `disable-mpo` | Desempenho, Jogos (Gaming), GPU (Placa de Vídeo) | Baixo | Sim | Recomendado, Agressivo |
| [Desativar Avisos de Segurança RDP](#disable-rdp-warnings) | `disable-rdp-warnings` | Geral, Privacidade | Baixo | Sim | — |
| [Desativar Windows Recall](#disable-windows-recall) | `disable-windows-recall` | Privacidade | Baixo | Sim | Agressivo |
| [Desativar Armazenamento Reservado](#disable-reserved-storage) | `disable-reserved-storage` | Sistema, Desempenho | Baixo | Sim | — |
| [Desativar Sugestões da Store na Busca](#disable-store-search-suggestions) | `disable-store-search-suggestions` | Aparência, Privacidade | Baixo | Sim | — |
| [Desativar SysMain (Superfetch)](#disable-sysmain) | `disable-sysmain` | Desempenho, Sistema | Baixo | Sim | — |
| [Ocultar Pesquisa da Barra de Tarefas](#disable-taskbar-search) | `disable-taskbar-search` | Geral, Aparência | Baixo | Sim | — |
| [Desativar Telemetria e Coleta de Dados](#disable-telemetry) | `disable-telemetry` | Privacidade, Desempenho | Baixo | Sim | Leve, Recomendado, Agressivo |
| [Desativar Túnel IPv6 Teredo](#disable-teredo) | `disable-teredo` | Rede, Jogos (Gaming) | Baixo | Sim | — |
| [Desativar Suspensão Seletiva de USB](#disable-usb-selective-suspend) | `disable-usb-selective-suspend` | Desempenho, Jogos (Gaming) | Baixo | Sim | Recomendado, Agressivo |
| [Desativar Sensor de Wi-Fi (Wi-Fi Sense)](#disable-wifi-sense) | `disable-wifi-sense` | Privacidade, Rede, Geral | Baixo | Sim | — |
| [Desativar Serviços Xbox](#disable-xbox-services) | `disable-xbox-services` | Jogos (Gaming), Desempenho | Baixo | Sim | — |
| [Ativar Modo Escuro no Sistema](#enable-dark-mode) | `enable-dark-mode` | Geral, Aparência | Baixo | Sim | — |
| [Ativar 'Finalizar Tarefa' no Botão Direito](#enable-end-task-right-click) | `enable-end-task-right-click` | Geral | Baixo | Sim | Leve, Recomendado, Agressivo |
| [Ativar Modo de Jogo do Windows](#enable-game-mode) | `enable-game-mode` | Geral, Desempenho, Jogos (Gaming) | Baixo | Sim | Leve, Recomendado, Agressivo |
| [Ativar Agendamento de GPU por Hardware (HAGS)](#enable-hags) | `enable-hags` | Desempenho, Jogos (Gaming), GPU (Placa de Vídeo) | Baixo | Sim | Agressivo |
| [Restaurar Visualizador de Fotos Clássico](#enable-legacy-photo-viewer) | `enable-legacy-photo-viewer` | Aparência, Geral | Baixo | Sim | — |
| [Ativar Caminhos Longos (>260 Caracteres)](#enable-long-paths) | `enable-long-paths` | Aparência, Geral, Sistema | Baixo | Sim | — |
| [Ativar Num Lock ao Iniciar](#enable-numlock-on-startup) | `enable-numlock-on-startup` | Aparência, Geral | Baixo | Sim | — |
| [Otimização para Jogos em Modo Janela](#enable-optimization-for-windowed-games) | `enable-optimization-for-windowed-games` | Geral, Desempenho, Jogos (Gaming) | Baixo | Sim | Recomendado, Agressivo |
| [Ocultar Visão de Tarefas e Widgets](#hide-taskview-and-widgets) | `hide-taskview-and-widgets` | Geral, Aparência | Baixo | Sim | — |
| [Maximizar Taxa de Repetição do Teclado](#keyboard-repeat-rate) | `keyboard-repeat-rate` | Jogos (Gaming), Desempenho | Baixo | Sim | Agressivo |
| [Eliminar Atraso de Menus (MenuShowDelay 0)](#menu-show-delay-zero) | `menu-show-delay-zero` | Desempenho, Aparência | Baixo | Sim | Agressivo |
| [Otimizar Configurações AMD Radeon](#optimize-amd-settings) | `optimize-amd-settings` | Desempenho, GPU (Placa de Vídeo), Jogos (Gaming) | Baixo | Sim | Agressivo |
| [Otimizar Desempenho do Discord](#optimize-discord) | `optimize-discord` | Desempenho, Jogos (Gaming), Geral | Baixo | Sim | Agressivo |
| [Otimizar Input Lag (Mouse e Teclado)](#optimize-input-lag) | `optimize-input-lag` | Desempenho, Jogos (Gaming) | Baixo | Sim | Recomendado, Agressivo |
| [Otimizar Configurações de Rede (TCP/IP)](#optimize-network-settings) | `optimize-network-settings` | Rede, Jogos (Gaming) | Baixo | Sim | Recomendado, Agressivo |
| [Otimizar Sistema de Arquivos NTFS](#optimize-ntfs) | `optimize-ntfs` | Desempenho, Sistema | Baixo | Sim | Recomendado, Agressivo |
| [Otimizar Configurações NVIDIA](#optimize-nvidia-settings) | `optimize-nvidia-settings` | Desempenho, GPU (Placa de Vídeo), Jogos (Gaming) | Baixo | Sim | Agressivo |
| [Otimizar Efeitos Visuais do Windows](#optimize-visual-effects) | `optimize-visual-effects` | Desempenho, Aparência | Baixo | Sim | — |
| [Preferir IPv4 em vez de IPv6](#prefer-ipv4-over-ipv6) | `prefer-ipv4-over-ipv6` | Rede, Jogos (Gaming) | Baixo | Sim | Agressivo |
| [Abrir Explorer em 'Este Computador' e Ocultar Galeria](#remove-explorer-home-and-gallery) | `remove-explorer-home-and-gallery` | Aparência, Geral | Baixo | Sim | — |
| [Remover Aplicativos Xbox Integrados](#remove-gaming-apps) | `remove-gaming-apps` | Desempenho, Privacidade | Baixo | Não | — |
| [Remover Integração com Bing e Busca Web](#remove-ms-bing-integration) | `remove-ms-bing-integration` | Privacidade, Desempenho | Baixo | Sim | Leve, Recomendado, Agressivo |
| [Remover Microsoft OneDrive](#remove-onedrive) | `remove-onedrive` | Desempenho, Geral, Privacidade | Baixo | Sim | — |
| [Restaurar Menu de Contexto Clássico do Windows 10](#revert-context-menu) | `revert-context-menu` | Geral, Aparência | Baixo | Sim | — |
| [Reverter Layout do Menu Iniciar e Ocultar Recomendações](#revert-start-menu-layout) | `revert-start-menu-layout` | Aparência, Geral | Baixo | Sim | — |
| [Definir PowerShell 7 como Padrão](#set-powershell7-default) | `set-powershell7-default` | Geral | Baixo | Sim | — |
| [Configurar Serviços Desnecessários para Manual](#set-services-to-manual) | `set-services-to-manual` | Desempenho, Jogos (Gaming) | Baixo | Sim | Agressivo |
| [Prioridade de CPU para Aplicativos em Foco](#set-win32-priority-separation) | `set-win32-priority-separation` | Desempenho | Baixo | Sim | Recomendado, Agressivo |
| [Mostrar Extensões de Arquivo](#show-file-extensions) | `show-file-extensions` | Aparência, Geral | Baixo | Sim | — |
| [Mostrar Arquivos e Pastas Ocultos](#show-hidden-files) | `show-hidden-files` | Aparência, Geral | Baixo | Sim | — |
| [Mostrar Segundos no Relógio da Barra de Tarefas](#show-seconds-in-taskbar-clock) | `show-seconds-in-taskbar-clock` | Aparência, Geral | Baixo | Sim | — |
| [Plano de Energia Desempenho Máximo](#ultimate-performance-plan) | `ultimate-performance-plan` | Desempenho, Jogos (Gaming) | Baixo | Sim | — |
| [Desativar WPBT (Bloatware da Placa-Mãe)](#wpbt) | `wpbt` | Privacidade | Baixo | Sim | — |

---

## 📖 Manual Completo dos 66 Ajustes

> 💡 Cada ajuste abaixo tem uma âncora com seu ID. Ao clicar em **Manual** dentro do AGB, esta página abre direto no ajuste correspondente.

<a id="24-hour-clock"></a>
#### Relógio em Formato 24 Horas (`24-hour-clock`)

**Categoria:** Geral, Aparência · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Altera o formato de exibição do relógio do Windows para 24 horas (ex: 14:00 em vez de 2:00 PM).
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="agb-power-plan"></a>
#### Plano de Energia Gamer AGB (`agb-power-plan`)

**Categoria:** Desempenho, Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Recomendado, Agressivo · ⭐ **Recomendado**

- **O que faz:** Plano de energia exclusivo do AGB que desativa o Core Parking, mantém o boost máximo de CPU e desativa a economia do PCIe para estabilizar o 1% Low FPS em jogos.
- **Como funciona:** Configura planos e parâmetros avançados de energia via `powercfg`.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="align-taskbar-left"></a>
#### Alinhar Barra de Tarefas à Esquerda (`align-taskbar-left`)

**Categoria:** Geral, Aparência · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Alinha os ícones e o botão iniciar da barra de tarefas para o lado esquerdo da tela como no Windows 10.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="debloat-windows"></a>
#### Despoluir o Windows (Debloat) (`debloat-windows`)

**Categoria:** Desempenho, Privacidade · **Risco:** Baixo · **Reversível:** Não · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual) · ⭐ **Recomendado**

- **O que faz:** Abre a lista de aplicativos integrados e bloatwares do Windows para você escolher quais deseja desinstalar.
- **Como funciona:** Remove ou ajusta pacotes UWP / arquivos residuais.
- **Uso:** Evite se você usa **PC Game Pass** ou jogos da Microsoft Store que dependem dos serviços Xbox.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="detailed-bsod"></a>
#### Tela Azul Detalhada (BSOD) (`detailed-bsod`)

**Categoria:** Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Adiciona informações técnicas completas e código legível à Tela Azul da Morte (BSOD).
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-background-ms-store-apps"></a>
#### Desativar Apps da MS Store em Segundo Plano (`disable-background-ms-store-apps`)

**Categoria:** Desempenho, Privacidade · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Agressivo

- **O que faz:** Impede que aplicativos da Microsoft Store fiquem rodando em segundo plano consumindo CPU e RAM.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="consumer-features"></a>
<a id="disable-consumer-features"></a>
#### Desativar Sugestões e Apps Promocionais (`consumer-features`)

**Categoria:** Privacidade · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Leve, Recomendado, Agressivo

- **O que faz:** Impede que o Windows instale automaticamente jogos, aplicativos patrocinados e atalhos da Microsoft Store.
- **Detalhes:** Desativar sugestões e recursos promocionais pode tornar alguns aplicativos padrão (ex: Vincular ao Celular) inacessíveis. Deseja continuar?
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).
- **Atenção:** Alguns aplicativos padrão podem ficar inacessíveis.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-copilot"></a>
#### Desativar Microsoft Copilot (`disable-copilot`)

**Categoria:** Desempenho, Privacidade · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Agressivo · ⭐ **Recomendado**

- **O que faz:** Desativa o assistente Microsoft Copilot e remove seus atalhos e processos integrados ao Windows.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`); Remove ou ajusta pacotes UWP / arquivos residuais.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-core-isolation"></a>
#### Desativar Isolamento de Núcleo (HVCI) (`disable-core-isolation`)

**Categoria:** Desempenho, Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Desativa a Integridade de Memória (HVCI) para aumentar a taxa de quadros (FPS) em jogos sem anti-cheat de kernel.
- **Detalhes:** **Quando usar:** Em jogos sem exigência de HVCI para reduzir overhead de virtualização na CPU. **Quando NÃO usar:** Se você joga **CS2 na FACEIT / GamersClub** ou **Valorant (Vanguard)** — essas plataformas frequentemente exigem Integridade de Memória (HVCI) ativada.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).
- **Atenção:** Quando usar: jogos sem anti-cheat rigoroso. Quando NÃO usar: CS2 na FACEIT/GamersClub ou Valorant (Vanguard), pois exigem HVCI ativo.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-defender-rtp"></a>
#### Desativar Proteção em Tempo Real do Defender (`disable-defender-rtp`)

**Categoria:** Desempenho, Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Desativa a verificação contínua em segundo plano do Microsoft Defender para liberar uso de disco e CPU.
- **Detalhes:** **Quando usar:** Apenas temporariamente em máquinas com pouca RAM/CPU ou se já utilizar outro antivírus. **Quando NÃO usar:** No uso diário sem outro antivírus instalado. Para aplicar no Windows 10/11, desative primeiro a **Proteção contra Violações** em **Segurança do Windows -> Proteção contra vírus e ameaças -> Gerenciar configurações**.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`); Ajusta políticas do Microsoft Defender.
- **Atenção:** Quando usar: apenas temporariamente em PCs fracos ou com outro antivírus. Quando NÃO usar: uso diário sem proteção alternativa.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-delivery-optimization"></a>
#### Desativar Delivery Optimization (Updates P2P) (`disable-delivery-optimization`)

**Categoria:** Rede, Desempenho, Privacidade · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Leve, Recomendado, Agressivo · ⭐ **Recomendado**

- **O que faz:** Impede que o Windows use sua banda de upload para enviar atualizações a outros computadores na internet, reduzindo picos de ping.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).
- **Observação:** Se notar qualquer problema em VPNs ou rede de trabalho, basta reverter este ajuste.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-edge-pre-launching"></a>
#### Desativar Pré-carregamento do Microsoft Edge (`disable-edge-pre-launching`)

**Categoria:** Sistema, Privacidade · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Leve, Recomendado, Agressivo · ⭐ **Recomendado**

- **O que faz:** Impede que o Edge inicie automaticamente processos em segundo plano ao ligar o Windows.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-fast-startup"></a>
#### Desativar Inicialização Rápida (Fast Startup) (`disable-fast-startup`)

**Categoria:** Sistema, Desempenho · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Recomendado, Agressivo · ⭐ **Recomendado**

- **O que faz:** Garante reinicialização limpa dos drivers, GPU e placa de rede ao desligar o PC, evitando perda de desempenho acumulada.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-gamebar"></a>
#### Desativar Xbox Game Bar (`disable-gamebar`)

**Categoria:** Desempenho · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Desativa as sobreposições, gravação em segundo plano e processos da Game Bar para ganhar desempenho em jogos.
- **Detalhes:** **Quando usar:** Em processadores Intel ou Ryzen não-X3D se quiser remover overlay e captura em segundo plano. **Quando NÃO usar:** Se você possui um **AMD Ryzen X3D** (ex: 7800X3D, 7950X3D, 9800X3D), pois o Windows usa a Game Bar para alocar os núcleos com cache 3D aos jogos.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`); Remove ou ajusta pacotes UWP / arquivos residuais.
- **Atenção:** Quando usar: CPUs Intel ou Ryzen comuns. Quando NÃO usar: Ryzen X3D (5800X3D/7800X3D/9800X3D), pois usam Game Bar para o 3D V-Cache.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-hibernation"></a>
#### Desativar Hibernação do Sistema (`disable-hibernation`)

**Categoria:** Desempenho, Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Desativa a hibernação e exclui o arquivo hiberfil.sys, liberando vários gigabytes de espaço no disco C:.
- **Como funciona:** Configura planos e parâmetros avançados de energia via `powercfg`.
- **Atenção:** Quando usar: PCs de mesa (Desktops) para liberar GB do SSD. Quando NÃO usar: notebooks que dependem da hibernação ao fechar a tampa.
- **Uso:** Bom para desktops para liberar espaço do arquivo `hiberfil.sys`. Em notebooks, evite se você usa o modo Hibernar.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-location-tracking"></a>
#### Desativar Rastreamento de Localização (`disable-location-tracking`)

**Categoria:** Privacidade · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Leve, Recomendado, Agressivo · ⭐ **Recomendado**

- **O que faz:** Bloqueia o acesso a dados de localização geográfica pelo Windows e aplicativos em segundo plano.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`); Altera o tipo de inicialização ou estado de Serviços do Windows.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-lockscreen"></a>
#### Desativar Tela de Bloqueio (`disable-lockscreen`)

**Categoria:** Aparência, Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Pula a imagem de capa da tela de bloqueio e vai direto para o campo de senha ou PIN.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-lockscreen-blur"></a>
#### Desativar Desfoque da Tela de Bloqueio (`disable-lockscreen-blur`)

**Categoria:** Aparência, Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Remove o efeito de desfoque (blur) acrílico na tela de login/bloqueio para resposta instantânea.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-lockscreen-tips"></a>
#### Desativar Dicas na Tela de Bloqueio (`disable-lockscreen-tips`)

**Categoria:** Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Desativa fatos engraçados, dicas, truques e sugestões na tela de bloqueio do Windows.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-memory-compression"></a>
#### Desativar Compressão de Memória RAM (`disable-memory-compression`)

**Categoria:** Desempenho, Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Impede que a CPU gaste ciclos comprimindo páginas ociosas de RAM em segundo plano durante jogos.
- **Detalhes:** **Quando usar:** Apenas em PCs com **16 GB de RAM ou mais**, evitando uso de CPU comprimindo RAM durante jogos como CS2. **Quando NÃO usar:** Em sistemas com **8 GB de RAM ou menos**, onde a compressão evita falta de memória. Requer reinicialização.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).
- **Atenção:** Quando usar: PCs com 16 GB ou mais de RAM. Quando NÃO usar: PCs com 8 GB de RAM ou menos.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-mouse-acceleration"></a>
#### Desativar Aceleração do Mouse (Entrada 1:1) (`disable-mouse-acceleration`)

**Categoria:** Desempenho, Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Leve, Recomendado, Agressivo

- **O que faz:** Remove a aceleração não linear do cursor para proporcionar precisão absoluta de mira nos jogos.
- **Detalhes:** Este ajuste substitui a curva de aceleração de ponteiro padrão do Windows por uma curva linear 1:1, proporcionando precisão absoluta em jogos.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-mpo"></a>
#### Desativar Multiplane Overlay (MPO) (`disable-mpo`)

**Categoria:** Desempenho, Jogos (Gaming), GPU (Placa de Vídeo) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Recomendado, Agressivo · ⭐ **Recomendado**

- **O que faz:** Desativa o MPO do DWM para corrigir piscadas, telas pretas e micro-travamentos em jogos com placas NVIDIA e AMD.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-rdp-warnings"></a>
#### Desativar Avisos de Segurança RDP (`disable-rdp-warnings`)

**Categoria:** Geral, Privacidade · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Oculta os avisos de segurança ao abrir arquivos de Área de Trabalho Remota (.rdp) não assinados.
- **Detalhes:** Desativa os avisos de segurança da Microsoft para arquivos de Área de Trabalho Remota (.rdp). Arquivos RDP não assinados conectarão diretamente sem alerta de confirmação.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).
- **Atenção:** Arquivos RDP podem ser usados em ataques; recomenda-se manter esta proteção ativada.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-windows-recall"></a>
<a id="disable-recall"></a>
#### Desativar Windows Recall (`disable-windows-recall`)

**Categoria:** Privacidade · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Agressivo

- **O que faz:** Desativa a captura contínua de screenshots e análise de IA do recurso Recall no Windows 11.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-reserved-storage"></a>
#### Desativar Armazenamento Reservado (`disable-reserved-storage`)

**Categoria:** Sistema, Desempenho · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Libera os 7 a 10 GB de espaço em disco que o Windows reserva permanentemente para atualizações e arquivos temporários.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).
- **Atenção:** Recomendado para SSDs onde você deseja liberar 7 a 10 GB reservados pelo Windows.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-store-search-suggestions"></a>
#### Desativar Sugestões da Store na Busca (`disable-store-search-suggestions`)

**Categoria:** Aparência, Privacidade · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Impede que a barra de busca e o Menu Iniciar sugiram aplicativos da Microsoft Store.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-sysmain"></a>
#### Desativar SysMain (Superfetch) (`disable-sysmain`)

**Categoria:** Desempenho, Sistema · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Para e desativa o serviço SysMain, reduzindo leituras/gravações em segundo plano e liberando memória RAM.
- **Detalhes:** **Quando usar:** Somente se o Windows estiver em um **SSD ou NVMe** (evita leituras em segundo plano e economiza RAM). **Quando NÃO usar:** Se o Windows estiver em um **HD mecânico (HDD)**, onde o SysMain ajuda no carregamento de programas.
- **Como funciona:** Altera o tipo de inicialização ou estado de Serviços do Windows.
- **Atenção:** Quando usar: Windows instalado em SSD ou NVMe. Quando NÃO usar: sistema instalado em HD mecânico (HDD).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-taskbar-search"></a>
#### Ocultar Pesquisa da Barra de Tarefas (`disable-taskbar-search`)

**Categoria:** Geral, Aparência · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Oculta a caixa ou ícone de pesquisa da barra de tarefas para liberar espaço e recursos visuais.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-telemetry"></a>
#### Desativar Telemetria e Coleta de Dados (`disable-telemetry`)

**Categoria:** Privacidade, Desempenho · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Leve, Recomendado, Agressivo · ⭐ **Recomendado**

- **O que faz:** Bloqueia o envio de relatórios de uso e dados de diagnóstico para os servidores da Microsoft.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`); Altera o tipo de inicialização ou estado de Serviços do Windows; Remove ou ajusta pacotes UWP / arquivos residuais; Ajusta políticas do Microsoft Defender.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-teredo"></a>
#### Desativar Túnel IPv6 Teredo (`disable-teredo`)

**Categoria:** Rede, Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Desliga o tunelamento legado Teredo que pode adicionar latência de rede em alguns roteadores.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`); Ajusta parâmetros da pilha de rede TCP/IP ou do adaptador de rede.
- **Atenção:** Quando usar: jogos dedicados (CS2, Valorant, Steam). Quando NÃO usar: se usar chat Xbox Party ou multiplayer da Microsoft Store.
- **Observação:** Se notar qualquer problema em VPNs ou rede de trabalho, basta reverter este ajuste.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-usb-selective-suspend"></a>
#### Desativar Suspensão Seletiva de USB (`disable-usb-selective-suspend`)

**Categoria:** Desempenho, Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Recomendado, Agressivo · ⭐ **Recomendado**

- **O que faz:** Impede que o Windows suspenda portas USB para economizar energia, evitando atraso ao despertar mouses, teclados e dongles sem fio.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`); Configura planos e parâmetros avançados de energia via `powercfg`.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-wifi-sense"></a>
#### Desativar Sensor de Wi-Fi (Wi-Fi Sense) (`disable-wifi-sense`)

**Categoria:** Privacidade, Rede, Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Desativa o compartilhamento de redes Wi-Fi com contatos e a conexão automática a pontos de acesso abertos.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).
- **Observação:** Se notar qualquer problema em VPNs ou rede de trabalho, basta reverter este ajuste.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="disable-xbox-services"></a>
#### Desativar Serviços Xbox (`disable-xbox-services`)

**Categoria:** Jogos (Gaming), Desempenho · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Desativa os serviços em segundo plano do ecossistema Xbox sem desinstalar os aplicativos.
- **Detalhes:** **Quando usar:** Recomendado para quem joga apenas na Steam, Epic ou Riot e quer economizar RAM desativando serviços Xbox em segundo plano. **Quando NÃO usar:** Não aplique se você utiliza **PC Game Pass**, **Xbox App** ou jogos multiplayer da Microsoft Store.
- **Como funciona:** Altera o tipo de inicialização ou estado de Serviços do Windows.
- **Atenção:** Quando usar: jogadores só de Steam/Riot/Epic. Quando NÃO usar: quem usa PC Game Pass, Xbox App ou adaptador sem fio Xbox.
- **Uso:** Evite se você usa **PC Game Pass** ou jogos da Microsoft Store que dependem dos serviços Xbox.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="enable-dark-mode"></a>
#### Ativar Modo Escuro no Sistema (`enable-dark-mode`)

**Categoria:** Geral, Aparência · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Aplica o tema escuro nativo em todo o Windows e nos aplicativos compatíveis.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="enable-end-task-right-click"></a>
#### Ativar 'Finalizar Tarefa' no Botão Direito (`enable-end-task-right-click`)

**Categoria:** Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Leve, Recomendado, Agressivo · ⭐ **Recomendado**

- **O que faz:** Adiciona a opção rápida de finalizar processos travados diretamente pelo menu de contexto da barra de tarefas.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="enable-game-mode"></a>
#### Ativar Modo de Jogo do Windows (`enable-game-mode`)

**Categoria:** Geral, Desempenho, Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Leve, Recomendado, Agressivo

- **O que faz:** Prioriza a alocação de threads da CPU e GPU para os jogos em execução, reduzindo processos concorrentes.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="enable-hags"></a>
#### Ativar Agendamento de GPU por Hardware (HAGS) (`enable-hags`)

**Categoria:** Desempenho, Jogos (Gaming), GPU (Placa de Vídeo) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Agressivo

- **O que faz:** Delega o gerenciamento de memória de vídeo diretamente à GPU, reduzindo latência e habilitando Frame Generation.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).
- **Atenção:** Quando usar: GPUs RTX/RX modernas (necessário para DLSS Frame Gen). Quando NÃO usar: se notar engasgos no OBS ou em GPUs antigas (GTX/RX 500).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="enable-legacy-photo-viewer"></a>
#### Restaurar Visualizador de Fotos Clássico (`enable-legacy-photo-viewer`)

**Categoria:** Aparência, Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Restaura o clássico e ultrarrápido Visualizador de Fotos do Windows 7 para abrir imagens instantaneamente.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="enable-long-paths"></a>
#### Ativar Caminhos Longos (>260 Caracteres) (`enable-long-paths`)

**Categoria:** Aparência, Geral, Sistema · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Remove o limite clássico de 260 caracteres em caminhos de pastas e arquivos no Windows.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="enable-numlock-on-startup"></a>
#### Ativar Num Lock ao Iniciar (`enable-numlock-on-startup`)

**Categoria:** Aparência, Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Ativa automaticamente a tecla Num Lock ao ligar o computador e na tela de login.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="enable-optimization-for-windowed-games"></a>
#### Otimização para Jogos em Modo Janela (`enable-optimization-for-windowed-games`)

**Categoria:** Geral, Desempenho, Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Recomendado, Agressivo

- **O que faz:** Aplica o modelo moderno de apresentação DirectX para reduzir latência e habilitar Auto HDR em jogos em modo janela.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="hide-taskview-and-widgets"></a>
#### Ocultar Visão de Tarefas e Widgets (`hide-taskview-and-widgets`)

**Categoria:** Geral, Aparência · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Remove os ícones de Widgets (Notícias/Tempo) e Visão de Tarefas da barra de tarefas para liberar RAM.
- **Detalhes:** Este ajuste removerá completamente o recurso de Widgets do Windows. Para restaurá-lo posteriormente se desejar, basta executar no terminal: `winget install 9MSSGKG348SP` ou pesquisar por 'Windows Web Experience Pack' na Microsoft Store.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`); Remove ou ajusta pacotes UWP / arquivos residuais.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="keyboard-repeat-rate"></a>
#### Maximizar Taxa de Repetição do Teclado (`keyboard-repeat-rate`)

**Categoria:** Jogos (Gaming), Desempenho · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Agressivo

- **O que faz:** Reduz ao mínimo o atraso inicial e maximiza a velocidade de repetição de teclas no Windows.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="menu-show-delay-zero"></a>
#### Eliminar Atraso de Menus (MenuShowDelay 0) (`menu-show-delay-zero`)

**Categoria:** Desempenho, Aparência · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Agressivo

- **O que faz:** Reduz o atraso de abertura de menus de contexto do Windows para 0ms, tornando o sistema instantâneo.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="optimize-amd-settings"></a>
#### Otimizar Configurações AMD Radeon (`optimize-amd-settings`)

**Categoria:** Desempenho, GPU (Placa de Vídeo), Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Agressivo

- **O que faz:** Ajusta configurações de registro do driver AMD Radeon para reduzir micro-stutters, otimizar tesselação e melhorar o frame pacing em jogos.
- **Detalhes:** Este ajuste otimiza as configurações do driver AMD Radeon no registro: desativa o ULPS para eliminar quedas bruscas de clock e micro-stutters, habilita o Shader Cache e configura a fila de quadros (Flip Queue) para menor latência.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).
- **Uso:** Apenas para placas **AMD Radeon**.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="optimize-discord"></a>
#### Otimizar Desempenho do Discord (`optimize-discord`)

**Categoria:** Desempenho, Jogos (Gaming), Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Agressivo

- **O que faz:** Desativa aceleração de hardware e o hook de Overlay do Discord, encerra instâncias ativas e purga caches e telemetria.
- **Detalhes:** Este ajuste otimiza o Discord e limpa arquivos residuais: - Encerra instâncias em segundo plano antes de aplicar para evitar bloqueios; - Desativa a Aceleração de Hardware (libera 100% da GPU e VRAM para jogos); - Desativa o hook de Overlay no jogo (eliminando micro-stutters e quedas de FPS); - Desativa a inicialização automática com o Windows; - Ativa minimizar para a bandeja; - Limpa os caches Web/GPU, relatórios do Crashpad e logs de telemetria.
- **Como funciona:** Remove ou ajusta pacotes UWP / arquivos residuais.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="optimize-input-lag"></a>
#### Otimizar Input Lag (Mouse e Teclado) (`optimize-input-lag`)

**Categoria:** Desempenho, Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Recomendado, Agressivo · ⭐ **Recomendado**

- **O que faz:** Ajusta a fila de buffer HID para 64 (seguro para mouses de 1000Hz–8000Hz) e desativa travas de acessibilidade para menor latência de entrada.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="optimize-network-settings"></a>
#### Otimizar Configurações de Rede (TCP/IP) (`optimize-network-settings`)

**Categoria:** Rede, Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Recomendado, Agressivo

- **O que faz:** Ajusta parâmetros avançados de TCP/IP, CongestionProvider e buffers de rede para menor latência e maior estabilidade.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`); Ajusta parâmetros da pilha de rede TCP/IP ou do adaptador de rede.
- **Observação:** Se notar qualquer problema em VPNs ou rede de trabalho, basta reverter este ajuste.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="optimize-ntfs"></a>
#### Otimizar Sistema de Arquivos NTFS (`optimize-ntfs`)

**Categoria:** Desempenho, Sistema · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Recomendado, Agressivo · ⭐ **Recomendado**

- **O que faz:** Desativa a criação de nomes curtos 8.3 e carimbos de último acesso no NTFS para acelerar o acesso ao disco.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`); Configura atributos do sistema de arquivos NTFS via `fsutil`.
- **Atenção:** Ideal para SSDs e NVMe: elimina gravações de último acesso e criação de nomes curtos 8.3.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="optimize-nvidia-settings"></a>
#### Otimizar Configurações NVIDIA (`optimize-nvidia-settings`)

**Categoria:** Desempenho, GPU (Placa de Vídeo), Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Agressivo

- **O que faz:** Configura o Painel NVIDIA para Desempenho Máximo, Low Latency Mode e Shader Cache Ilimitado.
- **Detalhes:** Este ajuste define as configurações ideais de desempenho e baixa latência no registro da NVIDIA. Você pode reverter essas alterações a qualquer momento abrindo o Painel de Controle da NVIDIA (certifique-se de abrir o painel ao menos uma vez) e clicando em 'Restaurar Padrões'.
- **Como funciona:** Aplica configurações de sistema diretamente via script PowerShell auditável.
- **Uso:** Apenas para placas **NVIDIA GeForce**.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="optimize-visual-effects"></a>
#### Otimizar Efeitos Visuais do Windows (`optimize-visual-effects`)

**Categoria:** Desempenho, Aparência · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Desativa animações pesadas e efeitos visuais supérfluos mantendo a renderização nítida de fontes.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="prefer-ipv4-over-ipv6"></a>
#### Preferir IPv4 em vez de IPv6 (`prefer-ipv4-over-ipv6`)

**Categoria:** Rede, Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Agressivo

- **O que faz:** Faz o Windows priorizar conexões IPv4 sem desativar o IPv6, evitando lentidão de handshake e sem quebrar recursos modernos.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).
- **Atenção:** Prioriza conexões IPv4 sem desativar o IPv6, evitando quebra de serviços do Windows.
- **Observação:** Se notar qualquer problema em VPNs ou rede de trabalho, basta reverter este ajuste.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="remove-explorer-home-and-gallery"></a>
#### Abrir Explorer em 'Este Computador' e Ocultar Galeria (`remove-explorer-home-and-gallery`)

**Categoria:** Aparência, Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Configura o Explorador de Arquivos para abrir direto em 'Este Computador' e oculta a seção Galeria da barra lateral.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="remove-gaming-apps"></a>
#### Remover Aplicativos Xbox Integrados (`remove-gaming-apps`)

**Categoria:** Desempenho, Privacidade · **Risco:** Baixo · **Reversível:** Não · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Remove os aplicativos da Xbox Live e pacotes de jogos secundários pré-instalados pelo Windows.
- **Detalhes:** **Quando usar:** Apenas se você nunca utiliza Xbox App/Game Pass e deseja remover permanentemente esses pacotes. **Quando NÃO usar:** Não use em processadores **AMD Ryzen X3D** (ex: 7800X3D, 9800X3D) ou se você joga no **PC Game Pass**. Para reinstalar depois, pesquise por 'Xbox' e 'Xbox Game Bar' na Microsoft Store.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`); Remove ou ajusta pacotes UWP / arquivos residuais.
- **Atenção:** Quando usar: só se não usa Game Pass. Quando NÃO usar: CPUs AMD Ryzen X3D ou usuários de PC Game Pass / Xbox App.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="remove-ms-bing-integration"></a>
#### Remover Integração com Bing e Busca Web (`remove-ms-bing-integration`)

**Categoria:** Privacidade, Desempenho · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Leve, Recomendado, Agressivo

- **O que faz:** Remove resultados do Bing na barra de pesquisa do Windows e desativa a busca na web no menu Iniciar.
- **Detalhes:** Remove todos os aplicativos integrados ao Bing (Notícias, Clima, Finanças) e desativa a pesquisa na web dentro da barra de busca do Windows. Para restaurar os apps posteriormente, você pode reinstalá-los pela Microsoft Store.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`); Remove ou ajusta pacotes UWP / arquivos residuais.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="remove-onedrive"></a>
#### Remover Microsoft OneDrive (`remove-onedrive`)

**Categoria:** Desempenho, Geral, Privacidade · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Desinstala completamente o cliente Microsoft OneDrive e impede sua inicialização com o sistema.
- **Detalhes:** **Quando usar:** Se você não usa sincronização do OneDrive e quer parar seus processos de inicialização. **Quando NÃO usar:** Se suas pastas Área de Trabalho ou Documentos estão sincronizadas exclusivamente no OneDrive. Os arquivos locais serão movidos para sua pasta de usuário. É possível reinstalar pelo site oficial da Microsoft.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`); Remove ou ajusta pacotes UWP / arquivos residuais.
- **Atenção:** Quando usar: se não usa nuvem Microsoft. Quando NÃO usar: se Área de Trabalho/Documentos dependem de backup automático no OneDrive.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="revert-context-menu"></a>
#### Restaurar Menu de Contexto Clássico do Windows 10 (`revert-context-menu`)

**Categoria:** Geral, Aparência · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual) · ⭐ **Recomendado**

- **O que faz:** Restaura o menu de clique com botão direito clássico e completo no Windows 11, sem o botão 'Mostrar mais opções'.
- **Como funciona:** Aplica configurações de sistema diretamente via script PowerShell auditável.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="revert-start-menu-layout"></a>
#### Reverter Layout do Menu Iniciar e Ocultar Recomendações (`revert-start-menu-layout`)

**Categoria:** Aparência, Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Oculta a seção de arquivos/apps recomendados e simplifica o layout do Menu Iniciar do Windows 11.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="set-powershell7-default"></a>
#### Definir PowerShell 7 como Padrão (`set-powershell7-default`)

**Categoria:** Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Define o PowerShell 7 moderno como perfil padrão no Windows Terminal (instala o PS7 se ausente).
- **Detalhes:** Este ajuste alterará o perfil padrão do Windows Terminal para o PowerShell 7. Caso o PowerShell 7 ainda não esteja instalado no sistema, ele será baixado e instalado automaticamente.
- **Como funciona:** Remove ou ajusta pacotes UWP / arquivos residuais.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="set-services-to-manual"></a>
#### Configurar Serviços Desnecessários para Manual (`set-services-to-manual`)

**Categoria:** Desempenho, Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Agressivo · ⭐ **Recomendado**

- **O que faz:** Define dezenas de serviços não essenciais do Windows para início manual, liberando centenas de MB de memória RAM.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`); Altera o tipo de inicialização ou estado de Serviços do Windows.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="set-win32-priority-separation"></a>
#### Prioridade de CPU para Aplicativos em Foco (`set-win32-priority-separation`)

**Categoria:** Desempenho · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Recomendado, Agressivo

- **O que faz:** Otimiza a alocação de tempo de processador do Windows para priorizar o aplicativo ou jogo ativo.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="show-file-extensions"></a>
#### Mostrar Extensões de Arquivo (`show-file-extensions`)

**Categoria:** Aparência, Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Exibe as extensões reais (.exe, .bat, .jpg, etc.) no Explorador de Arquivos para maior praticidade e segurança.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="show-hidden-files"></a>
#### Mostrar Arquivos e Pastas Ocultos (`show-hidden-files`)

**Categoria:** Aparência, Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Exibe arquivos e pastas ocultos diretamente no Explorador de Arquivos.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="show-seconds-in-taskbar-clock"></a>
<a id="show-seconds-in-system-clock"></a>
#### Mostrar Segundos no Relógio da Barra de Tarefas (`show-seconds-in-taskbar-clock`)

**Categoria:** Aparência, Geral · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Exibe a contagem de segundos ao lado da hora no relógio da barra de tarefas do Windows.
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="ultimate-performance-plan"></a>
#### Plano de Energia Desempenho Máximo (`ultimate-performance-plan`)

**Categoria:** Desempenho, Jogos (Gaming) · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual) · ⭐ **Recomendado**

- **O que faz:** Desbloqueia e ativa o plano de energia de Desempenho Máximo do Windows para eliminar economia agressiva de clock.
- **Como funciona:** Configura planos e parâmetros avançados de energia via `powercfg`.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

<a id="wpbt"></a>
#### Desativar WPBT (Bloatware da Placa-Mãe) (`wpbt`)

**Categoria:** Privacidade · **Risco:** Baixo · **Reversível:** Sim · **Reinício recomendado:** Não · **Perfis:** Opcional (Manual)

- **O que faz:** Impede que softwares integrados na BIOS/UEFI de fabricantes sejam instalados automaticamente na inicialização.
- **Detalhes:** A desativação do WPBT (Windows Platform Binary Table) impede que os fabricantes da sua placa-mãe instalem softwares e utilitários automaticamente na inicialização do Windows. Deseja confirmar?
- **Como funciona:** Modifica chaves e valores no Registro do Windows (`HKLM` / `HKCU`).
- **Atenção:** Alguns softwares do fabricante podem não iniciar no boot.

[↑ Voltar ao índice](#-índice-dos-66-ajustes)

---

## 🤝 Suporte, Bugs e Sugestões

- **Bugs e sugestões:** [**GitHub Issues**](https://github.com/VictorSallesBz/AGB/issues/new/choose)
- **Comunidade:** [**Discord do AGB**](https://discord.gg/b3HekDzKGS)
- **Apoiar o projeto:** [**Ko-fi**](https://ko-fi.com/victorsalles) ou via **PIX** na aba **Apoiar o AGB** dentro do programa.
