"use strict";

const inquirer = require("inquirer");
const chalk = require("chalk");
const boxen = require("boxen");
const { saveConfig, getDefaultConfig } = require("../config/manager");
const fs = require("fs");
const path = require("path");
const { isTermux } = require("../core/browser");

/**
 * 🧙‍♂️ Wizard de configuração interativo
 * Suporte a config.txt externo e detecção automática de ambiente
 */
const runWizard = async () => {
  console.clear();
  console.log(boxen(chalk.hex("#a78bfa").bold("⚙  Configuration Wizard"), {
    padding: 1, margin: 1, borderStyle: "round", borderColor: "#a78bfa",
  }));

  const externalConfig = loadExternalConfig();
  let existingConfig = {};

  if (externalConfig) {
    existingConfig = externalConfig;
  } else {
    try {
      existingConfig = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    } catch (e) { }
  }

  const isAndroid = isTermux();
  const availableModes = isAndroid
    ? ["axios (Termux - Playwright disabled)"]
    : ["axios", "playwright"];
  const defaultMode = isAndroid ? "axios" : (existingConfig.mode || "axios");

  if (isAndroid) {
    console.log(chalk.hex("#FF9E64")("\n  📱 Termux detected - Playwright mode disabled\n"));
  }

  const answers = await inquirer.prompt([
    {
      type: "input", name: "targetName",
      message: chalk.hex("#7ec8e3")("📋 Target name:"),
      default: existingConfig.targets?.[0]?.name || defaultCfg.targets[0].name,
    },
    {
      type: "input", name: "targetUrl",
      message: chalk.hex("#7ec8e3")("🌐 Target URL (use [XSS] as placeholder):"),
      default: existingConfig.targets?.[0]?.url || defaultCfg.targets[0].url,
      validate: (input) => input.includes("[XSS]") || "URL must contain [XSS] placeholder",
    },
    {
      type: "number", name: "timeout",
      message: chalk.hex("#a78bfa")("⏱️  Request timeout (ms):"),
      default: existingConfig.scanner?.timeout_ms || defaultCfg.scanner.timeout_ms,
    },
    {
      type: "number", name: "delay",
      message: chalk.hex("#a78bfa")("⏳ Delay between requests (ms):"),
      default: existingConfig.scanner?.delay_between_requests_ms || defaultCfg.scanner.delay_between_requests_ms,
    },
    {
      type: "list", name: "mode",
      message: chalk.hex("#4ECDC4")("🔄 Execution mode:"),
      choices: availableModes,
      default: defaultMode,
    },
    {
      type: "confirm", name: "showSafe",
      message: chalk.hex("#ffd93d")("👁️  Show non-vulnerable results?"),
      default: existingConfig.output?.show_safe || false,
    },
  ]);

  const newConfig = getDefaultConfig();
  newConfig.targets = [{
    name: answers.targetName,
    url: answers.targetUrl,
    notes: "Configured via wizard"
  }];
  newConfig.scanner.timeout_ms = answers.timeout;
  newConfig.scanner.delay_between_requests_ms = answers.delay;
  newConfig.output.show_safe = answers.showSafe;
  newConfig.mode = answers.mode.includes("playwright") ? "playwright" : "axios";

  saveConfig(newConfig);

  saveExternalConfig({
    target: answers.targetUrl,
    delay: answers.delay,
    mode: newConfig.mode,
    timeout: answers.timeout
  });

  console.log(boxen(chalk.hex("#6bcb77").bold("✓  Configuration saved!"), {
    padding: 1, margin: 1, borderStyle: "round", borderColor: "#6bcb77",
  }));
};

/**
 * 📄 Carrega configuração do arquivo config.txt
 * @returns {Object|null} Configuração carregada ou null
 */
function loadExternalConfig() {
  const configPaths = [
    path.join(process.cwd(), "config.txt"),
    path.join(__dirname, "..", "..", "config.txt")
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, "utf8");
        return parseConfigTxt(content);
      } catch (e) {
        console.log(chalk.hex("#FF9999")(`⚠️  Error reading config.txt: ${e.message}`));
      }
    }
  }

  return null;
}

/**
 * 🔍 Faz parsing do arquivo config.txt
 * @param {string} content - Conteúdo do arquivo
 * @returns {Object} Configuração parseada
 */
function parseConfigTxt(content) {
  const config = getDefaultConfig();
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;

    const match = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
    if (!match) continue;

    const [, key, value] = match;

    switch (key.toLowerCase()) {
      case "target":
      case "url":
        config.targets = [{
          name: "External Config",
          url: value.trim(),
          notes: "From config.txt"
        }];
        break;
      case "delay":
        config.scanner.delay_between_requests_ms = parseInt(value) || 500;
        break;
      case "mode":
        if (value.trim().toLowerCase() === "playwright" && !isTermux()) {
          config.mode = "playwright";
        } else {
          config.mode = "axios";
        }
        break;
      case "timeout":
        config.scanner.timeout_ms = parseInt(value) || 8000;
        break;
      case "verbose":
        config.output.verbose = value.trim().toLowerCase() === "true";
        break;
      case "user_agent":
        config.scanner.user_agent = value.trim();
        break;
    }
  }

  return config;
}

/**
 * 💾 Salva configuração em config.txt
 * @param {Object} config - Configuração a ser salva
 */
function saveExternalConfig(config) {
  let content = "";
  content += "# RAV XSS Configuration\n";
  content += `# Generated: ${new Date().toISOString()}\n\n`;

  if (config.target) content += `target=${config.target}\n`;
  if (config.delay) content += `delay=${config.delay}\n`;
  if (config.mode) content += `mode=${config.mode}\n`;
  if (config.timeout) content += `timeout=${config.timeout}\n`;

  const configPath = path.join(process.cwd(), "config.txt");
  fs.writeFileSync(configPath, content);
}

module.exports = { runWizard };