"use strict";

const { chromium, firefox, webkit } = require("playwright");

class BrowserManager {
  constructor(config, args) {
    this.config = config;
    this.headed = args.headed;
    this.browser = null;
  }

  async launch() {
    const engineMap = { chromium, firefox, webkit };
    const engine = engineMap[this.config.browser?.type] || chromium;
    
    this.browser = await engine.launch({ 
      headless: !this.headed && this.config.scanner.headless !== false,
      args: this.config.browser?.args || []
    });
    
    return this.browser;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async createContext() {
    return await this.browser.newContext({ 
      userAgent: this.config.scanner.user_agent,
      ignoreHTTPSErrors: true 
    });
  }

  async createPage(context) {
    const page = await context.newPage();
    await page.route("**/*.{png,jpg,jpeg,gif,woff,woff2,svg,css,ico,font}", (route) => route.abort());
    return page;
  }
}

module.exports = { BrowserManager };