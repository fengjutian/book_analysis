import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { initDatabase, getAllMarkdowns, getMarkdownById, createMarkdown, updateMarkdown, deleteMarkdown } from './db'

// 使用 import.meta.url 来获取当前模块的路径
// const __filename = fileURLToPath(import.meta.url);

// 使用 process.cwd() 来获取当前工作目录
const appRoot = process.cwd();

// 设置应用根路径
process.env.APP_ROOT = appRoot

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(appRoot, 'dist-electron')
export const RENDERER_DIST = path.join(appRoot, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(appRoot, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(appRoot, 'dist-electron', 'preload.cjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // 在开发模式下打开开发者工具
    win.webContents.openDevTools()
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  initDatabase();
  createWindow();
})

// --------- IPC 事件处理 ---------
// 获取所有 Markdown 文件
ipcMain.handle('get-all-markdowns', () => {
  return getAllMarkdowns();
});

// 根据 ID 获取 Markdown 文件
ipcMain.handle('get-markdown-by-id', (_event, id) => {
  return getMarkdownById(id);
});

// 创建 Markdown 文件
ipcMain.handle('create-markdown', (_event, data) => {
  console.log('IPC create-markdown received:', data);
  return createMarkdown(data.title, data.content);
});

// 更新 Markdown 文件
ipcMain.handle('update-markdown', (_event, data) => {
  console.log('IPC update-markdown received:', data);
  return updateMarkdown(data.id, data.title, data.content);
});

// 删除 Markdown 文件
ipcMain.handle('delete-markdown', (_event, id) => {
  return deleteMarkdown(id);
});

// 导出单个 Markdown 文件
ipcMain.handle('export-markdown', async (_event, { id, fileName }) => {
  const markdown = await getMarkdownById(id);
  if (!markdown) {
    throw new Error(`Markdown with ID ${id} not found`);
  }

  const { canceled, filePath } = await dialog.showSaveDialog(win!, {
    defaultPath: fileName || `markdown-${id}.json`,
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (canceled || !filePath) {
    return { success: false, message: 'Save dialog canceled' };
  }

  try {
    // 将内容转换为 JSON 字符串（如果已经是字符串则保持原样）
    const content = typeof markdown.content === 'string' ? markdown.content : JSON.stringify(markdown.content);
    const exportData = {
      ...markdown,
      content
    };
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Failed to export markdown:', error);
    throw new Error(`Failed to export markdown: ${error.message}`);
  }
});

// 导出所有 Markdown 文件
ipcMain.handle('export-all-markdowns', async (_event, { fileName }) => {
  const markdowns = await getAllMarkdowns();

  const { canceled, filePath } = await dialog.showSaveDialog(win!, {
    defaultPath: fileName || 'all-markdowns.json',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (canceled || !filePath) {
    return { success: false, message: 'Save dialog canceled' };
  }

  try {
    // 处理每个文档的内容字段
    const exportData = markdowns.map(md => ({
      ...md,
      content: typeof md.content === 'string' ? md.content : JSON.stringify(md.content)
    }));
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf8');
    return { success: true, filePath, count: markdowns.length };
  } catch (error) {
    console.error('Failed to export all markdowns:', error);
    throw new Error(`Failed to export all markdowns: ${error.message}`);
  }
});
