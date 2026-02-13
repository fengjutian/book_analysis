import { useEffect, useState } from 'react';
import { Doc } from '@blocksuite/store';
import { useEditor } from '../editor/context';

interface Markdown {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const Sidebar = () => {
  const { collection, editor } = useEditor()!;
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    if (!collection || !editor) return;
    
    // 加载本地 Markdown 文件
    const loadLocalMarkdowns = async () => {
      try {
        if (window.api) {
          console.log('Loading markdowns from local...');
          const markdowns = await window.api.getAllMarkdowns();
          console.log('Loaded markdowns from local:', markdowns);
          
          for (const md of markdowns) {
            const docId = `doc-${md.id}`;
            const existingDoc = [...collection.docs.values()].find(
              blocks => blocks.getDoc().id === docId
            );
            
            if (!existingDoc) {
              console.log('Creating doc for markdown:', md.id, md.title);
              const doc = collection.createDoc({ id: docId });
              doc.load(() => {
                const pageBlockId = doc.addBlock('affine:page', {});
                doc.addBlock('affine:surface', {}, pageBlockId);
                const noteId = doc.addBlock('affine:note', {}, pageBlockId);
                doc.addBlock('affine:paragraph', { text: doc.Text('') }, noteId);
              });
            } else {
              console.log('Doc already exists:', docId);
            }
          }
        } else {
          console.log('Simulating load local markdowns in development mode');
        }
      } catch (error) {
        console.error('Failed to load local markdowns:', error);
      }
    };
    
    loadLocalMarkdowns();
    
    const updateDocs = () => {
      const docs = [...collection.docs.values()].map(blocks => blocks.getDoc());
      console.log('Updating docs:', docs);
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
    
    console.log('Creating new doc...');
    
    try {
      if (window.api) {
        console.log('Saving new doc to local...');
        const savedMarkdown = await window.api.createMarkdown({
          title: 'New Document',
          content: ''
        });
        console.log('Document saved to local:', savedMarkdown);
        
        if (savedMarkdown && savedMarkdown.id) {
          const docId = `doc-${savedMarkdown.id}`;
          const newDoc = collection.createDoc({ id: docId });
          
          newDoc.load(() => {
            const pageBlockId = newDoc.addBlock('affine:page', {});
            newDoc.addBlock('affine:surface', {}, pageBlockId);
            const noteId = newDoc.addBlock('affine:note', {}, pageBlockId);
            newDoc.addBlock('affine:paragraph', { text: newDoc.Text('Start writing here...') }, noteId);
          });
          
          if (editor) {
            console.log('Switching to new doc:', newDoc.id);
            editor.doc = newDoc;
          }
        }
      } else {
        console.log('Simulating document save in development mode');
        const newDoc = collection.createDoc({ id: `doc-${Date.now()}` });
        newDoc.load(() => {
          const pageBlockId = newDoc.addBlock('affine:page', {});
          newDoc.addBlock('affine:surface', {}, pageBlockId);
          const noteId = newDoc.addBlock('affine:note', {}, pageBlockId);
          newDoc.addBlock('affine:paragraph', { text: newDoc.Text('Start writing here...') }, noteId);
        });
        
        if (editor) {
          console.log('Switching to new doc:', newDoc.id);
          editor.doc = newDoc;
        }
      }
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  const deleteDoc = async (doc: any, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止冒泡，避免触发文档点击事件
    if (!collection || !editor) return;
    
    console.log('Deleting doc:', doc.id);
    
    try {
      // 从本地数据库删除
      if (window.api) {
        const docId = doc.id.replace('doc-', '');
        if (!isNaN(parseInt(docId))) {
          console.log('Deleting from local database:', parseInt(docId));
          await window.api.deleteMarkdown(parseInt(docId));
          console.log('Document deleted from local database:', doc.id);
        }
      }
      
      // 从 BlockSuite 集合中删除
      // 注意：BlockSuite 的 DocCollection 可能没有直接的删除方法
      // 我们可以通过移除文档的方式来实现
      // 这里我们先更新文档列表，过滤掉被删除的文档
      const updatedDocs = [...collection.docs.values()]
        .map(blocks => blocks.getDoc())
        .filter(d => d.id !== doc.id);
      setDocs(updatedDocs);
      
      // 如果当前编辑的文档被删除，清空编辑器
      if (editor.doc === doc) {
        console.log('Current edited doc deleted, clearing editor');
        // 注意：BlockSuite 编辑器可能需要一个默认文档
        // 这里我们暂时不设置任何文档
        // editor.doc = null;
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
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
          >
            <div 
              className="doc-item-title"
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
            <button 
              className="delete-btn"
              onClick={(e) => deleteDoc(doc, e)}
              title="Delete document"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
