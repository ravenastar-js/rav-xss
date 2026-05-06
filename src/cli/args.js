"use strict";

const parseArgs = () => {
  const args = process.argv.slice(2);
  return {
    help: args.includes("--help") || args.includes("-h"),
    configure: args.includes("--configure"),
    verbose: args.includes("--verbose") || args.includes("-v"),
    url: getArgValue(args, "--url"),
    category: getArgValue(args, "--category"),
    delay: parseInt(getArgValue(args, "--delay") || "0", 10)
  };
};

const getArgValue = (args, flag) => {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith("--")) {
    return args[idx + 1];
  }
  return null;
};

const hasHelp = (args) => args.help;
const shouldConfigure = (args) => args.configure;

module.exports = { parseArgs, hasHelp, shouldConfigure };