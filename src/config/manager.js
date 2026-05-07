"use strict";

const fs = require("fs");
const path = require("path");
const packageInfo = require("../utils/packageInfo");

const BASE_DIR = path.join(__dirname, "..", "..");
const CONFIG_PATH = path.join(BASE_DIR, "config.json");

/**
 * 🏭 Obtém configuração padrão com valores fallback
 * @returns {Object} Configuração padrão completa
 */
const getDefaultConfig = () => ({
  targets: [
    {
      name: "Default Target",
      url: "http://www.sudo.co.il/xss/level0.php?email=[XSS]",
      notes: "Example target"
    }
  ],
  scanner: {
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    timeout_ms: 8000,
    delay_between_requests_ms: 500,
    report_dir: path.join(BASE_DIR, "reports")
  },
  output: {
    verbose: false,
    show_safe: false
  }
});

/**
 * 📂 Carrega configuração do arquivo config.json
 * @returns {Object} Configuração carregada ou padrão
 */
const loadConfig = () => {
  if (!fs.existsSync(CONFIG_PATH)) {
    const defaultConfig = getDefaultConfig();
    saveConfig(defaultConfig);
    return defaultConfig;
  }

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    const merged = { ...getDefaultConfig(), ...config };

    if (!merged.targets || merged.targets.length === 0) {
      merged.targets = getDefaultConfig().targets;
    }

    if (merged.scanner?.report_dir && !path.isAbsolute(merged.scanner.report_dir)) {
      merged.scanner.report_dir = path.join(BASE_DIR, merged.scanner.report_dir);
    }

    return merged;
  } catch (err) {
    console.error(`Error loading config: ${err.message}`);
    return getDefaultConfig();
  }
};

/**
 * 💾 Salva configuração no arquivo config.json
 * @param {Object} config - Configuração a ser salva
 */
const saveConfig = (config) => {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const configToSave = { ...config };
    delete configToSave.version;

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(configToSave, null, 2));
  } catch (err) {
    console.error(`Error saving config: ${err.message}`);
  }
};

/**
 * ✅ Valida a configuração e cria diretórios necessários
 * @param {Object} config - Configuração a validar
 * @returns {boolean} true se válida
 */
const validateConfig = (config) => {
  if (config.targets && config.targets.length > 0) {
    for (const target of config.targets) {
      if (!target.url || !target.url.includes("[XSS]")) {
        console.error(`Invalid target URL: ${target.url}`);
        return false;
      }
    }
  }

  const reportDir = config.scanner.report_dir;
  if (reportDir && !fs.existsSync(reportDir)) {
    try {
      fs.mkdirSync(reportDir, { recursive: true });
    } catch (err) {
      console.error(`Error creating report directory: ${err.message}`);
      return false;
    }
  }

  return true;
};

module.exports = { loadConfig, saveConfig, validateConfig, getDefaultConfig };