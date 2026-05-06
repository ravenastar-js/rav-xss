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

/**
 * Mapeamento de categorias (TUDO em lowercase)
 */
const CATEGORY_MAP = {
  "basic": ["🔰 Basic Payloads", "Standard HTML tags & events"],
  "filterevasion": ["🛡️  Filter Evasion", "Encoding, null bytes, obfuscation"],
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

  async loadPayloads() {
    const categoryLower = this.category.toLowerCase();
    const payloadFileName = `${categoryLower}.txt`;
    const payloadPath = path.join(process.cwd(), "payloads", this.category, payloadFileName);

    if (!fs.existsSync(payloadPath)) {
      throw new Error(`Payload file not found: ${payloadPath}`);
    }

    this.payloads = fs.readFileSync(payloadPath, "utf8")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    if (this.payloads.length === 0) {
      throw new Error("No payloads loaded. Check the file.");
    }
  }

  async showMainMenu() {
    while (true) {
      try {
        console.clear();

        Logger.showBanner(this.config, 0, "Select category...", this.targetUrl || "Not set");

        const payloadsDir = path.join(process.cwd(), "payloads");

        if (!fs.existsSync(payloadsDir)) {
          console.log(colors.error("Payloads directory not found!"));
          process.exit(1);
        }

        const folders = fs.readdirSync(payloadsDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        if (folders.length === 0) {
          console.log(colors.error("No payload categories found in ./payloads/"));
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

  async testPayload(payload, index) {
    const url = this.targetUrl.replace("[XSS]", encodeURIComponent(payload));
    let vulnerable = false;

    try {
      const response = await axios.get(url, {
        timeout: this.config.scanner.timeout_ms,
        headers: { "User-Agent": this.config.scanner.user_agent },
        validateStatus: () => true
      });

      const decoded = decodeURIComponent(encodeURIComponent(payload));
      if (response.data && response.data.includes(decoded)) {
        vulnerable = true;
      }
    } catch (err) {
      // Request failed
    }

    return { payload, url, vulnerable, index: index + 1 };
  }

  async run() {
    await this.initialize();
    this.results.scan_start = new Date().toISOString();

    console.clear();
    Logger.showBanner(this.config, this.payloads.length, this.category, this.targetUrl);

    Logger.log("info",
      `Testing ${colors.primary.bold(String(this.payloads.length))} payloads from ${colors.highlight.bold(this.category)} category\n`
    );

    const spinner = ora({
      text: colors.action("Initializing scan..."),
      spinner: { interval: 80, frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] },
      color: "cyan"
    });

    if (!this.args.verbose) spinner.start();

    const concurrentLimit = 5;
    let cursor = 0;

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
        await sleep(this.config.scanner.delay_between_requests_ms);
      }
    }

    if (spinner.isSpinning) {
      spinner.succeed(colors.success("Scan completed"));
    }

    this.results.scan_end = new Date().toISOString();

    const { textPath } = this.reporter.saveReport(this.results, this.targetUrl);
    const relativePath = path.relative(process.cwd(), textPath);
    const duration = ((new Date(this.results.scan_end) - new Date(this.results.scan_start)) / 1000).toFixed(1);

    Logger.showResults(this.results, this.targetUrl, this.category, duration, relativePath);

    process.exit(this.results.vulns_found > 0 ? 1 : 0);
  }

  truncateUrl(url, maxLength = 55) {
    if (!url) return "N/A";
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + "...";
  }
}

module.exports = { XSSScanner };