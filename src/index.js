#!/usr/bin/env node
"use strict";

const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { parseArgs, hasHelp, shouldConfigure, shouldOpenReports } = require("./cli/args");
const { showHelp } = require("./cli/help");
const { runWizard } = require("./cli/wizard");
const { loadConfig, validateConfig } = require("./config/manager");
const { XSSScanner } = require("./core/scanner");
const { colors } = require("./config/colors");

const openReportsFolder = (reportDir) => {
  const resolvedPath = path.resolve(reportDir);
  
  console.log(`\n${colors.text("📂 Reports folder:")} ${colors.link(resolvedPath)}\n`);
  
  if (!fs.existsSync(resolvedPath)) {
    console.log(colors.warning("⚠️  Reports folder doesn't exist yet. Creating..."));
    try {
      fs.mkdirSync(resolvedPath, { recursive: true });
      console.log(colors.success("✅ Reports folder created!"));
    } catch (err) {
      console.log(colors.error(`❌ Could not create folder: ${err.message}`));
      process.exit(1);
    }
  }
  
  const platform = process.platform;
  
  if (platform === "win32") {
    exec(`explorer "${resolvedPath}"`);
    setTimeout(() => {
      console.log(colors.success("✅ Reports folder opened!"));
      process.exit(0);
    }, 500);
  } else if (platform === "darwin") {
    exec(`open "${resolvedPath}"`, (error) => {
      if (error) {
        console.log(colors.error(`❌ Could not open folder: ${error.message}`));
        console.log(colors.text(`📂 Location: ${colors.link(resolvedPath)}`));
      } else {
        console.log(colors.success("✅ Reports folder opened!"));
      }
      process.exit(0);
    });
  } else {
    exec(`xdg-open "${resolvedPath}"`, (error) => {
      if (error) {
        console.log(colors.error(`❌ Could not open folder: ${error.message}`));
        console.log(colors.text(`📂 Location: ${colors.link(resolvedPath)}`));
      } else {
        console.log(colors.success("✅ Reports folder opened!"));
      }
      process.exit(0);
    });
  }
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