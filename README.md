<div align="center">

<a href="https://www.npmjs.com/package/rav-xss" target="_blank"><img src="https://img.shields.io/badge/-rav--xss-c40404?style=flat-square&labelColor=c40404&logo=npm&logoColor=white&link=https://www.npmjs.com/package/rav-xss" height="40" /></a>  
<a href="https://www.npmjs.com/package/rav-xss" target="_blank"><img alt="NPM Version" src="https://img.shields.io/npm/v/rav-xss?style=flat-square&logo=npm&labelColor=c40404&color=c40404" height="40" ></a>

---

# 🛡️ RAV XSS
### 🎯 Basic Reflected XSS scanner for bug bounty programs.

[![⭐ Stars](https://img.shields.io/github/stars/ravenastar-js/rav-xss?style=for-the-badge&label=%E2%AD%90%20Stars&color=2d7445&logo=star&logoColor=white&labelColor=444&radius=10)](https://github.com/ravenastar-js/rav-xss/stargazers)
[![🔱 Forks](https://img.shields.io/github/forks/ravenastar-js/rav-xss?style=for-the-badge&label=%F0%9F%94%B1%20Forks&color=2d7445&logo=git&logoColor=white&labelColor=444&radius=10)](https://github.com/ravenastar-js/rav-xss/network/members)
[![👁️ Watchers](https://img.shields.io/github/watchers/ravenastar-js/rav-xss?style=for-the-badge&label=%F0%9F%91%81%EF%B8%8F%20Watchers&color=2d7445&logo=eye&logoColor=white&labelColor=444&radius=10)](https://github.com/ravenastar-js/rav-xss/watchers)
[![📄 License](https://img.shields.io/github/license/ravenastar-js/rav-xss?style=for-the-badge&label=%F0%9F%93%84%20License&color=2d7445&logo=book&logoColor=white&labelColor=444&radius=10)](https://github.com/ravenastar-js/rav-xss/blob/main/LICENSE)
[![🕒 Last Commit](https://img.shields.io/github/last-commit/ravenastar-js/rav-xss?style=for-the-badge&label=%F0%9F%95%92%20Last%20Commit&color=2d7445&logo=clock&logoColor=white&labelColor=444&radius=10)](https://github.com/ravenastar-js/rav-xss/commits/main)
[![📦 Repo Size](https://img.shields.io/github/repo-size/ravenastar-js/rav-xss?style=for-the-badge&label=%F0%9F%93%A6%20Repo%20Size&color=2d7445&logo=database&logoColor=white&labelColor=444&radius=10)](https://github.com/ravenastar-js/rav-xss)
[![⚙️ Node.js](https://img.shields.io/badge/%E2%9A%99%EF%B8%8F%20Node.js-14.0%2B-green?style=for-the-badge&logo=nodedotjs&color=2d7445&logoColor=white&labelColor=444&radius=10)](https://nodejs.org/pt/download)

---

</div>

## 📞 Suporte

Se precisar de ajuda ou quiser falar com a equipe, entre no nosso servidor de suporte:

[![Servidor de Suporte](https://img.shields.io/badge/Servidor%20de%20Suporte-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/FncVNprdgP)

---

## 📋 Índice
- [🛡️ RAV XSS](#️-rav-xss)
    - [🎯 Basic Reflected XSS scanner for bug bounty programs.](#-basic-reflected-xss-scanner-for-bug-bounty-programs)
  - [📞 Suporte](#-suporte)
  - [📋 Índice](#-índice)
  - [🎯 Visão Geral](#-visão-geral)
    - [✨ Características Principais](#-características-principais)
  - [📦 Instalação Rápida](#-instalação-rápida)
  - [🗑️ Desinstalar](#️-desinstalar)
  - [🛠️ Como Usar](#️-como-usar)
    - [Uso Básico](#uso-básico)
    - [Menu Interativo](#menu-interativo)
    - [Modos de Execução](#modos-de-execução)
  - [🎛️ Opções da CLI](#️-opções-da-cli)
  - [📂 Categorias de Payloads](#-categorias-de-payloads)
  - [📁 Abrir Pasta de Relatórios](#-abrir-pasta-de-relatórios)
  - [🧹 Limpar e Sair](#-limpar-e-sair)
  - [🚀 Exemplos Práticos](#-exemplos-práticos)
    - [1. Reconhecimento Básico](#1-reconhecimento-básico)
    - [2. Teste com WAF Bypass](#2-teste-com-waf-bypass)
    - [3. Delay Personalizado](#3-delay-personalizado)
    - [4. Scan com Modo Específico](#4-scan-com-modo-específico)
    - [5. Modo Interativo Completo](#5-modo-interativo-completo)
    - [6. Abrir Relatórios](#6-abrir-relatórios)
  - [📊 Relatórios](#-relatórios)
  - [⚙️ Configuração](#️-configuração)
    - [Wizard Interativo](#wizard-interativo)
    - [Arquivo config.txt](#arquivo-configtxt)
    - [Configuração Padrão (Demo)](#configuração-padrão-demo)
  - [📱 Compatibilidade Termux](#-compatibilidade-termux)
  - [⚠️ Aviso Legal](#️-aviso-legal)
  - [Star History](#star-history)
  - [Feito com 💚 por RavenaStar](#feito-com--por-ravenastar)

---

## 🎯 Visão Geral

O **RAV XSS** é uma ferramenta básica para detecção de Reflected XSS, projetada para programas de Bug Bounty.

### ✨ Características Principais
- 🎯 **Categorias organizadas** — Payloads separados por tipo de ataque
- 🖥️ **Menu interativo** — Seleção de categorias e modos com setas do teclado
- 🔄 **Modos de execução** — Axios (rápido) ou Playwright (navegador real)
- 📱 **Compatível com Termux** — Detecta e adapta automaticamente para Android
- 🌐 **Detecção por reflexão** — Identifica payloads refletidos na resposta HTTP
- 📊 **Relatórios detalhados** — Geração automática de reports
- 📁 **Abrir relatórios** — Comando rápido para abrir a pasta de reports
- 🧹 **Limpeza segura** — Opção de limpar configs e reports com confirmação
- ⚡ **Requisições concorrentes** — Scanning rápido e configurável
- 🎨 **Interface colorida** — Banner ASCII art e boxes estilizados
- 📄 **Suporte a config.txt** — Configuração via arquivo externo

---

## 📦 Instalação Rápida

<details>
<summary>📥 Como instalar o NodeJS?</summary>

- [COMO INSTALAR NODE JS NO WINDOWS?](https://youtu.be/-jft_9PlffQ)
</details>

```
# Instalar globalmente
npm i -g rav-xss          # ✅ Recomendado
npm install -g rav-xss    # ✅ Completo

# Ou usar diretamente com npx
npx rav-xss --url "https://example.com/page?q=[XSS]"

# Clonar e instalar localmente
git clone https://github.com/ravenastar-js/rav-xss.git
cd rav-xss
npm install
```

---

## 🗑️ Desinstalar

```
npm un -g rav-xss         # ✅ Recomendado
npm uninstall -g rav-xss  # ✅ Completo
npm remove -g rav-xss     # ✅ Alternativo
```

---

## 🛠️ Como Usar

### Uso Básico

```
# Modo interativo (recomendado)
rav-xss

# Com argumentos CLI
rav-xss --url "https://example.com/page?q=[XSS]" --category Basic

# Com verbose para debug
rav-xss --url "https://example.com/page?q=[XSS]" --category Basic --verbose

# Abrir pasta de relatórios
rav-xss --open-reports
rav-xss -r

# Limpar configurações (via menu interativo)
rav-xss
# Selecionar "🧹 Clean and Exit" no menu
```

### Menu Interativo

Ao executar sem argumentos, o fluxo interativo é:

**Passo 1 — Selecionar Categoria:**
```
  🎯 SELECT PAYLOAD CATEGORY

  ───────────────────────────────────────────────────────
   🔰 Basic Payloads  —  Standard HTML tags & events
   🛡️ Filter Evasion  —  Encoding, null bytes, obfuscation
   🎭 Polyglots  —  Multi-context payloads
   🔥 WAF Bypass  —  Cloudflare, ModSecurity evasion
   💎 Pure Reflex  —  Reflected-only payloads
  ───────────────────────────────────────────────────────
   🎯  Configure Target URL
   🧹  Clean and Exit
   ❌  Exit
```

**Passo 2 — Selecionar Modo de Execução:**
```
  🔄 SELECT EXECUTION MODE

  ───────────────────────────────────────────────────────
   ⚡ Axios Mode  —  Fast HTTP requests (recommended)
   🌐 Playwright Mode  —  Real browser automation (slower)
  ───────────────────────────────────────────────────────
   ⮘  Back to Categories
```

**Passo 3 — Configurar URL (se necessário):**
```
  🌐 CONFIGURE TARGET URL
  💡 Demo target: http://www.sudo.co.il/xss/level0.php?email=[XSS]
  🔄 Mode: ⚡ Axios
```

### Modos de Execução

| Modo | Ícone | Descrição | Velocidade | Dependências |
|------|-------|-----------|------------|--------------|
| **Axios** | ⚡ | Requisições HTTP diretas | ⚡ Rápido | Nenhuma extra |
| **Playwright** | 🌐 | Automação de navegador real | 🐢 Lento | `npx playwright install chromium` |

> 📱 **Termux/Android:** O modo Playwright é desativado automaticamente. Apenas Axios fica disponível.

---

## 🎛️ Opções da CLI

| Opção | Atalho | Descrição | Padrão |
|-------|--------|-----------|--------|
| `--url` | - | 🌐 URL alvo com placeholder `[XSS]` | Demo URL |
| `--category` | - | 📂 Categoria de payloads | Menu interativo |
| `--mode` | - | 🔄 Modo de execução (`axios` ou `playwright`) | Menu interativo |
| `--delay` | - | ⏱️ Delay entre requisições (ms) | `500` |
| `--verbose` | `-v` | 📢 Log detalhado | `false` |
| `--help` | `-h` | ❓ Mostrar ajuda | - |
| `--configure` | - | ⚙️ Wizard de configuração | - |
| `--open-reports` | `-r` | 📁 Abrir pasta de relatórios | - |

---

## 📂 Categorias de Payloads

| Categoria | Ícone | Descrição |
|-----------|-------|-----------|
| **Basic Payloads** | 🔰 | Standard HTML tags & events |
| **Filter Evasion** | 🛡️ | Encoding, null bytes, obfuscation |
| **Polyglots** | 🎭 | Multi-context payloads |
| **WAF Bypass** | 🔥 | Cloudflare, ModSecurity evasion |
| **Pure Reflex** | 💎 | Reflected-only, no template injection |

---

## 📁 Abrir Pasta de Relatórios

Após executar os scans, você pode abrir rapidamente a pasta de relatórios:

```
# Abre a pasta reports no explorador de arquivos
rav-xss --open-reports

# Atalho
rav-xss -r
```

**Comportamento por sistema:**
| Sistema | Ação |
|---------|------|
| 🪟 Windows | Abre o Explorer na pasta `reports/` |
| 🍎 macOS | Abre o Finder na pasta `reports/` |
| 🐧 Linux | Abre o gerenciador de arquivos padrão |

> 💡 Se a pasta `reports/` ainda não existir, ela será criada automaticamente.

---

## 🧹 Limpar e Sair

Opção disponível no menu interativo principal que permite limpar todos os arquivos de configuração e relatórios:

```
  🧹  Clean and Exit
```

**Comportamento:**
1. Exibe mensagem de confirmação: `⚠️ This will DELETE all config files and reports. Continue? (y/N)`
2. Se confirmado, remove:
   - `config.json` (raiz do projeto e diretório atual)
   - `config.txt` (raiz do projeto e diretório atual)
   - Pasta `reports/` com todo seu conteúdo
3. Exibe resumo do que foi removido
4. Exibe tela de despedida e encerra

> 🛡️ **Segurança:** Requer confirmação explícita para evitar exclusão acidental.

---

## 🚀 Exemplos Práticos

### 1. Reconhecimento Básico

```
rav-xss --url "https://example.com/search?q=[XSS]" --category Basic
```

### 2. Teste com WAF Bypass

```
rav-xss --url "https://example.com/search?q=[XSS]" --category WAFBypass --verbose
```

### 3. Delay Personalizado

```
rav-xss --url "https://example.com/search?q=[XSS]" --category FilterEvasion --delay 1000
```

### 4. Scan com Modo Específico

```
# Usando Axios (rápido)
rav-xss --url "https://example.com/page?q=[XSS]" --category Basic --mode axios

# Usando Playwright (navegador real)
rav-xss --url "https://example.com/page?q=[XSS]" --category Basic --mode playwright
```

### 5. Modo Interativo Completo

```
rav-xss
# 1. Selecionar categoria com setas → Enter
# 2. Selecionar modo (Axios ou Playwright) → Enter
# 3. Digitar URL (ou usar demo) → Enter
# 4. Scan executa automaticamente
```

### 6. Abrir Relatórios

```
rav-xss -r
# Abre a pasta com todos os reports gerados
```

---

## 📊 Relatórios

Após o scan, um relatório é gerado na pasta `reports/`:

```
reports/
└── xss_report_2026-05-06T12-00-00-000Z.txt
```

**Conteúdo do relatório:**
- 📅 Data e hora do scan
- 🌐 URL alvo testada
- ⏱️ Duração total
- 📊 Total de testes realizados
- ⚠️ Vulnerabilidades encontradas
- 📝 Lista detalhada de cada finding com URL completa

---

## ⚙️ Configuração

### Wizard Interativo

```
rav-xss --configure
npm run configure
```

O wizard guia você através de:
1. 📋 Nome do target
2. 🌐 URL alvo (com placeholder `[XSS]`)
3. ⏱️ Timeout das requisições
4. ⏳ Delay entre requisições
5. 🔄 Modo de execução (Axios/Playwright)
6. 👁️ Mostrar resultados não-vulneráveis

### Arquivo config.txt

Você pode criar um arquivo `config.txt` na raiz do projeto com:

```
# RAV XSS Configuration
target=http://www.sudo.co.il/xss/level0.php?email=[XSS]
delay=500
mode=axios
timeout=8000
```

**Parâmetros suportados:**
| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| `target` | 🌐 URL alvo com `[XSS]` | `target=https://example.com/?q=[XSS]` |
| `delay` | ⏳ Delay em ms | `delay=1000` |
| `mode` | 🔄 Modo (`axios`/`playwright`) | `mode=axios` |
| `timeout` | ⏱️ Timeout em ms | `timeout=8000` |
| `verbose` | 📢 Modo verbose | `verbose=true` |
| `user_agent` | 🕵️ User-Agent customizado | `user_agent=Mozilla/5.0...` |

> 💡 O arquivo `config.txt` tem prioridade sobre `config.json` quando ambos existem.

### Configuração Padrão (Demo)

Se nenhuma configuração for fornecida, o scanner usa este alvo demo para testes:

```
🌐 Demo Target:
   http://www.sudo.co.il/xss/level0.php?email=[XSS]
   
📝 Descrição: Página pública de teste XSS
🔄 Modo padrão: Axios
⏳ Delay padrão: 500ms
```

---

## 📱 Compatibilidade Termux

O **RAV XSS** detecta automaticamente quando está rodando no Termux (Android) e se adapta:

| Recurso | Desktop | Termux |
|---------|---------|--------|
| 🔰 Modo Axios | ✅ Disponível | ✅ Disponível |
| 🌐 Modo Playwright | ✅ Disponível | ❌ Desativado |
| 🧙‍♂️ Wizard | ✅ Completo | ✅ Adaptado |
| 📁 Relatórios | ✅ Normal | ✅ Normal |

**Detecção automática:**
- Verifica variável `TERMUX_VERSION`
- Verifica prefixo `com.termux`
- Verifica hostname (`termux`/`android`)
- Verifica existência de `/data/data/com.termux`

> 📱 No Termux, o menu de modo é pulado e Axios é selecionado automaticamente.

---

## ⚠️ Aviso Legal

Esta ferramenta é destinada para:

- ✅ **Testes de segurança autorizados** — Apenas teste sistemas que você possui ou tem permissão explícita para testar
- ✅ **Programas de Bug Bounty** — Use apenas dentro do escopo definido pelo programa
- ✅ **Fins educacionais** — Aprendizado sobre vulnerabilidades XSS em ambientes controlados

**Você é responsável por:**

- 🚫 **Testes não autorizados são ilegais** — Não escaneie sites sem permissão
- 🚫 **Siga a divulgação responsável** — Reporte vulnerabilidades pelos canais apropriados
- 🚫 **Cumpra as leis** — Certifique-se de que seu uso está em conformidade com as leis locais e internacionais

> This tool is provided for educational and authorized security testing purposes only. Users are solely responsible for complying with all applicable laws and regulations. The authors assume no liability for misuse or damage caused by this tool.

**Ao usar esta ferramenta, você concorda em usá-la apenas em sistemas que está autorizado a testar.**

---

## Star History

<a href="https://www.star-history.com/#ravenastar-js/rav-xss&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=ravenastar-js/rav-xss&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=ravenastar-js/rav-xss&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=ravenastar-js/rav-xss&type=Date" />
 </picture>
</a>

---

<div align="center">

## Feito com 💚 por [RavenaStar](https://linktr.ee/ravenastar)

[⬆ Voltar ao topo](#-rav-xss)

</div>