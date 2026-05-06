"use strict";

const fs = require("fs");
const path = require("path");
const { timestamp } = require("./helpers");

class Reporter {
  constructor(reportDir) {
    this.reportDir = path.resolve(reportDir);
  }

  generateTextReport(results, targetUrl) {
    const duration = ((new Date(results.scan_end) - new Date(results.scan_start)) / 1000).toFixed(1);
    let report = "";
    report += "═".repeat(60) + "\n";
    report += "  XSS REFLECTION SCANNER — REPORT\n";
    report += "═".repeat(60) + "\n\n";
    report += `  Date       : ${new Date(results.scan_start).toLocaleString("en-US")}\n`;
    report += `  Target     : ${targetUrl}\n`;
    report += `  Duration   : ${duration}s\n`;
    report += `  Tests      : ${results.total_tests}\n`;
    report += `  Vulnerable : ${results.vulns_found}\n`;
    report += "\n" + "─".repeat(60) + "\n\n";

    if (results.findings.length > 0) {
      report += "  FINDINGS:\n";
      report += "  " + "─".repeat(55) + "\n";
      for (const f of results.findings) {
        report += `\n  [#${f.index}] ${f.payload}\n`;
        report += `  URL: ${f.url}\n`;
      }
    } else {
      report += "  ✓ No reflected XSS detected.\n";
    }

    report += "\n" + "═".repeat(60) + "\n";
    report += `  Completed: ${new Date(results.scan_end).toLocaleString("en-US")}\n`;
    report += "  Authorized testing only.\n";
    report += "═".repeat(60) + "\n";
    return report;
  }

  saveReport(results, targetUrl) {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
    
    const ts = timestamp();
    const textReport = this.generateTextReport(results, targetUrl);
    const textPath = path.join(this.reportDir, `xss_report_${ts}.txt`).replace(/\\/g, "/");
    fs.writeFileSync(textPath, textReport);
    return { textPath };
  }
}

module.exports = { Reporter };