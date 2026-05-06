#!/usr/bin/env node
"use strict";

const path = require("path");
const fs = require("fs");
const open = require("open");
const { parseArgs, hasHelp, shouldConfigure, shouldOpenReports } = require("./cli/args");
const { showHelp } = require("./cli/help");
const { runWizard } = require("./cli/wizard");
const { loadConfig, validateConfig } = require("./config/manager");
const { XSSScanner } = require("./core/scanner");
const { colors } = require("./config/colors");

/**
 * 📂 Abre a pasta de relatórios no explorador de arquivos
 * Usa o pacote 'open' para compatibilidade cross-platform
 */
const openReportsFolder = async (reportDir) => {
  const resolvedPath = path.resolve(reportDir);
  
  console.log(`\n${colors.text("📂 Opening reports folder:")} ${colors.link(resolvedPath)}\n`);
  
  if (!fs.existsSync(resolvedPath)) {
    console.log(colors.warning("⚠️  Reports folder doesn't exist yet. Creating..."));
    try {
      fs.mkdirSync(resolvedPath, { recursive: true });
      console.log(colors.success("✅ Reports folder created!"));
    } catch (err) {
      console.log(colors.error(`❌ Could not create folder: ${err.message}`));
      console.log(colors.text(`📂 Reports location: ${colors.link(resolvedPath)}`));
      process.exit(1);
    }
  }
  
  try {
    await open(resolvedPath);
    console.log(colors.success("✅ Reports folder opened!"));
  } catch (error) {
    console.log(colors.error(`❌ Could not open folder: ${error.message}`));
    console.log(colors.text(`📂 Reports location: ${colors.link(resolvedPath)}`));
    console.log(colors.muted(`\n  You can open it manually.`));
  }
  
  process.exit(0);
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
    await openReportsFolder(config.scanner.report_dir);
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