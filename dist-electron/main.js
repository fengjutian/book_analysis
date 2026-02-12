import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as require$$0 from "path";
import require$$0__default from "path";
import require$$0$1 from "fs";
import require$$2 from "events";
import require$$0$2 from "util";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var sqlite3$1 = { exports: {} };
function commonjsRequire(path2) {
  throw new Error('Could not dynamically require "' + path2 + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var bindings = { exports: {} };
var sep = require$$0__default.sep || "/";
var fileUriToPath_1 = fileUriToPath;
function fileUriToPath(uri) {
  if ("string" != typeof uri || uri.length <= 7 || "file://" != uri.substring(0, 7)) {
    throw new TypeError("must pass in a file:// URI to convert to a file path");
  }
  var rest = decodeURI(uri.substring(7));
  var firstSlash = rest.indexOf("/");
  var host = rest.substring(0, firstSlash);
  var path2 = rest.substring(firstSlash + 1);
  if ("localhost" == host) host = "";
  if (host) {
    host = sep + sep + host;
  }
  path2 = path2.replace(/^(.+)\|/, "$1:");
  if (sep == "\\") {
    path2 = path2.replace(/\//g, "\\");
  }
  if (/^.+\:/.test(path2)) ;
  else {
    path2 = sep + path2;
  }
  return host + path2;
}
(function(module, exports$1) {
  var fs = require$$0$1, path2 = require$$0__default, fileURLToPath2 = fileUriToPath_1, join = path2.join, dirname = path2.dirname, exists = fs.accessSync && function(path22) {
    try {
      fs.accessSync(path22);
    } catch (e) {
      return false;
    }
    return true;
  } || fs.existsSync || path2.existsSync, defaults = {
    arrow: process.env.NODE_BINDINGS_ARROW || " → ",
    compiled: process.env.NODE_BINDINGS_COMPILED_DIR || "compiled",
    platform: process.platform,
    arch: process.arch,
    nodePreGyp: "node-v" + process.versions.modules + "-" + process.platform + "-" + process.arch,
    version: process.versions.node,
    bindings: "bindings.node",
    try: [
      // node-gyp's linked version in the "build" dir
      ["module_root", "build", "bindings"],
      // node-waf and gyp_addon (a.k.a node-gyp)
      ["module_root", "build", "Debug", "bindings"],
      ["module_root", "build", "Release", "bindings"],
      // Debug files, for development (legacy behavior, remove for node v0.9)
      ["module_root", "out", "Debug", "bindings"],
      ["module_root", "Debug", "bindings"],
      // Release files, but manually compiled (legacy behavior, remove for node v0.9)
      ["module_root", "out", "Release", "bindings"],
      ["module_root", "Release", "bindings"],
      // Legacy from node-waf, node <= 0.4.x
      ["module_root", "build", "default", "bindings"],
      // Production "Release" buildtype binary (meh...)
      ["module_root", "compiled", "version", "platform", "arch", "bindings"],
      // node-qbs builds
      ["module_root", "addon-build", "release", "install-root", "bindings"],
      ["module_root", "addon-build", "debug", "install-root", "bindings"],
      ["module_root", "addon-build", "default", "install-root", "bindings"],
      // node-pre-gyp path ./lib/binding/{node_abi}-{platform}-{arch}
      ["module_root", "lib", "binding", "nodePreGyp", "bindings"]
    ]
  };
  function bindings2(opts) {
    if (typeof opts == "string") {
      opts = { bindings: opts };
    } else if (!opts) {
      opts = {};
    }
    Object.keys(defaults).map(function(i2) {
      if (!(i2 in opts)) opts[i2] = defaults[i2];
    });
    if (!opts.module_root) {
      opts.module_root = exports$1.getRoot(exports$1.getFileName());
    }
    if (path2.extname(opts.bindings) != ".node") {
      opts.bindings += ".node";
    }
    var requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : commonjsRequire;
    var tries = [], i = 0, l = opts.try.length, n, b, err;
    for (; i < l; i++) {
      n = join.apply(
        null,
        opts.try[i].map(function(p) {
          return opts[p] || p;
        })
      );
      tries.push(n);
      try {
        b = opts.path ? requireFunc.resolve(n) : requireFunc(n);
        if (!opts.path) {
          b.path = n;
        }
        return b;
      } catch (e) {
        if (e.code !== "MODULE_NOT_FOUND" && e.code !== "QUALIFIED_PATH_RESOLUTION_FAILED" && !/not find/i.test(e.message)) {
          throw e;
        }
      }
    }
    err = new Error(
      "Could not locate the bindings file. Tried:\n" + tries.map(function(a) {
        return opts.arrow + a;
      }).join("\n")
    );
    err.tries = tries;
    throw err;
  }
  module.exports = exports$1 = bindings2;
  exports$1.getFileName = function getFileName(calling_file) {
    var origPST = Error.prepareStackTrace, origSTL = Error.stackTraceLimit, dummy = {}, fileName;
    Error.stackTraceLimit = 10;
    Error.prepareStackTrace = function(e, st) {
      for (var i = 0, l = st.length; i < l; i++) {
        fileName = st[i].getFileName();
        if (fileName !== __filename) {
          if (calling_file) {
            if (fileName !== calling_file) {
              return;
            }
          } else {
            return;
          }
        }
      }
    };
    Error.captureStackTrace(dummy);
    dummy.stack;
    Error.prepareStackTrace = origPST;
    Error.stackTraceLimit = origSTL;
    var fileSchema = "file://";
    if (fileName.indexOf(fileSchema) === 0) {
      fileName = fileURLToPath2(fileName);
    }
    return fileName;
  };
  exports$1.getRoot = function getRoot(file) {
    var dir = dirname(file), prev;
    while (true) {
      if (dir === ".") {
        dir = process.cwd();
      }
      if (exists(join(dir, "package.json")) || exists(join(dir, "node_modules"))) {
        return dir;
      }
      if (prev === dir) {
        throw new Error(
          'Could not find module root given file: "' + file + '". Do you have a `package.json` file? '
        );
      }
      prev = dir;
      dir = join(dir, "..");
    }
  };
})(bindings, bindings.exports);
var bindingsExports = bindings.exports;
var sqlite3Binding = bindingsExports("node_sqlite3.node");
var trace = {};
var hasRequiredTrace;
function requireTrace() {
  if (hasRequiredTrace) return trace;
  hasRequiredTrace = 1;
  const util = require$$0$2;
  function extendTrace(object, property, pos) {
    const old = object[property];
    object[property] = function() {
      const error = new Error();
      const name = object.constructor.name + "#" + property + "(" + Array.prototype.slice.call(arguments).map(function(el) {
        return util.inspect(el, false, 0);
      }).join(", ") + ")";
      if (typeof pos === "undefined") pos = -1;
      if (pos < 0) pos += arguments.length;
      const cb = arguments[pos];
      if (typeof arguments[pos] === "function") {
        arguments[pos] = function replacement() {
          const err = arguments[0];
          if (err && err.stack && !err.__augmented) {
            err.stack = filter(err).join("\n");
            err.stack += "\n--> in " + name;
            err.stack += "\n" + filter(error).slice(1).join("\n");
            err.__augmented = true;
          }
          return cb.apply(this, arguments);
        };
      }
      return old.apply(this, arguments);
    };
  }
  trace.extendTrace = extendTrace;
  function filter(error) {
    return error.stack.split("\n").filter(function(line) {
      return line.indexOf(__filename) < 0;
    });
  }
  return trace;
}
(function(module, exports$1) {
  const path2 = require$$0__default;
  const sqlite32 = sqlite3Binding;
  const EventEmitter = require$$2.EventEmitter;
  module.exports = sqlite32;
  function normalizeMethod(fn) {
    return function(sql) {
      let errBack;
      const args = Array.prototype.slice.call(arguments, 1);
      if (typeof args[args.length - 1] === "function") {
        const callback = args[args.length - 1];
        errBack = function(err) {
          if (err) {
            callback(err);
          }
        };
      }
      const statement = new Statement(this, sql, errBack);
      return fn.call(this, statement, args);
    };
  }
  function inherits(target, source) {
    for (const k in source.prototype)
      target.prototype[k] = source.prototype[k];
  }
  sqlite32.cached = {
    Database: function(file, a, b) {
      if (file === "" || file === ":memory:") {
        return new Database(file, a, b);
      }
      let db2;
      file = path2.resolve(file);
      if (!sqlite32.cached.objects[file]) {
        db2 = sqlite32.cached.objects[file] = new Database(file, a, b);
      } else {
        db2 = sqlite32.cached.objects[file];
        const callback = typeof a === "number" ? b : a;
        if (typeof callback === "function") {
          let cb = function() {
            callback.call(db2, null);
          };
          if (db2.open) process.nextTick(cb);
          else db2.once("open", cb);
        }
      }
      return db2;
    },
    objects: {}
  };
  const Database = sqlite32.Database;
  const Statement = sqlite32.Statement;
  const Backup = sqlite32.Backup;
  inherits(Database, EventEmitter);
  inherits(Statement, EventEmitter);
  inherits(Backup, EventEmitter);
  Database.prototype.prepare = normalizeMethod(function(statement, params) {
    return params.length ? statement.bind.apply(statement, params) : statement;
  });
  Database.prototype.run = normalizeMethod(function(statement, params) {
    statement.run.apply(statement, params).finalize();
    return this;
  });
  Database.prototype.get = normalizeMethod(function(statement, params) {
    statement.get.apply(statement, params).finalize();
    return this;
  });
  Database.prototype.all = normalizeMethod(function(statement, params) {
    statement.all.apply(statement, params).finalize();
    return this;
  });
  Database.prototype.each = normalizeMethod(function(statement, params) {
    statement.each.apply(statement, params).finalize();
    return this;
  });
  Database.prototype.map = normalizeMethod(function(statement, params) {
    statement.map.apply(statement, params).finalize();
    return this;
  });
  Database.prototype.backup = function() {
    let backup;
    if (arguments.length <= 2) {
      backup = new Backup(this, arguments[0], "main", "main", true, arguments[1]);
    } else {
      backup = new Backup(this, arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
    }
    backup.retryErrors = [sqlite32.BUSY, sqlite32.LOCKED];
    return backup;
  };
  Statement.prototype.map = function() {
    const params = Array.prototype.slice.call(arguments);
    const callback = params.pop();
    params.push(function(err, rows) {
      if (err) return callback(err);
      const result = {};
      if (rows.length) {
        const keys = Object.keys(rows[0]);
        const key = keys[0];
        if (keys.length > 2) {
          for (let i = 0; i < rows.length; i++) {
            result[rows[i][key]] = rows[i];
          }
        } else {
          const value = keys[1];
          for (let i = 0; i < rows.length; i++) {
            result[rows[i][key]] = rows[i][value];
          }
        }
      }
      callback(err, result);
    });
    return this.all.apply(this, params);
  };
  let isVerbose = false;
  const supportedEvents = ["trace", "profile", "change"];
  Database.prototype.addListener = Database.prototype.on = function(type) {
    const val = EventEmitter.prototype.addListener.apply(this, arguments);
    if (supportedEvents.indexOf(type) >= 0) {
      this.configure(type, true);
    }
    return val;
  };
  Database.prototype.removeListener = function(type) {
    const val = EventEmitter.prototype.removeListener.apply(this, arguments);
    if (supportedEvents.indexOf(type) >= 0 && !this._events[type]) {
      this.configure(type, false);
    }
    return val;
  };
  Database.prototype.removeAllListeners = function(type) {
    const val = EventEmitter.prototype.removeAllListeners.apply(this, arguments);
    if (supportedEvents.indexOf(type) >= 0) {
      this.configure(type, false);
    }
    return val;
  };
  sqlite32.verbose = function() {
    if (!isVerbose) {
      const trace2 = requireTrace();
      [
        "prepare",
        "get",
        "run",
        "all",
        "each",
        "map",
        "close",
        "exec"
      ].forEach(function(name) {
        trace2.extendTrace(Database.prototype, name);
      });
      [
        "bind",
        "get",
        "run",
        "all",
        "each",
        "map",
        "reset",
        "finalize"
      ].forEach(function(name) {
        trace2.extendTrace(Statement.prototype, name);
      });
      isVerbose = true;
    }
    return sqlite32;
  };
})(sqlite3$1);
var sqlite3Exports = sqlite3$1.exports;
const sqlite3 = /* @__PURE__ */ getDefaultExportFromCjs(sqlite3Exports);
const dbPath = require$$0.join(app.getPath("userData"), "markdown.db");
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
          ...row,
          content: typeof row.content === "string" ? JSON.parse(row.content) : row.content
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
          ...row,
          content: typeof row.content === "string" ? JSON.parse(row.content) : row.content
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
    const contentJson = typeof content === "string" ? content : JSON.stringify(content);
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
                ...row,
                content: typeof row.content === "string" ? JSON.parse(row.content) : row.content
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
    const contentJson = typeof content === "string" ? content : JSON.stringify(content);
    db.run(
      "UPDATE markdowns SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [title, contentJson, id],
      function(err) {
        if (err) {
          reject(err);
        } else {
          db.get("SELECT * FROM markdowns WHERE id = ?", [id], (err2, row) => {
            if (err2) {
              reject(err2);
            } else if (row) {
              const markdown = {
                ...row,
                content: typeof row.content === "string" ? JSON.parse(row.content) : row.content
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
const __filename$1 = fileURLToPath(import.meta.url);
path.dirname(__filename$1);
const appRoot = process.cwd();
process.env.APP_ROOT = appRoot;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(appRoot, "dist-electron");
const RENDERER_DIST = path.join(appRoot, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(appRoot, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(appRoot, "dist-electron", "preload.cjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  initDatabase();
  createWindow();
});
ipcMain.handle("get-all-markdowns", () => {
  return getAllMarkdowns();
});
ipcMain.handle("get-markdown-by-id", (_event, id) => {
  return getMarkdownById(id);
});
ipcMain.handle("create-markdown", (_event, title, content) => {
  return createMarkdown(title, content);
});
ipcMain.handle("update-markdown", (_event, id, title, content) => {
  return updateMarkdown(id, title, content);
});
ipcMain.handle("delete-markdown", (_event, id) => {
  return deleteMarkdown(id);
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
