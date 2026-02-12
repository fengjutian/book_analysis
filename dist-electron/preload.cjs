"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  // 获取所有 Markdown 文件
  getAllMarkdowns: () => electron.ipcRenderer.invoke("get-all-markdowns"),
  // 根据 ID 获取 Markdown 文件
  getMarkdownById: (id) => electron.ipcRenderer.invoke("get-markdown-by-id", id),
  // 创建 Markdown 文件
  createMarkdown: (title, content) => electron.ipcRenderer.invoke("create-markdown", title, content),
  // 更新 Markdown 文件
  updateMarkdown: (id, title, content) => electron.ipcRenderer.invoke("update-markdown", id, title, content),
  // 删除 Markdown 文件
  deleteMarkdown: (id) => electron.ipcRenderer.invoke("delete-markdown", id),
  // 通用 IPC 方法
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
});
