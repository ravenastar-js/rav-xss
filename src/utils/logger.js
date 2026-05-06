"use strict";

const { colors } = require("../config/colors");
const boxManager = require("./box");
const packageInfo = require("./packageInfo");

/**
 * 📝 Logger - Sistema de logging
 */
class Logger {
  static log(level, msg) {
    const styles = {
      info: `${colors.action.bold("  ℹ  ")}${colors.text(msg)}`,
      vuln: `${colors.error.bold("  ⚠  ")}${colors.danger(msg)}`,
      safe: `${colors.success("  ✓  ")}${colors.muted(msg)}`,
      warn: `${colors.warning.bold("  ⚡ ")}${colors.highlight2(msg)}`,
      done: `${colors.success.bold("  ✔  ")}${colors.text(msg)}`,
      error: `${colors.error.bold("  ✗  ")}${colors.danger(msg)}`
    };
    console.log(styles[level] || `        ${msg}`);
  }

  static showBanner(config, totalPayloads, category, targetUrl) {
    console.clear();
    const banner = boxManager.createWelcomeBox(config, totalPayloads, category, targetUrl);
    console.log(banner);
    console.log(colors.dim("\n" + "─".repeat(60) + "\n"));
  }

  static showTarget(target, index, total) {
    const box = boxManager.createTargetBox(target, index, total);
    console.log(box);
  }

  static showResults(results, targetUrl, category, duration, reportPath) {
    const box = boxManager.createResultBox(results, targetUrl, category, duration, reportPath);
    console.log(box);
  }

  static showExit() {
    console.clear();
    const box = boxManager.createExitBox();
    console.log(box);
  }
}

module.exports = { Logger };