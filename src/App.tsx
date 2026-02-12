import { useState, useEffect, useRef } from 'react'
import { Workspace, Page, Editor } from '@blocksuite/editor'
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
  const workspaceRef = useRef<Workspace | null>(null);
  const pageRef = useRef<Page | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

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
        
        // 初始化 BlockSuite 编辑器
        if (editorContainerRef.current) {
          // 清空容器
          editorContainerRef.current.innerHTML = '';
          
          // 创建工作区
          const workspace = new Workspace();
          workspaceRef.current = workspace;
          
          // 创建页面
          const page = workspace.createPage({ title: data.title });
          pageRef.current = page;
          
          // 加载内容
          if (data.content) {
            // 这里需要根据 BlockSuite 的数据格式来加载内容
            // 暂时使用简单的文本块作为示例
            const doc = page.getDoc();
            if (doc) {
              doc.load({ blocks: [{ type: 'text', content: data.content }] });
            }
          }
          
          // 创建编辑器
          const editor = new Editor({
            container: editorContainerRef.current,
            page,
          });
          editorRef.current = editor;
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
    if (!selectedMarkdown || !pageRef.current) return;
    try {
      // 从 BlockSuite 编辑器中获取内容
      const doc = pageRef.current.getDoc();
      let content = '';
      if (doc) {
        // 这里需要根据 BlockSuite 的数据格式来获取内容
        // 暂时使用简单的文本获取方式作为示例
        const blocks = doc.getBlocks();
        if (blocks && blocks.length > 0) {
          content = blocks[0].content || '';
        }
      }
      
      const updatedMarkdown = await window.api.updateMarkdown(
        selectedMarkdown.id,
        selectedMarkdown.title,
        content
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
