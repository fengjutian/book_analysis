import { ipcRenderer, contextBridge } from 'electron'

// Markdown 类型定义
export interface Markdown {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('api', {
  // 获取所有 Markdown 文件
  getAllMarkdowns: () => ipcRenderer.invoke('get-all-markdowns'),
  // 根据 ID 获取 Markdown 文件
  getMarkdownById: (id: number) => ipcRenderer.invoke('get-markdown-by-id', id),
  // 创建 Markdown 文件
  createMarkdown: (markdown: { title: string; content: string }) => ipcRenderer.invoke('create-markdown', markdown.title, markdown.content),
  // 更新 Markdown 文件
  updateMarkdown: (id: number, markdown: { title: string; content: string }) => ipcRenderer.invoke('update-markdown', id, markdown.title, markdown.content),
  // 删除 Markdown 文件
  deleteMarkdown: (id: number) => ipcRenderer.invoke('delete-markdown', id),

  // 通用 IPC 方法
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})
