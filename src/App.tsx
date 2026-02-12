import { useState, useEffect, useRef } from 'react'
import { SimpleAffineEditor } from '@blocksuite/editor'
import '@blocksuite/editor/themes/affine.css'
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
  const [newTitle, setNewTitle] = useState('');
  
  // BlockSuite 相关引用
  const editorRef = useRef<any | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // 加载所有 Markdown 文件
  const loadMarkdowns = async () => {
    try {
      if (window.api) {
        const data = await window.api.getAllMarkdowns();
        setMarkdowns(data);
      } else {
        // 在开发环境中使用模拟数据
        console.log('Running in development mode, using mock data');
        setMarkdowns([
          {
            id: 1,
            title: 'Test Markdown',
            content: '# Test Markdown\n\nThis is a test markdown file.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load markdowns:', error);
    }
  };

  // 加载单个 Markdown 文件
  const loadMarkdown = async (id: number) => {
    try {
      let data: Markdown | undefined;
      if (window.api) {
        data = await window.api.getMarkdownById(id);
      } else {
        // 在开发环境中使用模拟数据
        data = {
          id: 1,
          title: 'Test Markdown',
          content: '# Test Markdown\n\nThis is a test markdown file.\n\nYou can edit this content now!',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      if (data) {
        setSelectedMarkdown(data);
        
        // 初始化 BlockSuite 编辑器
        if (editorContainerRef.current) {
          // 清空容器
          editorContainerRef.current.innerHTML = '';
          
          // 创建 SimpleAffineEditor 组件
          const editor = document.createElement('simple-affine-editor');
          editorContainerRef.current.appendChild(editor);
          editorRef.current = editor;
          
          // 等待编辑器初始化完成后加载内容
          setTimeout(async () => {
            // 尝试获取编辑器内部的 page 对象
            if (data.content && editor.page) {
              // 导入 Markdown 内容
              const { ContentParser } = await import('@blocksuite/blocks');
              const parser = new ContentParser(editor.page);
              parser.importMarkdown(data.content);
            } else {
              console.error('Editor page not found');
            }
          }, 100);
        }
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
      let newMarkdown: Markdown;
      
      if (window.api) {
        newMarkdown = await window.api.createMarkdown(title, content);
      } else {
        // 在开发环境中使用模拟数据
        newMarkdown = {
          id: Date.now(),
          title,
          content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      setMarkdowns(prev => [newMarkdown, ...prev]);
      setSelectedMarkdown(newMarkdown);
      setNewTitle('');
    } catch (error) {
      console.error('Failed to create markdown:', error);
    }
  };

  // 保存 Markdown 文件
  const saveMarkdown = async () => {
    if (!selectedMarkdown || !editorRef.current) return;
    try {
      // 从 BlockSuite 编辑器中获取内容
      let content = '';
      if (editorRef.current.page) {
        // 导出 Markdown 内容
        const { ContentParser } = await import('@blocksuite/blocks');
        const parser = new ContentParser(editorRef.current.page);
        content = await parser.block2markdown([parser.getSelectedBlock(editorRef.current.page.root)]);
      }
      
      let updatedMarkdown: Markdown | undefined;
      if (window.api) {
        updatedMarkdown = await window.api.updateMarkdown(
          selectedMarkdown.id,
          selectedMarkdown.title,
          content
        );
      } else {
        // 在开发环境中使用模拟数据
        updatedMarkdown = {
          ...selectedMarkdown,
          content,
          updated_at: new Date().toISOString()
        };
      }
      
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
      if (window.api) {
        await window.api.deleteMarkdown(id);
      }
      // 无论在什么环境，都更新前端状态
      setMarkdowns(prev => prev.filter(md => md.id !== id));
      if (selectedMarkdown && selectedMarkdown.id === id) {
        setSelectedMarkdown(null);
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
              {/* BlockSuite 编辑器容器 */}
              <div 
                ref={editorContainerRef} 
                className="blocksuite-editor"
                style={{ height: 'calc(100vh - 120px)', border: '1px solid #e0e0e0' }}
              ></div>
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
