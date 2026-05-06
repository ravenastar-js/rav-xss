#!/usr/bin/env node
"use strict";

const { parseArgs, hasHelp, shouldConfigure } = require("./cli/args");
const { showHelp } = require("./cli/help");
const { runWizard } = require("./cli/wizard");
const { loadConfig, validateConfig } = require("./config/manager");
const { XSSScanner } = require("./core/scanner");

const main = async () => {
  const args = parseArgs();

  if (hasHelp(args)) {
    showHelp();
    process.exit(0);
  }

  if (shouldConfigure(args)) {
    await runWizard();
    process.exit(0);
  }

  const config = loadConfig();
  if (!validateConfig(config)) {
    console.error("Invalid configuration. Run --configure to set up.");
    process.exit(1);
  }

  const scanner = new XSSScanner(config, args);
  await scanner.run();
};

main().catch((err) => {
  console.error(`\n[FATAL] ${err.message}\n`);
  if (process.argv.includes("--verbose")) {
    console.error(err.stack);
  }
  process.exit(1);
});