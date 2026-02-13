"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const path$1 = require("node:path");
const sqlite3 = require("sqlite3");
const path = require("path");
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
const db = new sqlite3.Database(dbPath);
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
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM markdowns ORDER BY updated_at DESC", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const markdowns = rows.map((row) => ({
          ...row
        }));
        resolve(markdowns);
      }
    });
  });
}
function getMarkdownById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM markdowns WHERE id = ?", [id], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        const markdown = {
          ...row
        };
        resolve(markdown);
      } else {
        resolve(void 0);
      }
    });
  });
}
function createMarkdown(title, content) {
  return new Promise((resolve, reject) => {
    const contentJson = typeof content === "string" ? content : content !== void 0 && content !== null ? JSON.stringify(content) : "";
    console.log("Creating markdown with content:", contentJson);
    db.run(
      "INSERT INTO markdowns (title, content) VALUES (?, ?)",
      [title, contentJson],
      function(err) {
        if (err) {
          reject(err);
        } else {
          db.get("SELECT * FROM markdowns WHERE id = ?", [this.lastID], (err2, row) => {
            if (err2) {
              reject(err2);
            } else if (row) {
              const markdown = {
                ...row
              };
              resolve(markdown);
            } else {
              reject(new Error("Failed to retrieve created markdown"));
            }
          });
        }
      }
    );
  });
}
function updateMarkdown(id, title, content) {
  return new Promise((resolve, reject) => {
    console.log("updateMarkdown called with:", { id, title, contentType: typeof content, content });
    const contentJson = typeof content === "string" ? content : content !== void 0 && content !== null ? JSON.stringify(content) : "";
    console.log("Updating markdown with content length:", contentJson.length);
    db.run(
      "UPDATE markdowns SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [title, contentJson, id],
      function(err) {
        if (err) {
          console.error("Update error:", err);
          reject(err);
        } else {
          console.log("Update successful, changes:", this.changes);
          db.get("SELECT * FROM markdowns WHERE id = ?", [id], (err2, row) => {
            if (err2) {
              reject(err2);
            } else if (row) {
              const markdown = {
                ...row
              };
              resolve(markdown);
            } else {
              resolve(void 0);
            }
          });
        }
      }
    );
  });
}
function deleteMarkdown(id) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM markdowns WHERE id = ?", [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0);
      }
    });
  });
}
const appRoot = process.cwd();
process.env.APP_ROOT = appRoot;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(appRoot, "dist-electron");
const RENDERER_DIST = path$1.join(appRoot, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(appRoot, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new electron.BrowserWindow({
    icon: path$1.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path$1.join(appRoot, "dist-electron", "preload.cjs")
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
  console.log("IPC update-markdown received:", { id, title, contentType: typeof content });
  return updateMarkdown(id, title, content);
});
electron.ipcMain.handle("delete-markdown", (_event, id) => {
  return deleteMarkdown(id);
});
exports.MAIN_DIST = MAIN_DIST;
exports.RENDERER_DIST = RENDERER_DIST;
exports.VITE_DEV_SERVER_URL = VITE_DEV_SERVER_URL;
