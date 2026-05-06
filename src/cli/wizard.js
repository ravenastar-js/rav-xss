"use strict";

const inquirer = require("inquirer");
const chalk = require("chalk");
const boxen = require("boxen");
const { saveConfig, getDefaultConfig } = require("../config/manager");
const fs = require("fs");
const path = require("path");

const runWizard = async () => {
  console.clear();
  console.log(boxen(chalk.hex("#a78bfa").bold("⚙  Configuration Wizard"), {
    padding: 1, margin: 1, borderStyle: "round", borderColor: "#a78bfa",
  }));

  let existingConfig = {};
  try {
    existingConfig = JSON.parse(fs.readFileSync("./config.json", "utf8"));
  } catch (e) {}

  const answers = await inquirer.prompt([
    {
      type: "input", name: "targetName",
      message: chalk.hex("#7ec8e3")("Target name:"),
      default: existingConfig.targets?.[0]?.name || "My Target",
    },
    {
      type: "input", name: "targetUrl",
      message: chalk.hex("#7ec8e3")("Target URL (use [XSS] as placeholder):"),
      default: existingConfig.targets?.[0]?.url || "https://example.com/?q=[XSS]",
      validate: (input) => input.includes("[XSS]") || "URL must contain [XSS] placeholder",
    },
    {
      type: "number", name: "timeout",
      message: chalk.hex("#a78bfa")("Request timeout (ms):"),
      default: existingConfig.scanner?.timeout_ms || 8000,
    },
    {
      type: "number", name: "delay",
      message: chalk.hex("#a78bfa")("Delay between requests (ms):"),
      default: existingConfig.scanner?.delay_between_requests_ms || 500,
    },
    {
      type: "confirm", name: "showSafe",
      message: chalk.hex("#ffd93d")("Show non-vulnerable results?"),
      default: existingConfig.output?.show_safe || false,
    },
  ]);

  const newConfig = getDefaultConfig();
  newConfig.targets = [{ name: answers.targetName, url: answers.targetUrl, notes: "Configured via wizard" }];
  newConfig.scanner.timeout_ms = answers.timeout;
  newConfig.scanner.delay_between_requests_ms = answers.delay;
  newConfig.output.show_safe = answers.showSafe;

  saveConfig(newConfig);

  console.log(boxen(chalk.hex("#6bcb77").bold("✓  Configuration saved!"), {
    padding: 1, margin: 1, borderStyle: "round", borderColor: "#6bcb77",
  }));
};

module.exports = { runWizard };