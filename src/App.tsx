import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'

// 类型定义
interface Markdown {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// 声明全局 API
declare global {
  interface Window {
    api: {
      getAllMarkdowns: () => Promise<Markdown[]>;
      getMarkdownById: (id: number) => Promise<Markdown | undefined>;
      createMarkdown: (title: string, content: string) => Promise<Markdown>;
      updateMarkdown: (id: number, title: string, content: string) => Promise<Markdown | undefined>;
      deleteMarkdown: (id: number) => Promise<boolean>;
    };
  }
}

function App() {
  const [markdowns, setMarkdowns] = useState<Markdown[]>([]);
  const [selectedMarkdown, setSelectedMarkdown] = useState<Markdown | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [newTitle, setNewTitle] = useState('');

  // 加载所有 Markdown 文件
  const loadMarkdowns = async () => {
    try {
      const data = await window.api.getAllMarkdowns();
      setMarkdowns(data);
    } catch (error) {
      console.error('Failed to load markdowns:', error);
    }
  };

  // 加载单个 Markdown 文件
  const loadMarkdown = async (id: number) => {
    try {
      const data = await window.api.getMarkdownById(id);
      if (data) {
        setSelectedMarkdown(data);
        setEditingContent(data.content);
      }
    } catch (error) {
      console.error('Failed to load markdown:', error);
    }
  };

  // 创建新的 Markdown 文件
  const createNewMarkdown = async () => {
    try {
      const title = newTitle || 'Untitled';
      const content = '# New Markdown\n\nStart writing here...';
      const newMarkdown = await window.api.createMarkdown(title, content);
      setMarkdowns(prev => [newMarkdown, ...prev]);
      setSelectedMarkdown(newMarkdown);
      setEditingContent(content);
      setNewTitle('');
    } catch (error) {
      console.error('Failed to create markdown:', error);
    }
  };

  // 保存 Markdown 文件
  const saveMarkdown = async () => {
    if (!selectedMarkdown) return;
    try {
      const updatedMarkdown = await window.api.updateMarkdown(
        selectedMarkdown.id,
        selectedMarkdown.title,
        editingContent
      );
      if (updatedMarkdown) {
        setSelectedMarkdown(updatedMarkdown);
        setMarkdowns(prev => prev.map(md => md.id === updatedMarkdown.id ? updatedMarkdown : md));
      }
    } catch (error) {
      console.error('Failed to save markdown:', error);
    }
  };

  // 删除 Markdown 文件
  const deleteMarkdown = async (id: number) => {
    try {
      await window.api.deleteMarkdown(id);
      setMarkdowns(prev => prev.filter(md => md.id !== id));
      if (selectedMarkdown && selectedMarkdown.id === id) {
        setSelectedMarkdown(null);
        setEditingContent('');
      }
    } catch (error) {
      console.error('Failed to delete markdown:', error);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadMarkdowns();
  }, []);

  return (
    <div className="app-container">
      {/* 左侧文件列表 */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Markdown Files</h2>
          <div className="new-file-section">
            <input
              type="text"
              placeholder="New file title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="new-file-input"
            />
            <button onClick={createNewMarkdown} className="new-file-button">
              + New
            </button>
          </div>
        </div>
        <div className="file-list">
          {markdowns.map((md) => (
            <div
              key={md.id}
              className={`file-item ${selectedMarkdown?.id === md.id ? 'selected' : ''}`}
              onClick={() => loadMarkdown(md.id)}
            >
              <div className="file-info">
                <div className="file-title">{md.title}</div>
                <div className="file-date">{new Date(md.updated_at).toLocaleString()}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMarkdown(md.id);
                }}
                className="delete-button"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 中间内容展示 */}
      <div className="content">
        {selectedMarkdown ? (
          <div className="markdown-editor">
            <div className="editor-header">
              <h1>{selectedMarkdown.title}</h1>
              <button onClick={saveMarkdown} className="save-button">
                Save
              </button>
            </div>
            <div className="editor-content">
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="markdown-textarea"
                placeholder="Write your markdown here..."
              />
              <div className="markdown-preview">
                <ReactMarkdown>{editingContent}</ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <h2>Select a markdown file or create a new one</h2>
            <p>Click on a file in the left sidebar to view and edit it</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
