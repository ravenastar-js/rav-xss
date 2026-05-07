"use strict";

const boxen = require("boxen");
const { colors, theme } = require("../config/colors");
const packageInfo = require("./packageInfo");

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
    const version = packageInfo.version || "1.0.0";
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
      `${colors.icon.version} ${colors.muted("Version:")} ${colors.primary.bold("v" + version)}`,
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

  /**
 * 📊 Cria box de resultado do scan
 * @param {Object} results - Resultados do scan
 * @param {string} targetUrl - URL alvo
 * @param {string} category - Categoria testada
 * @param {string} duration - Duração do scan
 * @param {string} reportPath - Caminho do relatório
 * @param {string} reportDir - Diretório de relatórios
 * @returns {string} Box formatado
 */
  createResultBox(results, targetUrl, category, duration, reportPath, reportDir) {
    const hasVulns = results.vulns_found > 0;
    const statusIcon = hasVulns ? colors.icon.error : colors.icon.success;
    const statusColor = hasVulns ? colors.error : colors.success;
    const statusText = hasVulns ? `${results.vulns_found} XSS FOUND` : "ALL CLEAN";

    const isTermux = this.detectTermux();
    const maxWidth = isTermux ? 80 : 80;
    const boxWidth = isTermux ? 90 : 100;

    const displayReportPath = this.wrapPath(reportPath, maxWidth, "Report");
    const displayReportDir = this.wrapPath(reportDir, maxWidth, "Reports folder");

    const contentLines = [
      `${colors.action.bold(`${statusIcon}  SCAN COMPLETE`)}`,
      "",
      `${colors.muted("Target")}    ${colors.url(this.truncateUrl(targetUrl, maxWidth))}`,
      `${colors.muted("Category")}  ${colors.highlight(category)}`,
      `${colors.muted("Tests")}     ${colors.primary.bold(String(results.total_tests))}`,
      `${colors.muted("Duration")}  ${colors.highlight.bold(duration + "s")}`,
      `${colors.muted("Result")}    ${statusColor.bold(statusText)}`,
      "",
      `${colors.muted("📄 Report:")}`,
      `${colors.link(displayReportPath)}`,
    ];

    if (reportDir) {
      contentLines.push("");
      contentLines.push(`${colors.muted("📂 Reports folder:")}`);
      contentLines.push(`${colors.dim(displayReportDir)}`);
    }

    contentLines.push("");
    contentLines.push(`${colors.dim("─".repeat(50))}`);
    contentLines.push("");

    if (isTermux && reportDir) {
      contentLines.push(`${colors.muted("📋 List reports (Termux):")}`);
      contentLines.push(`${colors.action.bold(`  ls -la ${reportDir}/`)}`);
      contentLines.push("");
    }

    contentLines.push(`${colors.text("📁 To open reports folder:")}`);
    contentLines.push(`${colors.action.bold("  rav-xss --open-reports")}`);
    contentLines.push(`${colors.muted("  or")}`);
    contentLines.push(`${colors.action.bold("  rav-xss -r")}`);

    return this.createBox(contentLines.join("\n"), {
      borderStyle: "double",
      padding: isTermux ? { top: 1, bottom: 1, left: 2, right: 2 } : 2,
      margin: { top: 2, bottom: 1 },
      borderColor: hasVulns ? theme.border.error : theme.border.success,
      width: isTermux ? boxWidth : undefined
    });
  }

  /**
   * 📱 Detecta se está executando no Termux
   * @returns {boolean} true se estiver no Termux
   */
  detectTermux() {
    if (process.env.TERMUX_VERSION) return true;
    if (process.env.PREFIX?.includes("com.termux")) return true;

    try {
      const os = require("os");
      const hostname = os.hostname();
      if (hostname && (
        hostname.toLowerCase().includes("termux") ||
        hostname.toLowerCase().includes("android")
      )) return true;
    } catch (e) { }

    try {
      const fs = require("fs");
      if (fs.existsSync("/data/data/com.termux")) return true;
    } catch (e) { }

    return false;
  }

  /**
   * 📏 Formata caminho com quebra de linha se necessário
   * @param {string} filePath - Caminho completo
   * @param {number} maxLength - Tamanho máximo por linha
   * @param {string} label - Rótulo para indentação
   * @returns {string} Caminho formatado
   */
  wrapPath(filePath, maxLength = 55, label = "") {
    if (!filePath) return "N/A";

    const indent = " ".repeat(14);

    if (filePath.length <= maxLength) {
      return filePath;
    }

    const parts = [];
    let remaining = filePath;
    let firstLine = true;

    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        parts.push(remaining);
        break;
      }

      let splitPos = remaining.lastIndexOf("/", maxLength);
      if (splitPos === -1 || splitPos < maxLength / 2) {
        splitPos = remaining.lastIndexOf("\\", maxLength);
      }
      if (splitPos === -1 || splitPos < maxLength / 2) {
        splitPos = maxLength;
      }

      parts.push(remaining.substring(0, splitPos + 1));
      remaining = remaining.substring(splitPos + 1);
      firstLine = false;
    }

    const formattedParts = parts.map((part, index) => {
      if (index === 0) return part;
      return indent + part;
    });

    return formattedParts.join("\n");
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

  /**
   * 🔗 Trunca a URL para exibição compacta
   * @param {string} url - URL completa
   * @param {number} maxLength - Comprimento máximo
   * @returns {string} URL truncada
   */
  truncateUrl(url, maxLength = 55) {
    if (!url) return "N/A";
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + "...";
  }
}

module.exports = new BoxManager();