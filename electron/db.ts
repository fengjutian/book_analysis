import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';

// 获取数据库文件路径
const dbPath = path.join(app.getPath('userData'), 'markdown.db');

// 创建数据库实例
const db = new Database(dbPath);

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
  content: string;
  created_at: string;
  updated_at: string;
}

// 获取所有 Markdown 文件
export function getAllMarkdowns(): Markdown[] {
  const stmt = db.prepare('SELECT * FROM markdowns ORDER BY updated_at DESC');
  return stmt.all() as Markdown[];
}

// 根据 ID 获取 Markdown 文件
export function getMarkdownById(id: number): Markdown | undefined {
  const stmt = db.prepare('SELECT * FROM markdowns WHERE id = ?');
  return stmt.get(id) as Markdown | undefined;
}

// 创建 Markdown 文件
export function createMarkdown(title: string, content: string): Markdown {
  const stmt = db.prepare(
    'INSERT INTO markdowns (title, content) VALUES (?, ?) RETURNING *'
  );
  return stmt.get(title, content) as Markdown;
}

// 更新 Markdown 文件
export function updateMarkdown(id: number, title: string, content: string): Markdown | undefined {
  const stmt = db.prepare(
    'UPDATE markdowns SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *'
  );
  return stmt.get(title, content, id) as Markdown | undefined;
}

// 删除 Markdown 文件
export function deleteMarkdown(id: number): boolean {
  const stmt = db.prepare('DELETE FROM markdowns WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// 导出数据库实例（可选）
export default db;