"use strict";

const chalk = require("chalk");

const showHelp = () => {
  console.log(chalk.cyan(`
  ${chalk.bold('🛡️  RAV XSS — Reflected XSS Scanner')}

  ${chalk.hex('#a78bfa').bold('Usage:')}
    rav-xss
    rav-xss [options]

  ${chalk.hex('#7ec8e3').bold('Options:')}
    --url <url>         Target URL with [XSS] placeholder
    --category <name>   Payload category (Basic, FilterEvasion, Polyglots, WAFBypass)
    --delay <ms>        Delay between requests (default: 500ms)
    --verbose, -v       Show detailed output
    --help, -h          Display this help message
    --configure         Interactive configuration wizard
    --open-reports, -r  Open reports folder in file explorer

  ${chalk.hex('#7ec8e3').bold('Examples:')}
    rav-xss
    rav-xss --url "https://example.com/page?q=[XSS]" --category Basic
    rav-xss --configure
    rav-xss --open-reports
    rav-xss -r
  `));
};

module.exports = { showHelp };