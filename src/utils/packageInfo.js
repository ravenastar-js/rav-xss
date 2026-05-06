"use strict";

const fs = require("fs");
const path = require("path");

/**
 * 📄 Carrega informações do package.json
 */
class PackageInfo {
  constructor() {
    this.packageData = this.loadPackageInfo();
  }

  /**
   * Carrega informações do package.json
   * @returns {Object} Dados do package.json
   * @private
   */
  loadPackageInfo() {
    try {
      const possiblePaths = [
        path.join(__dirname, "..", "..", "package.json"),
        path.join(__dirname, "..", "package.json"),
        path.join(process.cwd(), "package.json"),
        path.join(__dirname, "package.json"),
      ];

      let packagePath = null;
      let packageJson = null;

      const triedPaths = [];

      for (const testPath of possiblePaths) {
        triedPaths.push(testPath);
        if (fs.existsSync(testPath)) {
          packagePath = testPath;
          packageJson = fs.readFileSync(testPath, "utf8");
          break;
        }
      }

      if (!packagePath || !packageJson) {
        throw new Error(
          `package.json not found!\n` +
          `Tried paths:\n` +
          triedPaths.map(p => `  - ${p} (${fs.existsSync(p) ? 'EXISTS' : 'NOT FOUND'})`).join("\n")
        );
      }

      const data = JSON.parse(packageJson);

      return {
        name: data.name || "rav-xss",
        version: data.version || "V1",
        wuser: "RavenaStar",
        site: "https://ravenastar.com",
        description: data.description || "⚙️ CLI/NPM | RAV XSS | 🎯 Basic Reflected XSS scanner for bug bounty programs.",
        author: data.author || "RavenaStar",
        license: data.license || "MIT",
        homepage: data.homepage || "https://github.com/ravenastar-js/rav-xss/"
      };
    } catch (error) {
      if (process.argv.includes("--verbose") || process.env.NODE_ENV === "development") {
        console.error("❌ Erro ao carregar package.json:", error.message);
      }
      return this.getFallbackInfo();
    }
  }

  /**
   * Informações de fallback
   * @returns {Object} Dados padrão
   */
  getFallbackInfo() {
    return {
      name: "rav-xss",
      version: "V1",
      wuser: "RavenaStar",
      site: "https://ravenastar.com",
      description: "⚙️ CLI/NPM | RAV XSS | 🎯 Basic Reflected XSS scanner for bug bounty programs.",
      author: "ravenastar-js",
      license: "MIT",
      homepage: "https://github.com/ravenastar-js/rav-xss/"
    };
  }

  /**
   * Força recarregar do disco (útil se o package.json foi atualizado)
   */
  reload() {
    this.packageData = this.loadPackageInfo();
    return this.packageData;
  }

  /**
   * Retorna todas as informações
   * @returns {Object} Todas as informações
   */
  get allInfo() {
    return this.packageData;
  }

  /**
   * Retorna o nome
   * @returns {string} Nome do pacote
   */
  get name() {
    return this.packageData.name;
  }

  /**
   * Retorna a versão
   * @returns {string} Versão
   */
  get version() {
    return this.packageData.version;
  }

  /**
   * Retorna a descrição
   * @returns {string} Descrição
   */
  get description() {
    return this.packageData.description;
  }

  /**
   * Retorna o autor
   * @returns {string} Autor
   */
  get author() {
    return this.packageData.author;
  }

  /**
   * Retorna o usuário/criador
   * @returns {string} wuser
   */
  get wuser() {
    return this.packageData.wuser;
  }

  /**
   * Retorna o site
   * @returns {string} Site
   */
  get site() {
    return this.packageData.site;
  }

  /**
   * Retorna a licença
   * @returns {string} Licença
   */
  get license() {
    return this.packageData.license;
  }

  /**
   * Retorna a homepage
   * @returns {string} Homepage
   */
  get homepage() {
    return this.packageData.homepage;
  }

  /**
   * Debug: Mostra qual caminho foi usado
   * @returns {string} Caminho do package.json
   */
  get debugPath() {
    try {
      const possiblePaths = [
        path.join(__dirname, "..", "..", "package.json"),
        path.join(__dirname, "..", "package.json"),
        path.join(process.cwd(), "package.json"),
        path.join(__dirname, "package.json"),
      ];

      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          return `FOUND: ${testPath}`;
        }
      }
      return "NOT FOUND in any path";
    } catch (e) {
      return "ERROR: " + e.message;
    }
  }
}

module.exports = new PackageInfo();