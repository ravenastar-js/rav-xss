"use strict";

const axios = require("axios");
const os = require("os");
const fs = require("fs");
const path = require("path");

let playwright = null;
try {
  if (!isTermux()) {
    playwright = require("playwright");
  }
} catch (e) {
  playwright = null;
}

/**
 * 🖥️ Gerenciador de Modos de Execução
 * 
 * Gerencia requisições HTTP via Axios (Modo Normal) e navegação
 * via Playwright (Modo Navegador) com detecção automática de ambiente.
 */
class BrowserManager {
  constructor(config, args) {
    this.config = config;
    this.args = args;
    this.mode = args.mode || config.mode || "axios";

    if (isTermux()) {
      this.mode = "axios";
    }

    if (this.mode === "playwright" && !playwright) {
      this.mode = "axios";
    }

    this.browser = null;
    this.responses = [];
  }

  /**
   * 🚀 Inicializa o navegador Playwright
   * @returns {Promise<Object>} Instância do navegador
   */
  async launch() {
    if (this.mode !== "playwright") return null;

    const browserType = playwright.chromium;

    this.browser = await browserType.launch({
      headless: this.config.scanner.headless !== false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    return this.browser;
  }

  /**
   * 🔒 Fecha a instância do navegador
   * @returns {Promise<void>}
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * 🌐 Cria um novo contexto de navegação
   * @returns {Promise<Object>} Contexto do navegador
   */
  async createContext() {
    if (!this.browser) return null;

    return await this.browser.newContext({
      userAgent: this.config.scanner.user_agent,
      ignoreHTTPSErrors: true
    });
  }

  /**
   * 📄 Cria uma nova página com interceptação de recursos
   * @param {Object} context - Contexto do navegador
   * @returns {Promise<Object>} Página configurada
   */
  async createPage(context) {
    if (!context) return null;

    const page = await context.newPage();

    await page.route("**/*.{png,jpg,jpeg,gif,woff,woff2,svg,css,ico,font}",
      (route) => route.abort()
    );

    await page.route("**/*", (route, request) => {
      this.captureResponse(request);
      route.continue();
    });

    page.on("response", (response) => {
      this.capturePlaywrightResponse(response);
    });

    return page;
  }

  /**
   * 📡 Executa requisição HTTP no modo Axios
   * @param {string} url - URL alvo
   * @param {Object} options - Opções da requisição
   * @returns {Promise<Object>} Resposta da requisição
   */
  async axiosRequest(url, options = {}) {
    const config = {
      timeout: this.config.scanner.timeout_ms || 8000,
      headers: {
        "User-Agent": this.config.scanner.user_agent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        ...options.headers
      },
      validateStatus: () => true,
      maxRedirects: 5,
      ...options
    };

    try {
      const response = await axios.get(url, config);

      this.responses.push({
        url: url,
        status: response.status,
        headers: response.headers,
        body: response.data,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      return {
        status: 0,
        data: "",
        headers: {},
        error: error.message
      };
    }
  }

  /**
   * 🎭 Executa navegação no modo Playwright
   * @param {string} url - URL alvo
   * @param {Object} options - Opções de navegação
   * @returns {Promise<Object>} Resultado da navegação
   */
  async playwrightRequest(url, options = {}) {
    if (!this.browser) {
      await this.launch();
    }

    const context = await this.createContext();
    const page = await this.createPage(context);

    try {
      const response = await page.goto(url, {
        waitUntil: "networkidle",
        timeout: this.config.scanner.timeout_ms || 8000,
        ...options
      });

      const body = await page.content();

      this.responses.push({
        url: url,
        status: response?.status() || 0,
        headers: response?.headers() || {},
        body: body,
        timestamp: new Date().toISOString()
      });

      const result = {
        status: response?.status() || 0,
        data: body,
        headers: response?.headers() || {}
      };

      await context.close();
      return result;
    } catch (error) {
      await context.close();
      return {
        status: 0,
        data: "",
        headers: {},
        error: error.message
      };
    }
  }

  /**
   * 🎯 Executa requisição no modo apropriado
   * @param {string} url - URL alvo
   * @param {Object} options - Opções da requisição
   * @returns {Promise<Object>} Resposta da requisição
   */
  async request(url, options = {}) {
    if (this.mode === "playwright") {
      return await this.playwrightRequest(url, options);
    }

    return await this.axiosRequest(url, options);
  }

  /**
   * 🔍 Captura detalhes da requisição Playwright
   * @param {Object} request - Objeto de requisição Playwright
   */
  captureResponse(request) {
    if (!request) return;

    if (this.args.verbose) {
      console.log(`  📤 Request: ${request.method()} ${request.url()}`);
    }
  }

  /**
   * 📥 Captura detalhes da resposta Playwright
   * @param {Object} response - Objeto de resposta Playwright
   */
  capturePlaywrightResponse(response) {
    if (!response) return;

    if (this.args.verbose) {
      console.log(`  📥 Response: ${response.status()} ${response.url()}`);
    }
  }

  /**
   * 🧹 Limpa as respostas capturadas
   */
  clearResponses() {
    this.responses = [];
  }

  /**
   * 📊 Retorna as respostas capturadas
   * @returns {Array} Lista de respostas
   */
  getResponses() {
    return this.responses;
  }

  /**
   * 🔄 Alterna entre os modos de execução
   * @param {string} mode - Modo de execução ("axios" ou "playwright")
   * @returns {string} Modo configurado
   */
  setMode(mode) {
    if (mode === "playwright" && isTermux()) {
      mode = "axios";
    }

    if (mode === "playwright" && !playwright) {
      mode = "axios";
    }

    this.mode = mode;
    return this.mode;
  }

  /**
   * 📋 Retorna o modo atual
   * @returns {string} Modo de execução atual
   */
  getMode() {
    return this.mode;
  }

  /**
   * ✅ Verifica se o modo Playwright está disponível
   * @returns {boolean} true se disponível
   */
  isPlaywrightAvailable() {
    return !isTermux() && playwright !== null;
  }
}

/**
 * 📱 Verifica se está executando no Termux (Android)
 * @returns {boolean} true se estiver no Termux
 */
function isTermux() {
  if (process.env.TERMUX_VERSION) return true;
  if (process.env.PREFIX?.includes("com.termux")) return true;

  const hostname = os.hostname();
  if (hostname && (
    hostname.toLowerCase().includes("termux") ||
    hostname.toLowerCase().includes("android")
  )) return true;

  try {
    if (fs.existsSync("/data/data/com.termux")) return true;
  } catch (e) { }

  return false;
}

module.exports = { BrowserManager, isTermux };