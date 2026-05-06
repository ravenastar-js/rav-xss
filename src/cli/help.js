"use strict";

const chalk = require("chalk");

const showHelp = () => {
  console.log(chalk.cyan(`
  ${chalk.bold('🛡️  XSS Bounty Scanner — Category-Based Edition')}

  ${chalk.hex('#a78bfa').bold('Usage:')}
    npm run scan [options]
    node src/index.js [options]

  ${chalk.hex('#7ec8e3').bold('Options:')}
    --url <url>           Target URL with [XSS] placeholder
    --category <name>     Payload category to use (folder name)
    --delay <ms>          Delay between requests (ms)
    --verbose, -v         Show detailed output
    --help, -h            Display this help message
    --configure           Interactive configuration wizard

  ${chalk.hex('#7ec8e3').bold('Examples:')}
    node src/index.js --url "http://example.com/page?q=[XSS]" --category Basic
    npm run configure
  `));
};

module.exports = { showHelp };