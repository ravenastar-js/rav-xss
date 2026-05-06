"use strict";

const fs = require("fs");
const path = require("path");
const packageInfo = require("../utils/packageInfo");

const BASE_DIR = path.join(__dirname, "..", "..");
const CONFIG_PATH = path.join(BASE_DIR, "config.json");

const getDefaultConfig = () => ({
  version: packageInfo.version,
  targets: [],
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

const loadConfig = () => {
  if (!fs.existsSync(CONFIG_PATH)) {
    const defaultConfig = getDefaultConfig();
    saveConfig(defaultConfig);
    return defaultConfig;
  }
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    const merged = { ...getDefaultConfig(), ...config };
    if (!path.isAbsolute(merged.scanner.report_dir)) {
      merged.scanner.report_dir = path.join(BASE_DIR, merged.scanner.report_dir);
    }
    return merged;
  } catch (err) {
    console.error(`Error loading config: ${err.message}`);
    return getDefaultConfig();
  }
};

const saveConfig = (config) => {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
};

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
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  return true;
};

module.exports = { loadConfig, saveConfig, validateConfig, getDefaultConfig };