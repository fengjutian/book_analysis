"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const node_url = require("node:url");
const path$1 = require("node:path");
const Database = require("better-sqlite3");
const path = require("path");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const dbPath = path__namespace.join(electron.app.getPath("userData"), "markdown.db");
const db = new Database(dbPath);
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS markdowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
function getAllMarkdowns() {
  const stmt = db.prepare("SELECT * FROM markdowns ORDER BY updated_at DESC");
  return stmt.all();
}
function getMarkdownById(id) {
  const stmt = db.prepare("SELECT * FROM markdowns WHERE id = ?");
  return stmt.get(id);
}
function createMarkdown(title, content) {
  const stmt = db.prepare(
    "INSERT INTO markdowns (title, content) VALUES (?, ?) RETURNING *"
  );
  return stmt.get(title, content);
}
function updateMarkdown(id, title, content) {
  const stmt = db.prepare(
    "UPDATE markdowns SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
  );
  return stmt.get(title, content, id);
}
function deleteMarkdown(id) {
  const stmt = db.prepare("DELETE FROM markdowns WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}
const __filename$1 = node_url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.cjs", document.baseURI).href);
const __dirname$1 = path$1.dirname(__filename$1);
process.env.APP_ROOT = path$1.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new electron.BrowserWindow({
    icon: path$1.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path$1.resolve(__dirname$1, "..", "dist-electron", "preload.cjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
}
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
    win = null;
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
electron.app.whenReady().then(() => {
  initDatabase();
  createWindow();
});
electron.ipcMain.handle("get-all-markdowns", () => {
  return getAllMarkdowns();
});
electron.ipcMain.handle("get-markdown-by-id", (_event, id) => {
  return getMarkdownById(id);
});
electron.ipcMain.handle("create-markdown", (_event, title, content) => {
  return createMarkdown(title, content);
});
electron.ipcMain.handle("update-markdown", (_event, id, title, content) => {
  return updateMarkdown(id, title, content);
});
electron.ipcMain.handle("delete-markdown", (_event, id) => {
  return deleteMarkdown(id);
});
exports.MAIN_DIST = MAIN_DIST;
exports.RENDERER_DIST = RENDERER_DIST;
exports.VITE_DEV_SERVER_URL = VITE_DEV_SERVER_URL;
