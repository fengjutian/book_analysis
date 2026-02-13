import { useEffect, useState } from 'react';
import { Doc } from '@blocksuite/store';
import { useEditor } from '../editor/context';

const Sidebar = () => {
  const { collection, editor } = useEditor()!;
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    if (!collection || !editor) return;
    const updateDocs = () => {
      const docs = [...collection.docs.values()].map(blocks => blocks.getDoc());
      setDocs(docs);
    };
    updateDocs();

    const disposable = [
      collection.slots.docUpdated.on(updateDocs),
      editor.slots.docLinkClicked.on(updateDocs),
    ];

    return () => disposable.forEach(d => d.dispose());
  }, [collection, editor]);

  const createNewDoc = async () => {
    if (!collection || !editor) return;
    
    // 创建新文档
    const newDoc = collection.createDoc({ id: `doc-${Date.now()}` });
    newDoc.load(() => {
      const pageBlockId = newDoc.addBlock('affine:page', {});
      newDoc.addBlock('affine:surface', {}, pageBlockId);
      const noteId = newDoc.addBlock('affine:note', {}, pageBlockId);
      newDoc.addBlock('affine:paragraph', {}, noteId);
    });
    
    // 切换到新文档
    if (editor) editor.doc = newDoc;
    
    // 更新文档列表
    const updatedDocs = [...collection.docs.values()].map(blocks => blocks.getDoc());
    setDocs(updatedDocs);
    
    // 保存到本地
    try {
      if (window.api) {
        await window.api.createMarkdown({
          title: 'New Document',
          content: '# New Document\n\nStart writing here...'
        });
        console.log('Document saved to local');
      } else {
        // 开发环境中模拟保存
        console.log('Simulating document save in development mode');
      }
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  return (
    <div className="sidebar">
      <div className="header">
        <div>All Docs</div>
        <button className="create-btn" onClick={createNewDoc}>+ New</button>
      </div>
      <div className="doc-list">
        {docs.map(doc => (
          <div
            className={`doc-item ${editor?.doc === doc ? 'active' : ''}`}
            key={doc.id}
            onClick={() => {
              if (editor) editor.doc = doc;
              const docs = [...collection.docs.values()].map(blocks =>
                blocks.getDoc()
              );
              setDocs(docs);
            }}
          >
            {doc.meta?.title || 'Untitled'}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
