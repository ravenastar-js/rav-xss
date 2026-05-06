"use strict";

const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(process.cwd(), "config.json");

const getDefaultConfig = () => ({
  version: "1.0.0",
  targets: [],
  scanner: {
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    timeout_ms: 8000,
    delay_between_requests_ms: 500,
    report_dir: "./reports"
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
    return { ...getDefaultConfig(), ...config };
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

  if (!fs.existsSync(config.scanner.report_dir)) {
    fs.mkdirSync(config.scanner.report_dir, { recursive: true });
  }
  return true;
};

module.exports = { loadConfig, saveConfig, validateConfig, getDefaultConfig };