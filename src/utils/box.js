"use strict";

const boxen = require("boxen");
const { colors, theme } = require("../config/colors");
const packageInfo = require("./packageInfo");

/**
 * 📦 Box Manager - Cria caixas estilizadas para o RAV XSS
 */
class BoxManager {

  get appInfo() {
    return packageInfo.allInfo;
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
    const version = packageInfo.version || "V1";
    const contentLines = [];
    
    contentLines.push(colors.info.bold("🛡️  Bug Bounty Edition"));
    contentLines.push(colors.dim("─".repeat(45)));
    contentLines.push("");
    
    try {
      const figlet = require("figlet");
      const bannerText = figlet.textSync(packageInfo.name.toUpperCase(), {
        font: "ANSI Shadow",
        horizontalLayout: "default",
        verticalLayout: "default"
      });
      contentLines.push(colors.action(bannerText));
    } catch (e) {
      contentLines.push(colors.action.bold(`⚡ ${packageInfo.name.toUpperCase()} ⚡`));
    }
    
    contentLines.push("");
    contentLines.push(`${colors.icon.link} ${colors.link(packageInfo.site)}`);
    contentLines.push("");
    
    const infoItems = [
      `${colors.icon.version} ${colors.muted("Version:")} ${colors.primary.bold(version)}`,
      `${colors.icon.payload} ${colors.muted("Payloads:")} ${colors.primary.bold(String(totalPayloads))}`,
      `${colors.icon.category} ${colors.muted("Category:")} ${colors.highlight(category || "Not selected")}`,
      `${colors.icon.target} ${colors.muted("Target:")} ${colors.url(this.truncateUrl(targetUrl))}`
    ];
    
    contentLines.push(infoItems.join(`\n`));
    
    const content = contentLines.join("\n");
    
    return this.createBox(content, {
      borderStyle: "round",
      borderColor: theme.border.primary,
      padding: {
        top: 1,
        bottom: 2,
        left: 3,
        right: 3
      },
      margin: 1,
      textAlignment: "center"
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
    
    const displayReportPath = reportPath.length > 50 
      ? "..." + reportPath.substring(reportPath.length - 47)
      : reportPath;
    
    const content = [
      `${colors.action.bold(`${statusIcon}  SCAN COMPLETE`)}`,
      "",
      `${colors.muted("Target")}    ${colors.url(this.truncateUrl(targetUrl))}`,
      `${colors.muted("Category")}  ${colors.highlight(category)}`,
      `${colors.muted("Tests")}     ${colors.primary.bold(String(results.total_tests))}`,
      `${colors.muted("Duration")}  ${colors.highlight.bold(duration + "s")}`,
      `${colors.muted("Result")}    ${statusColor.bold(statusText)}`,
      `${colors.muted("Report")}    ${colors.link(displayReportPath)}`
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
      colors.text(packageInfo.name),
      colors.muted("Authorized testing only"),
      "",
      `${colors.text("Feito com")} ${colors.danger("💚")} ${colors.text("por")} ${colors.primary.bold(packageInfo.wuser)}`,
      "",
      `${colors.icon.link} ${colors.link(packageInfo.site)}`
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