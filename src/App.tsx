import { useState, useEffect } from 'react';
import { EditorProvider } from './components/EditorProvider';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import EditorContainer from './components/EditorContainer';
import KnowledgeGraph from './components/KnowledgeGraph';
import './index.css';

interface Markdown {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

type ViewMode = 'editor' | 'graph';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [markdowns, setMarkdowns] = useState<Markdown[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  useEffect(() => {
    const loadMarkdowns = async () => {
      if (window.api) {
        const data = await window.api.getAllMarkdowns();
        setMarkdowns(data);
      }
    };
    loadMarkdowns();

    const interval = setInterval(loadMarkdowns, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <EditorProvider>
      <div className="app">
        <Sidebar onDocSelect={setSelectedDocId} />
        <div className="main-content">
          <TopBar>
            <div className="view-tabs">
              <button
                className={`tab-btn ${viewMode === 'editor' ? 'active' : ''}`}
                onClick={() => setViewMode('editor')}
              >
                编辑器
              </button>
              <button
                className={`tab-btn ${viewMode === 'graph' ? 'active' : ''}`}
                onClick={() => setViewMode('graph')}
              >
                知识图谱
              </button>
            </div>
          </TopBar>
          {viewMode === 'editor' ? (
            <EditorContainer />
          ) : (
            <KnowledgeGraph
              markdowns={markdowns}
              selectedDocId={selectedDocId}
            />
          )}
        </div>
      </div>
    </EditorProvider>
  );
}

export default App;
