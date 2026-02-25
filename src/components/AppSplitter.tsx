import React from 'react';
import { Splitter } from 'antd';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import EditorContainer from './EditorContainer';
import KnowledgeGraph from './KnowledgeGraph';
import FloatingButtons from './FloatingButtons';

interface AppSplitterProps {
  viewMode: 'editor' | 'graph';
  setViewMode: (mode: 'editor' | 'graph') => void;
  markdowns: any[];
  selectedDocId: string | null;
  onDocSelect: (docId: string | null) => void;
}

const AppSplitter: React.FC<AppSplitterProps> = ({
  viewMode,
  setViewMode,
  markdowns,
  selectedDocId,
  onDocSelect,
}) => {
  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <Splitter style={{ height: '100%' }}>
        <Splitter.Panel defaultSize="20%" min="15%" max="40%">
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <Sidebar onDocSelect={onDocSelect} />
          </div>
        </Splitter.Panel>
        <Splitter.Panel>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
        </Splitter.Panel>
      </Splitter>
      <FloatingButtons />
    </div>
  );
};

export default AppSplitter;