import { useState, useEffect } from 'react';
import { EditorProvider } from './components/EditorProvider';
import AppSplitter from './components/AppSplitter';
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
      <AppSplitter
        viewMode={viewMode}
        setViewMode={setViewMode}
        markdowns={markdowns}
        selectedDocId={selectedDocId}
        onDocSelect={setSelectedDocId}
      />
    </EditorProvider>
  );
}

export default App;
