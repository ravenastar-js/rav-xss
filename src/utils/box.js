"use strict";

const boxen = require("boxen");
const { colors, theme } = require("../config/colors");

/**
 * 📦 Box Manager - Cria caixas estilizadas para o RAV XSS
 */
class BoxManager {
  constructor() {
    this.appName = "RAV XSS";
    this.appVersion = "1.0.0";
    this.appUrl = "https://ravenastar.com";
  }

  createBox(content, options = {}) {
    const defaultOptions = {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: theme.border.primary,
      textAlignment: "left"
    };
    
    try {
      return boxen(content, { ...defaultOptions, ...options });
    } catch (error) {
      const width = options.width || 60;
      const border = "─".repeat(width);
      return `\n┌${border}┐\n${content}\n└${border}┘\n`;
    }
  }

  createWelcomeBox(config, totalPayloads, category, targetUrl) {
    const version = config?.version || this.appVersion;
    
    const contentLines = [];
    
    try {
      const figlet = require("figlet");
      const bannerText = figlet.textSync("RAV XSS", {
        font: "ANSI Shadow",
        horizontalLayout: "default",
        verticalLayout: "default"
      });
      contentLines.push(colors.action(bannerText));
    } catch (e) {
      contentLines.push(colors.action.bold("⚡ RAV XSS ⚡"));
    }
    
    contentLines.push("");
    contentLines.push(`${colors.icon.link} ${colors.link(this.appUrl)}`);
    contentLines.push("");
    
    const infoItems = [
      `${colors.icon.version} ${colors.muted("Version:")} ${colors.primary.bold(version)}`,
      `${colors.icon.payload} ${colors.muted("Payloads:")} ${colors.primary.bold(String(totalPayloads))}`,
      `${colors.icon.category} ${colors.muted("Category:")} ${colors.highlight(category || "Not selected")}\n`,
      `${colors.icon.target} ${colors.muted("Target:")} ${colors.url(this.truncateUrl(targetUrl))}`
    ];
    
    contentLines.push(infoItems.join(`  ${colors.dim("│")}  `));
    
    const content = contentLines.join("\n");
    
    return this.createBox(content, {
      borderStyle: "round",
      borderColor: theme.border.primary,
      padding: 2,
      margin: 1,
      textAlignment: "center",
      title: colors.info("🛡️  Bug Bounty Edition"),
      titleAlignment: "center"
    });
  }

  createTargetBox(target, index, total) {
    const formattedContent = [
      `${colors.primary.bold(`Target ${index + 1} of ${total}`)} ${colors.dim("•")} ${colors.title(target.name || "CLI Target")}`,
      colors.text(target.url)
    ].join("\n");
    
    return this.createBox(formattedContent, {
      borderStyle: "round",
      borderColor: theme.border.info,
      padding: 1,
      margin: { top: 1, bottom: 1 }
    });
  }

  createResultBox(results, targetUrl, category, duration, reportPath) {
    const hasVulns = results.vulns_found > 0;
    const statusIcon = hasVulns ? colors.icon.error : colors.icon.success;
    const statusColor = hasVulns ? colors.error : colors.success;
    const statusText = hasVulns ? `${results.vulns_found} XSS FOUND` : "ALL CLEAN";
    
    const content = [
      `${colors.action.bold(`${statusIcon}  SCAN COMPLETE`)}`,
      "",
      `${colors.muted("Target")}    ${colors.url(this.truncateUrl(targetUrl))}`,
      `${colors.muted("Category")}  ${colors.highlight(category)}`,
      `${colors.muted("Tests")}     ${colors.primary.bold(String(results.total_tests))}`,
      `${colors.muted("Duration")}  ${colors.highlight.bold(duration + "s")}`,
      `${colors.muted("Result")}    ${statusColor.bold(statusText)}`,
      `${colors.muted("Report")}    ${colors.link(reportPath)}`
    ].join("\n");
    
    return this.createBox(content, {
      borderStyle: "double",
      padding: 2,
      margin: { top: 2, bottom: 1 },
      borderColor: hasVulns ? theme.border.error : theme.border.success
    });
  }

  createExitBox() {
    const content = [
      colors.highlight.bold("👋 GOODBYE!"),
      "",
      colors.text("XSS Bounty Scanner"),
      colors.muted("Authorized testing only"),
      "",
      `${colors.icon.link} ${colors.link(this.appUrl)}`
    ].join("\n");
    
    return this.createBox(content, {
      borderStyle: "round",
      borderColor: theme.border.warning,
      padding: 2,
      margin: 1,
      textAlignment: "center"
    });
  }

  truncateUrl(url, maxLength = 55) {
    if (!url) return "N/A";
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + "...";
  }
}

module.exports = new BoxManager();