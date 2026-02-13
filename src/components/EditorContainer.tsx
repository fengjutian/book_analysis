import { useEffect, useRef } from 'react';
import { useEditor } from '../editor/context';

const EditorContainer = () => {
  const { editor, collection } = useEditor()!;

  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorContainerRef.current && editor) {
      editorContainerRef.current.innerHTML = '';
      editorContainerRef.current.appendChild(editor);
    }
  }, [editor]);

  // 添加自动保存逻辑
  useEffect(() => {
    if (!editor || !collection) return;

    const saveDoc = async (doc: any) => {
      try {
        console.log('Saving doc:', doc.id);
        
        // 这里可以添加更多逻辑，例如将文档内容转换为 Markdown 格式
        // 然后使用 window.api.updateMarkdown 保存到本地
        
        if (window.api) {
          // 提取文档 ID 中的数字部分
          const docId = doc.id.replace('doc-', '');
          if (!isNaN(parseInt(docId))) {
            await window.api.updateMarkdown(parseInt(docId), {
              title: doc.meta?.title || 'Untitled',
              content: '# Document\n\nContent goes here...' // 这里应该是实际的文档内容
            });
            console.log('Document saved to local:', doc.id);
          }
        } else {
          // 开发环境中模拟保存
          console.log('Simulating save document in development mode:', doc.id);
        }
      } catch (error) {
        console.error('Failed to save document:', error);
      }
    };

    // 监听文档变化事件
    const disposable = [
      editor.slots.docUpdated.on(({ doc }) => {
        saveDoc(doc);
      }),
      collection.slots.docUpdated.on(() => {
        // 当集合中的文档更新时，也可以执行保存操作
      }),
    ];

    return () => disposable.forEach(d => d.dispose());
  }, [editor, collection]);

  return <div className="editor-container" ref={editorContainerRef}></div>;
};

export default EditorContainer;
