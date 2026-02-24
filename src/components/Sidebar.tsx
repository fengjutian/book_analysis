import { useEffect, useState } from 'react';
import { Doc, Job } from '@blocksuite/store';
import { useEditor } from '../editor/context';

interface SidebarProps {
  onDocSelect?: (docId: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onDocSelect }) => {
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
          
          const job = new Job({ collection });
          
          for (const md of markdowns) {
            const docId = `doc-${md.id}`;
            const existingDoc = [...collection.docs.values()].find(
              blocks => blocks.getDoc().id === docId
            );
            
            if (!existingDoc) {
              console.log('Creating doc for markdown:', md.id, md.title, 'content length:', md.content?.length);
              
              if (md.content && md.content.length > 10) {
                try {
                  const snapshot = JSON.parse(md.content);
                  console.log('Parsed snapshot for doc:', docId, 'blocks:', snapshot?.blocks?.children?.length);
                  
                  if (snapshot && snapshot.type === 'page' && snapshot.blocks) {
                    snapshot.meta = { ...snapshot.meta, id: docId };
                    const doc = await job.snapshotToDoc(snapshot);
                    console.log('Document restored from snapshot:', docId, 'root:', doc.root?.id);
                  } else {
                    console.log('Invalid snapshot format, creating empty doc');
                    createEmptyDoc(docId);
                  }
                } catch (error) {
                  console.error('Failed to parse snapshot:', error);
                  createEmptyDoc(docId);
                }
              } else {
                console.log('No content or empty content, creating empty doc');
                createEmptyDoc(docId);
              }
            } else {
              console.log('Doc already exists:', docId);
            }
          }
          
          function createEmptyDoc(id: string) {
            const doc = collection.createDoc({ id });
            doc.load(() => {
              const pageBlockId = doc.addBlock('affine:page', {});
              doc.addBlock('affine:surface', {}, pageBlockId);
              const noteId = doc.addBlock('affine:note', {}, pageBlockId);
              doc.addBlock('affine:paragraph', { text: new doc.Text('') }, noteId);
            });
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
            newDoc.addBlock('affine:paragraph', { text: new newDoc.Text('Start writing here...') }, noteId);
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
          newDoc.addBlock('affine:paragraph', { text: new newDoc.Text('Start writing here...') }, noteId);
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
    e.stopPropagation();
    if (!collection || !editor) return;
    
    console.log('Deleting doc:', doc.id);
    
    try {
      if (window.api) {
        const docId = doc.id.replace('doc-', '');
        if (!isNaN(parseInt(docId))) {
          console.log('Deleting from local database:', parseInt(docId));
          await window.api.deleteMarkdown(parseInt(docId));
          console.log('Document deleted from local database:', doc.id);
        }
      }
      
      const remainingDocs = [...collection.docs.values()]
        .map(blocks => blocks.getDoc())
        .filter(d => d.id !== doc.id);
      
      if (editor.doc?.id === doc.id) {
        const firstDoc = remainingDocs[0];
        if (firstDoc && editor) {
          editor.doc = firstDoc;
        }
      }
      
      collection.removeDoc(doc.id);
      
      setDocs(remainingDocs);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  return (
    <div className="sidebar">
      <div className="header">
        {/* <div>All Docs</div> */}
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
                if (onDocSelect) onDocSelect(doc.id);
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
