import React, { useState, useEffect } from 'react';
import { initEditor } from '../editor/editor';
import { EditorContext } from '../editor/context';

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [editorState, setEditorState] = useState(() => initEditor());

  // 确保只初始化一次
  useEffect(() => {
    return () => {
      // 清理逻辑（如果需要）
    };
  }, []);

  return (
    <EditorContext.Provider value={{ 
      editor: editorState.editor, 
      collection: editorState.collection 
    }}>
      {children}
    </EditorContext.Provider>
  );
};
