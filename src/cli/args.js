"use strict";

/**
 * 🔍 Analisa os argumentos da linha de comando
 * @returns {Object} Argumentos parseados
 */
const parseArgs = () => {
  const args = process.argv.slice(2);
  return {
    headed: args.includes("--headed"),
    verbose: args.includes("--verbose") || args.includes("-v"),
    help: args.includes("--help") || args.includes("-h"),
    configure: args.includes("--configure"),
    openReports: args.includes("--open-reports") || args.includes("-r"),
    url: getArgValue(args, "--url"),
    category: getArgValue(args, "--category"),
    mode: getArgValue(args, "--mode"),
    delay: parseInt(getArgValue(args, "--delay") || "0", 10)
  };
};

/**
 * 🔍 Obtém o valor de um argumento
 * @param {Array} args - Lista de argumentos
 * @param {string} flag - Nome da flag
 * @returns {string|null} Valor do argumento ou null
 */
const getArgValue = (args, flag) => {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith("--")) {
    return args[idx + 1];
  }
  return null;
};

/**
 * ❓ Verifica se a flag de ajuda foi passada
 * @param {Object} args - Argumentos parseados
 * @returns {boolean} true se --help ou -h foi passado
 */
const hasHelp = (args) => args.help;

/**
 * ⚙️ Verifica se a flag de configuração foi passada
 * @param {Object} args - Argumentos parseados
 * @returns {boolean} true se --configure foi passado
 */
const shouldConfigure = (args) => args.configure;

/**
 * 📁 Verifica se a flag de abrir relatórios foi passada
 * @param {Object} args - Argumentos parseados
 * @returns {boolean} true se --open-reports ou -r foi passado
 */
const shouldOpenReports = (args) => args.openReports;

module.exports = { parseArgs, hasHelp, shouldConfigure, shouldOpenReports };