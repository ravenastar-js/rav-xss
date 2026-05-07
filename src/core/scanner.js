"use strict";

const path = require("path");
const fs = require("fs");
const axios = require("axios");
const inquirer = require("inquirer");
const ora = require("ora");
const chalk = require("chalk");

const { sleep, ensureDir } = require("../utils/helpers");
const { colors } = require("../config/colors");
const { Logger } = require("../utils/logger");
const boxManager = require("../utils/box");
const { Reporter } = require("../utils/reporter");
const { getDefaultConfig } = require("../config/manager");

const CATEGORY_MAP = {
  "basic": ["🔰 Basic Payloads", "Standard HTML tags & events"],
  "filterevasion": ["🛡️  Filter Evasion", "Encoding, null bytes, obfuscation"],
  "polyglots": ["🎭 Polyglots", "Multi-context payloads"],
  "wafbypass": ["🔥 WAF Bypass", "Cloudflare, ModSecurity evasion"],
  "purereflex": ["💎 Pure Reflex", "Reflected-only payloads, no template injection"]
};

class XSSScanner {
  constructor(config, args) {
    this.config = config;
    this.args = args;
    this.payloads = [];
    this.category = args.category || null;
    this.mode = args.mode || config.mode || null;

    const defaultConfig = getDefaultConfig();
    const defaultUrl = defaultConfig.targets[0].url;
    const defaultName = defaultConfig.targets[0].name;

    this.targetUrl = args.url || (config.targets?.length > 0 ? config.targets[0].url : defaultUrl);
    this.targetName = config.targets?.length > 0 ? config.targets[0].name : defaultName;

    this.results = {
      scan_start: null,
      scan_end: null,
      total_tests: 0,
      vulns_found: 0,
      findings: []
    };
    this.reporter = null;

    this.payloadsDir = path.join(__dirname, "..", "..", "payloads");
  }

  /**
   * 🚀 Inicializa o scanner com menu interativo e configuração
   * @returns {Promise<void>}
   */
  async initialize() {
    while (!this.category || !this.mode) {
      if (!this.category) {
        await this.showMainMenu();
      }

      if (this.category && !this.mode) {
        await this.showModeMenu();
      }
    }

    if (!this.targetUrl || !this.targetUrl.includes("[XSS]")) {
      await this.promptForUrl();
    }

    if (!this.targetUrl || !this.targetUrl.includes("[XSS]")) {
      const defaultConfig = getDefaultConfig();
      this.targetUrl = defaultConfig.targets[0].url;
    }

    await this.loadPayloads();
    ensureDir(this.config.scanner.report_dir);
    this.reporter = new Reporter(this.config.scanner.report_dir);
  }

  /**
 * 🔄 Exibe menu de seleção de modo de execução
 * Pula automaticamente para axios se estiver no Termux
 * @returns {Promise<void>}
 */
  async showModeMenu() {
    console.clear();

    const { isTermux } = require("./browser");

    if (isTermux()) {
      this.mode = "axios";
      console.log(colors.warning("\n  📱 Termux detected - Using Axios mode automatically\n"));
      await sleep(2000);
      return;
    }

    const defaultConfig = getDefaultConfig();
    const displayUrl = this.targetUrl || defaultConfig.targets[0].url;

    Logger.showBanner(this.config, 0, this.category, displayUrl);

    const modeChoices = [
      {
        name: `  ${colors.action("⚡")}  ${colors.action.bold("Axios Mode")}  ${colors.dim("—")}  ${colors.menuDescription("Fast HTTP requests (recommended)")}`,
        value: "axios",
        short: "Axios Mode"
      },
      {
        name: `  ${colors.highlight("🌐")}  ${colors.highlight.bold("Playwright Mode")}  ${colors.dim("—")}  ${colors.menuDescription("Real browser automation (slower)")}`,
        value: "playwright",
        short: "Playwright Mode"
      },
      new inquirer.Separator(colors.dim("─".repeat(55))),
      {
        name: `  ${colors.down("⮘")}  ${colors.down.bold("Back to Categories")}`,
        value: "back",
        short: "Back"
      }
    ];

    const { mode } = await inquirer.prompt([
      {
        type: "list",
        name: "mode",
        prefix: colors.highlight2.bold("✸"),
        message: colors.highlight2.bold("SELECT MODE"),
        choices: modeChoices,
        pageSize: 5,
        loop: false
      }
    ]);

    if (mode === "back") {
      this.category = null;
      this.mode = null;
      return;
    }

    this.mode = mode;

    if (mode === "playwright") {
      console.log(colors.warning("\n  ⚠️  Playwright mode requires browser dependencies"));
      console.log(colors.muted("  Install with: npx playwright install chromium\n"));
      await sleep(2000);
    } else {
      console.log(colors.success("\n  ✅ Axios mode selected - fast and lightweight\n"));
      await sleep(1500);
    }
  }

