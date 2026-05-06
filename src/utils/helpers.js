"use strict";

const fs = require("fs");
const path = require("path");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return true;
};

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");

const loadPayloads = (filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  return content.split("\n").map(l => l.trim()).filter(Boolean);
};

module.exports = { sleep, ensureDir, timestamp, loadPayloads };