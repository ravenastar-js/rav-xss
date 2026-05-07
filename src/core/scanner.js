"use strict";

const path = require("path");
const fs = require("fs");
const axios = require("axios");
const inquirer = require("inquirer");
const ora = require("ora");

const { sleep, ensureDir } = require("../utils/helpers");
const { colors } = require("../config/colors");
const { Logger } = require("../utils/logger");
const boxManager = require("../utils/box");
const { Reporter } = require("../utils/reporter");

const CATEGORY_MAP = {
  "basic": ["🔰 Basic Payloads", "Standard HTML tags & events"],
  "filterevasion": ["🛡️ Filter Evasion", "Encoding, null bytes, obfuscation"],
  "polyglots": ["🎭 Polyglots", "Multi-context payloads"],
  "wafbypass": ["🔥 WAF Bypass", "Cloudflare, ModSecurity evasion"]
};

class XSSScanner {
  constructor(config, args) {
    this.config = config;
    this.args = args;
    this.payloads = [];
    this.category = args.category || null;
    this.targetUrl = args.url || (config.targets?.length > 0 ? config.targets[0].url : null);
    this.targetName = config.targets?.length > 0 ? config.targets[0].name : "CLI Target";
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

  async initialize() {
    if (!this.category) {
      await this.showMainMenu();
    }

    if (!this.targetUrl || !this.targetUrl.includes("[XSS]")) {
      await this.promptForUrl();
    }

    if (!this.targetUrl || !this.targetUrl.includes("[XSS]")) {
      throw new Error("A target URL with [XSS] placeholder must be provided");
    }

    await this.loadPayloads();
    ensureDir(this.config.scanner.report_dir);
    this.reporter = new Reporter(this.config.scanner.report_dir);
  }

  /**
   * Encontra o arquivo de payload na categoria
   * @param {string} categoryDir - Diretório da categoria
   * @returns {string|null} Caminho do arquivo de payload ou null se não encontrado
   */
  findPayloadFile(categoryDir) {
    if (!fs.existsSync(categoryDir)) return null;

    const files = fs.readdirSync(categoryDir);

    const txtFile = files.find(f => f.endsWith(".txt"));
    if (txtFile) return path.join(categoryDir, txtFile);

    return null;
  }

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

  async showMainMenu() {
    while (true) {
      try {
        console.clear();

        Logger.showBanner(this.config, 0, "Select category...", this.targetUrl || "Not set");

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
            short: displayName.replace(/[🔰🛡️🎭👁️🔥]/g, "").trim()
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
        } else if (action === "config_url") {
          await this.promptForUrl();
          continue;
        } else {
          this.category = action;

          if (this.targetUrl && this.targetUrl.includes("[XSS]")) {
            return;
          }

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

  async promptForUrl() {
    console.clear();
    Logger.showBanner(this.config, 0, this.category || "Not selected", this.targetUrl || "Not set");

    console.log(colors.primary.bold("\n  🌐 CONFIGURE TARGET URL\n"));
    console.log(colors.muted("  Enter the URL with [XSS] as placeholder for the payload\n"));
    console.log(colors.text("  Example: ") + colors.link("https://example.com/page?q=[XSS]\n"));

    const { url } = await inquirer.prompt([
      {
        type: "input",
        name: "url",
        prefix: colors.action(">"),
        message: colors.text("Target URL:"),
        default: this.targetUrl || "https://example.com/page?q=[XSS]",
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
    await sleep(1500);
  }

  /**
   * Verifica se a resposta HTTP indica um bloqueio por WAF ou segurança
   * @param {Object} response - Resposta do axios
   * @returns {boolean} true se for um bloqueio, false caso contrário
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
   * Verifica se o payload foi refletido na resposta de forma potencialmente perigosa
   * @param {string} responseData - Corpo da resposta HTML/texto
   * @param {string} payload - Payload injetado
   * @returns {boolean} true se o payload foi refletido, false caso contrário
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
        const idx = htmlWithoutComments.indexOf(searchPayload);
        const context = htmlWithoutComments.substring(Math.max(0, idx - 100), idx + searchPayload.length + 100);
        
        if (context.includes('<script') && context.includes('</script>')) {
          continue;
        }
        
        if (context.match(/<[^>]*\s+value\s*=\s*["'][^"']*$/i) && context.includes('"')) {
          return true;
        }
        
        const isInsideTag = /<[^>]*$/.test(htmlWithoutComments.substring(0, idx));
        const isClosingTag = /^[^<]*>/.test(htmlWithoutComments.substring(idx + searchPayload.length));
        
        if (isInsideTag && isClosingTag) {
          return true;
        }
        
        if (!isInsideTag && !isClosingTag) {
          const surroundingText = htmlWithoutComments.substring(
            Math.max(0, idx - 50), 
            Math.min(htmlWithoutComments.length, idx + searchPayload.length + 50)
          );
          
          if (!surroundingText.includes('&lt;') && !surroundingText.includes('&gt;')) {
            return true;
          }
        }
        
        return true;
      }
    }

    return false;
  }

  /**
   * Testa um payload individual contra a URL alvo
   * @param {string} payload - Payload a ser testado
   * @param {number} index - Índice do payload na lista
   * @returns {Object} Resultado do teste com payload, url, vulnerable e index
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
   * Obtém o delay configurado em milissegundos
   * @returns {number} Delay em milissegundos
   */
  getConfiguredDelay() {
    if (this.config?.scanner?.delay_between_requests_ms !== undefined &&
        this.config?.scanner?.delay_between_requests_ms !== null) {
      return parseInt(this.config.scanner.delay_between_requests_ms) || 0;
    }
    return 0;
  }

  async run() {
    await this.initialize();
    this.results.scan_start = new Date().toISOString();

    console.clear();
    Logger.showBanner(this.config, this.payloads.length, this.category, this.targetUrl);

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
   * Formata o caminho do relatório para exibição
   * @param {string} absolutePath - Caminho absoluto do relatório
   * @returns {string} Caminho formatado para exibição
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
   * Trunca a URL para exibição compacta
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