  /**
   * 🌐 Solicita URL alvo com placeholder [XSS]
   * @returns {Promise<void>}
   */
  async promptForUrl() {
    console.clear();

    const defaultConfig = getDefaultConfig();
    const demoUrl = defaultConfig.targets[0].url;
    const demoName = defaultConfig.targets[0].name;

    Logger.showBanner(this.config, 0, this.category, this.targetUrl || demoUrl);

    console.log(colors.link2.bold("\n  ⚙  CONFIGURE TARGET URL\n"));
    console.log(colors.muted("  Enter the URL with [XSS] as placeholder for the payload\n"));
    console.log(colors.text("  💡 Demo target: ") + colors.link(demoUrl));
    console.log(colors.muted(`  (${demoName} - public XSS testing page)\n`));
    console.log(colors.highlight(`  ✸ Mode: ${this.mode === "playwright" ? "🌐 Playwright" : "⚡ Axios"}\n`));

    const { url } = await inquirer.prompt([
      {
        type: "input",
        name: "url",
        prefix: colors.action(">"),
        message: colors.text("Target URL:"),
        default: this.targetUrl || demoUrl,
        validate: (input) => {
          if (!input.includes("[XSS]")) {
            return colors.error("URL must contain [XSS] placeholder!");
          }
          return true;
        }
      }
    ]);

    this.targetUrl = url;
    console.log(colors.success(`\n✅ Target configured: ${this.truncateUrl(url)}`));

    if (url === demoUrl) {
      console.log(colors.highlight2("\n  ℹ️  Using demo target - perfect for testing!"));
    }

    await sleep(1500);
  }

