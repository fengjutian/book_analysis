import sqlite3 from 'sqlite3';
import { app } from 'electron';
import * as path from 'path';

// 获取数据库文件路径
const dbPath = path.join(app.getPath('userData'), 'markdown.db');

// 创建数据库实例
const db = new sqlite3.Database(dbPath);

// 初始化数据库
export function initDatabase() {
  // 创建 markdowns 表
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

// 类型定义
export interface Markdown {
  id: number;
  title: string;
  content: any; // BlockSuite 文档数据格式
  created_at: string;
  updated_at: string;
}

// 获取所有 Markdown 文件
export function getAllMarkdowns(): Promise<Markdown[]> {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM markdowns ORDER BY updated_at DESC', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // 直接返回 content 字段，不尝试解析为 JSON
        const markdowns = (rows as any[]).map(row => ({
          ...row
        }));
        resolve(markdowns as Markdown[]);
      }
    });
  });
}

// 根据 ID 获取 Markdown 文件
export function getMarkdownById(id: number): Promise<Markdown | undefined> {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM markdowns WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        // 直接返回 content 字段，不尝试解析为 JSON
        const markdown = {
          ...(row as any)
        };
        resolve(markdown as Markdown);
      } else {
        resolve(undefined);
      }
    });
  });
}

// 创建 Markdown 文件
export function createMarkdown(title: string, content: any): Promise<Markdown> {
  return new Promise((resolve, reject) => {
    // 将 content 转换为 JSON 字符串，确保不会是 undefined 或 null
    const contentJson = typeof content === 'string' ? content : (content !== undefined && content !== null ? JSON.stringify(content) : '');
    console.log('Creating markdown with content:', contentJson);
    db.run(
      'INSERT INTO markdowns (title, content) VALUES (?, ?)',
      [title, contentJson],
      function(err) {
        if (err) {
          reject(err);
        } else {
          db.get('SELECT * FROM markdowns WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
              reject(err);
            } else if (row) {
              // 直接返回 content 字段，不尝试解析为 JSON
              const markdown = {
                ...(row as any)
              };
              resolve(markdown as Markdown);
            } else {
              reject(new Error('Failed to retrieve created markdown'));
            }
          });
        }
      }
    );
  });
}

// 更新 Markdown 文件
export function updateMarkdown(id: number, title: string, content: any): Promise<Markdown | undefined> {
  return new Promise((resolve, reject) => {
    // 将 content 转换为 JSON 字符串，确保不会是 undefined 或 null
    const contentJson = typeof content === 'string' ? content : (content !== undefined && content !== null ? JSON.stringify(content) : '');
    console.log('Updating markdown with content:', contentJson);
    db.run(
      'UPDATE markdowns SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, contentJson, id],
      function(err) {
        if (err) {
          reject(err);
        } else {
          db.get('SELECT * FROM markdowns WHERE id = ?', [id], (err, row) => {
            if (err) {
              reject(err);
            } else if (row) {
              // 直接返回 content 字段，不尝试解析为 JSON
              const markdown = {
                ...(row as any)
              };
              resolve(markdown as Markdown);
            } else {
              resolve(undefined);
            }
          });
        }
      }
    );
  });
}

// 删除 Markdown 文件
export function deleteMarkdown(id: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM markdowns WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0);
      }
    });
  });
}

// 导出数据库实例（可选）
export default db;