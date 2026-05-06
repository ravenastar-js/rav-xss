#!/usr/bin/env node
"use strict";

const { exec } = require("child_process");
const path = require("path");
const { parseArgs, hasHelp, shouldConfigure, shouldOpenReports } = require("./cli/args");
const { showHelp } = require("./cli/help");
const { runWizard } = require("./cli/wizard");
const { loadConfig, validateConfig } = require("./config/manager");
const { XSSScanner } = require("./core/scanner");

/**
 * Abre a pasta de relatórios no explorador de arquivos
 */
const openReportsFolder = (reportDir) => {
  const resolvedPath = path.resolve(reportDir);
  
  console.log(`\n📂 Opening reports folder: ${resolvedPath}\n`);
  
  const platform = process.platform;
  let command;
  
  if (platform === "win32") {
    command = `explorer "${resolvedPath}"`;
  } else if (platform === "darwin") {
    command = `open "${resolvedPath}"`;
  } else {
    command = `xdg-open "${resolvedPath}"`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.log(`❌ Could not open folder: ${error.message}`);
      console.log(`📂 Reports location: ${resolvedPath}`);
    } else {
      console.log(`✅ Reports folder opened!`);
    }
    process.exit(0);
  });
};

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
  
  if (shouldOpenReports(args)) {
    const config = loadConfig();
    openReportsFolder(config.scanner.report_dir);
    return;
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