  /**
   * 🧹 Limpa arquivos de configuração e pasta de relatórios
   * @returns {Promise<void>}
   */
  async cleanExit() {
    console.clear();

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: chalk.hex("#F72585").bold("⚠️  This will DELETE all config files and reports. Continue?"),
        default: false,
      }
    ]);

    if (!confirm) {
      console.log(colors.success("\n✅ Operation cancelled. Returning to menu..."));
      await sleep(1500);
      return;
    }

    console.log(colors.warning("\n🧹 Cleaning up...\n"));

    const configFiles = [
      path.join(process.cwd(), "config.json"),
      path.join(process.cwd(), "config.txt"),
      path.join(__dirname, "..", "..", "config.json"),
      path.join(__dirname, "..", "..", "config.txt")
    ];

    let cleaned = 0;
    for (const file of configFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(colors.success(`  ✓ Deleted: ${path.basename(file)}`));
          cleaned++;
        }
      } catch (e) {
        console.log(colors.error(`  ✗ Error deleting ${path.basename(file)}: ${e.message}`));
      }
    }

    const reportsDir = path.join(__dirname, "..", "..", "reports");
    try {
      if (fs.existsSync(reportsDir)) {
        fs.rmSync(reportsDir, { recursive: true, force: true });
        console.log(colors.success("  ✓ Reports folder deleted"));
        cleaned++;
      } else {
        console.log(colors.muted("  ℹ Reports folder not found"));
      }
    } catch (e) {
      console.log(colors.error(`  ✗ Error deleting reports: ${e.message}`));
    }

    if (cleaned > 0) {
      console.log(colors.success(`\n✅ Cleanup completed! ${cleaned} item(s) removed.`));
    } else {
      console.log(colors.muted("\nℹ Nothing to clean."));
    }

    Logger.showExit();
    await sleep(2000);
    process.exit(0);
  }

  /**
 * 📋 Exibe o menu principal interativo
 * @returns {Promise<void>}
 */
  async showMainMenu() {
    while (true) {
      try {
        console.clear();

        const defaultConfig = getDefaultConfig();
        const displayUrl = this.targetUrl || defaultConfig.targets[0].url;

        Logger.showBanner(this.config, 0, "Select category...", displayUrl);

        if (!fs.existsSync(this.payloadsDir)) {
          console.log(colors.error(`\n  Payloads directory not found!`));
          console.log(colors.muted(`  Expected: ${this.payloadsDir}\n`));
          console.log(colors.text(`  Make sure the package was installed correctly.`));
          console.log(colors.text(`  Try: npm uninstall -g rav-xss && npm install -g rav-xss\n`));
          process.exit(1);
        }

        const folders = fs.readdirSync(this.payloadsDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        if (folders.length === 0) {
          console.log(colors.error(`\n  No payload categories found in:`));
          console.log(colors.muted(`  ${this.payloadsDir}\n`));
          process.exit(1);
        }

        const menuChoices = [
          new inquirer.Separator(colors.dim("─".repeat(55))),
        ];

        for (const folderName of folders) {
          const key = folderName.toLowerCase();
          const info = CATEGORY_MAP[key] || [`📂 ${folderName}`, "Custom payloads"];
          const displayName = info[0];
          const description = info[1];

          menuChoices.push({
            name: `  ${displayName}  ${colors.dim("—")}  ${colors.menuDescription(description)}`,
            value: folderName,
            short: displayName.replace(/[🔰🛡️🎭👁️🔥💎]/g, "").trim()
          });
        }

        menuChoices.push(
          new inquirer.Separator(colors.dim("─".repeat(55))),
          {
            name: `  ${colors.menuConfig("🎯")}  ${colors.menuConfig.bold("Configure Target URL")}`,
            value: "config_url",
            short: "Configure URL"
          },
          {
            name: `  ${colors.danger("🧹")}  ${colors.danger.bold("Clean and Exit")}`,
            value: "clean_exit",
            short: "Clean"
          },
          {
            name: `  ${colors.menuExit("❌")}  ${colors.menuExit.bold("Exit")}`,
            value: "exit",
            short: "Exit"
          }
        );

        const { action } = await inquirer.prompt([
          {
            type: "list",
            name: "action",
            prefix: colors.highlight2.bold("✸"),
            message: colors.highlight2.bold("SELECT PAYLOAD CATEGORY"),
            choices: menuChoices,
            pageSize: 12,
            loop: false
          }
        ]);

        if (action === "exit") {
          Logger.showExit();
          await sleep(1500);
          process.exit(0);
        } else if (action === "clean_exit") {
          await this.cleanExit();
          continue;
        } else if (action === "config_url") {
          await this.promptForUrl();
          continue;
        } else {
          this.category = action;
          this.mode = null;
          return;
        }

      } catch (error) {
        if (error.message === "User force closed the prompt") {
          Logger.showExit();
          await sleep(1500);
          process.exit(0);
        }
        console.log(colors.error(`Menu error: ${error.message}`));
        await sleep(2000);
      }
    }
  }

  /**
   * 📂 Encontra o arquivo de payload na categoria
   * @param {string} categoryDir - Diretório da categoria
   * @returns {string|null} Caminho do arquivo de payload ou null
   */
  findPayloadFile(categoryDir) {
    if (!fs.existsSync(categoryDir)) return null;

    const files = fs.readdirSync(categoryDir);

    const txtFile = files.find(f => f.endsWith(".txt"));
    if (txtFile) return path.join(categoryDir, txtFile);

    return null;
  }

  /**
   * 📥 Carrega payloads do diretório da categoria
   * @returns {Promise<void>}
   */
  async loadPayloads() {
    const categoryDir = path.join(this.payloadsDir, this.category);

    if (!fs.existsSync(categoryDir)) {
      const availableCats = fs.existsSync(this.payloadsDir)
        ? fs.readdirSync(this.payloadsDir).filter(d =>
          fs.statSync(path.join(this.payloadsDir, d)).isDirectory()
        ).join(", ")
        : "NONE";

      throw new Error(
        `Category directory not found: ${categoryDir}\n` +
        `Available categories: ${availableCats}`
      );
    }

    const payloadPath = this.findPayloadFile(categoryDir);

    if (!payloadPath) {
      const files = fs.readdirSync(categoryDir);
      throw new Error(
        `No .txt file found in ${categoryDir}\n` +
        `Files found: ${files.join(", ") || "NONE"}`
      );
    }

    this.payloads = fs.readFileSync(payloadPath, "utf8")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    if (this.payloads.length === 0) {
      throw new Error("No payloads loaded. File is empty.");
    }
  }

  /**
   * 🛡️ Verifica se a resposta HTTP indica um bloqueio por WAF ou segurança
   * @param {Object} response - Resposta do axios
   * @returns {boolean} true se for um bloqueio
   */
  isSecurityBlock(response) {
    if (response.status === 403 || response.status === 429) {
      return true;
    }

    if (response.status >= 500 && response.status < 600) {
      return true;
    }

    const bodyStr = typeof response.data === 'string' ? response.data.toLowerCase() : '';

    if (bodyStr.includes('cloudflare') &&
      (bodyStr.includes('ray id') ||
        bodyStr.includes('just a moment') ||
        bodyStr.includes('attention required') ||
        bodyStr.includes('sorry, you have been blocked') ||
        bodyStr.includes('you are unable to access'))) {
      return true;
    }

    if (bodyStr.includes('access denied') &&
      (bodyStr.includes('waf') || bodyStr.includes('firewall') || bodyStr.includes('security'))) {
      return true;
    }

    return false;
  }

  /**
   * 🔍 Verifica se o payload foi refletido na resposta de forma potencialmente perigosa
   * @param {string} responseData - Corpo da resposta HTML/texto
   * @param {string} payload - Payload injetado
   * @returns {boolean} true se o payload foi refletido
   */
  isPayloadReflected(responseData, payload) {
    if (!responseData || typeof responseData !== 'string') {
      return false;
    }

    const htmlWithoutComments = responseData.replace(/<!--[\s\S]*?-->/g, '');

    const htmlEntities = {
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x2F;': '/',
      '&amp;': '&'
    };

    let fullyEscapedPayload = payload;
    for (const [entity, char] of Object.entries(htmlEntities)) {
      const escapedChar = entity;
      fullyEscapedPayload = fullyEscapedPayload.split(char).join(escapedChar);
    }

    if (fullyEscapedPayload !== payload &&
      htmlWithoutComments.includes(fullyEscapedPayload) &&
      !htmlWithoutComments.includes(payload)) {
      return false;
    }

    const searchPayloads = [payload];

    if (payload.includes('<') && payload.includes('>')) {
      const encodedLt = payload.replace(/</g, '&lt;');
      if (encodedLt !== payload) {
        searchPayloads.push(encodedLt);
      }
    }

    for (const searchPayload of searchPayloads) {
      if (htmlWithoutComments.includes(searchPayload)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 🎯 Testa um payload individual contra a URL alvo
   * @param {string} payload - Payload a ser testado
   * @param {number} index - Índice do payload na lista
   * @returns {Object} Resultado do teste
   */
  async testPayload(payload, index) {
    const url = this.targetUrl.replace("[XSS]", encodeURIComponent(payload));
    let vulnerable = false;

    try {
      const response = await axios.get(url, {
        timeout: this.config.scanner.timeout_ms,
        headers: {
          "User-Agent": this.config.scanner.user_agent,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        },
        validateStatus: () => true,
        maxRedirects: 5
      });

      if (!this.isSecurityBlock(response)) {
        vulnerable = this.isPayloadReflected(response.data, payload);
      }
    } catch (err) {
      // Request failed silently
    }

    return { payload, url, vulnerable, index: index + 1 };
  }

  /**
   * ⏱️ Obtém o delay configurado em milissegundos
   * @returns {number} Delay em milissegundos
   */
  getConfiguredDelay() {
    if (this.config?.scanner?.delay_between_requests_ms !== undefined &&
      this.config?.scanner?.delay_between_requests_ms !== null) {
      return parseInt(this.config.scanner.delay_between_requests_ms) || 0;
    }
    return 0;
  }

  /**
   * 🚀 Executa o scan completo
   * @returns {Promise<void>}
   */
  async run() {
    await this.initialize();
    this.results.scan_start = new Date().toISOString();

    console.clear();

    const displayMode = this.mode === "playwright" ? "🌐 Playwright" : "⚡ Axios";
    Logger.showBanner(this.config, this.payloads.length, this.category, this.targetUrl);

    console.log(colors.highlight(`\n  ✸ Mode: ${displayMode}\n`));

    Logger.log("info",
      `Testing ${colors.primary.bold(String(this.payloads.length))} payloads from ${colors.highlight.bold(this.category)} category\n`
    );

    const configuredDelay = this.getConfiguredDelay();
    if (configuredDelay > 0 && configuredDelay < 2000) {
      console.log(colors.warning.bold(`⚠️  Low delay detected (${configuredDelay}ms) - may trigger rate limiting\n`));
    } else if (configuredDelay === 0) {
      console.log(colors.warning.bold("⚠️  No delay configured - this may trigger rate limiting\n"));
    }

    const spinner = ora({
      text: colors.action("Initializing scan..."),
      spinner: { interval: 80, frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] },
      color: "cyan"
    });

    if (!this.args.verbose) spinner.start();

    const concurrentLimit = 5;
    let cursor = 0;

    const effectiveDelay = configuredDelay > 0 ? configuredDelay : 500;

    while (cursor < this.payloads.length) {
      const batch = [];
      for (let i = cursor; i < cursor + concurrentLimit && i < this.payloads.length; i++) {
        batch.push(this.testPayload(this.payloads[i], i));
      }

      const batchResults = await Promise.all(batch);

      for (const result of batchResults) {
        this.results.total_tests++;

        if (!this.args.verbose && spinner.isSpinning) {
          spinner.text = colors.action(
            `${result.index}/${this.payloads.length} ${colors.primary("▸")} ${colors.text(result.payload.substring(0, 30))}`
          );
        }

        if (result.vulnerable) {
          this.results.vulns_found++;
          this.results.findings.push(result);

          if (spinner.isSpinning) spinner.stop();

          const shortPayload = result.payload.length > 50
            ? result.payload.substring(0, 47) + "..."
            : result.payload;

          Logger.log("vuln",
            `#${String(result.index).padStart(4, "0")} ${colors.icon.arrow} ${colors.highlight(shortPayload)}`
          );

          if (!this.args.verbose) spinner.start();

        } else if (this.args.verbose || this.config.output?.show_safe) {
          if (spinner.isSpinning) spinner.stop();
          Logger.log("safe", `#${String(result.index).padStart(4, "0")} ${colors.icon.success} ${colors.muted(result.payload.substring(0, 40))}`);
          if (!this.args.verbose) spinner.start();
        }
      }

      cursor += concurrentLimit;

      if (cursor < this.payloads.length) {
        await sleep(effectiveDelay);
      }
    }

    if (spinner.isSpinning) {
      spinner.succeed(colors.success("Scan completed"));
    }

    this.results.scan_end = new Date().toISOString();

    const { textPath } = this.reporter.saveReport(this.results, this.targetUrl);
    const displayPath = this.formatReportPath(textPath);
    const duration = ((new Date(this.results.scan_end) - new Date(this.results.scan_start)) / 1000).toFixed(1);

    Logger.showResults(
      this.results,
      this.targetUrl,
      this.category,
      duration,
      displayPath,
      this.reporter.reportDir
    );

    process.exit(this.results.vulns_found > 0 ? 1 : 0);
  }

  /**
   * 📄 Formata o caminho do relatório para exibição
   * Exibe caminho completo no Termux
   * @param {string} absolutePath - Caminho absoluto do relatório
   * @returns {string} Caminho formatado
   */
  formatReportPath(absolutePath) {
    const normalized = absolutePath.replace(/\\/g, "/");

    const packageBase = path.join(__dirname, "..", "..").replace(/\\/g, "/");

    if (normalized.startsWith(packageBase)) {
      let relative = normalized.substring(packageBase.length);
      if (relative.startsWith("/")) relative = relative.substring(1);
      return `[package]/${relative}`;
    }

    const cwd = process.cwd().replace(/\\/g, "/");
    if (normalized.startsWith(cwd)) {
      let relative = normalized.substring(cwd.length);
      if (relative.startsWith("/")) relative = relative.substring(1);
      return `./${relative}`;
    }

    return normalized;
  }

  /**
   * 🔗 Trunca a URL para exibição compacta
   * @param {string} url - URL completa
   * @param {number} maxLength - Comprimento máximo
   * @returns {string} URL truncada
   */
  truncateUrl(url, maxLength = 55) {
    if (!url) return "N/A";
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + "...";
  }
}

module.exports = { XSSScanner };