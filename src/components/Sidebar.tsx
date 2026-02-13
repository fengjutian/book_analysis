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
          
          // 为每个本地 Markdown 创建文档
          markdowns.forEach((md: Markdown) => {
            // 检查文档是否已存在
            const existingDoc = [...collection.docs.values()].find(
              blocks => blocks.getDoc().id === `doc-${md.id}`
            );
            
            if (!existingDoc) {
              console.log('Creating doc for markdown:', md.id, md.title);
              console.log('Markdown content:', md.content);
              const doc = collection.createDoc({ id: `doc-${md.id}` });
              doc.load(() => {
                const pageBlockId = doc.addBlock('affine:page', {});
                doc.addBlock('affine:surface', {}, pageBlockId);
                const noteId = doc.addBlock('affine:note', {}, pageBlockId);
                // 使用本地 Markdown 的内容来初始化文档
                if (md.content) {
                  console.log('Loading content for markdown:', md.id, md.content);
                  try {
                    // 尝试解析保存的 JSON 内容
                    const parsedContent = JSON.parse(md.content);
                    console.log('Parsed content:', parsedContent);
                    // 这里可以添加更多逻辑，例如根据解析后的内容创建对应的块
                    // 暂时只添加一个段落块
                    doc.addBlock('affine:paragraph', {}, noteId);
                  } catch (error) {
                    console.error('Failed to parse markdown content:', error);
                    // 如果解析失败，添加默认内容
                    doc.addBlock('affine:paragraph', {}, noteId);
                  }
                } else {
                  console.error('Markdown content is empty:', md.id);
                  // 添加默认内容
                  doc.addBlock('affine:paragraph', {}, noteId);
                }
              });
            } else {
              console.log('Doc already exists:', `doc-${md.id}`);
            }
          });
        } else {
          // 开发环境中模拟加载
          console.log('Simulating load local markdowns in development mode');
          // 不自动创建文档，只在用户点击创建按钮时创建
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
    
    // 先保存到数据库，获取数据库 ID
    try {
      if (window.api) {
        console.log('Saving new doc to local...');
        const savedMarkdown = await window.api.createMarkdown({
          title: 'New Document',
          content: '# New Document\n\nStart writing here...'
        });
        console.log('Document saved to local:', savedMarkdown);
        
        // 使用数据库返回的 ID 创建文档
        if (savedMarkdown && savedMarkdown.id) {
          // 创建新文档，使用数据库返回的 ID
          const newDoc = collection.createDoc({ id: `doc-${savedMarkdown.id}` });
          newDoc.load(() => {
            const pageBlockId = newDoc.addBlock('affine:page', {});
            newDoc.addBlock('affine:surface', {}, pageBlockId);
            const noteId = newDoc.addBlock('affine:note', {}, pageBlockId);
            newDoc.addBlock('affine:paragraph', {}, noteId);
          });
          
          // 切换到新文档
          if (editor) {
            console.log('Switching to new doc:', newDoc.id);
            editor.doc = newDoc;
          }
          
          // 更新文档列表
          const updatedDocs = [...collection.docs.values()].map(blocks => blocks.getDoc());
          setDocs(updatedDocs);
        }
      } else {
        // 开发环境中模拟保存
        console.log('Simulating document save in development mode');
        // 创建新文档，使用临时 ID
        const newDoc = collection.createDoc({ id: `doc-${Date.now()}` });
        newDoc.load(() => {
          const pageBlockId = newDoc.addBlock('affine:page', {});
          newDoc.addBlock('affine:surface', {}, pageBlockId);
          const noteId = newDoc.addBlock('affine:note', {}, pageBlockId);
          newDoc.addBlock('affine:paragraph', {}, noteId);
        });
        
        // 切换到新文档
        if (editor) {
          console.log('Switching to new doc:', newDoc.id);
          editor.doc = newDoc;
        }
        
        // 更新文档列表
        const updatedDocs = [...collection.docs.values()].map(blocks => blocks.getDoc());
        setDocs(updatedDocs);
      }
    } catch (error) {
      console.error('Failed to save document:', error);
      // 如果保存失败，创建临时文档
      const newDoc = collection.createDoc({ id: `doc-${Date.now()}` });
      newDoc.load(() => {
        const pageBlockId = newDoc.addBlock('affine:page', {});
        newDoc.addBlock('affine:surface', {}, pageBlockId);
        const noteId = newDoc.addBlock('affine:note', {}, pageBlockId);
        newDoc.addBlock('affine:paragraph', {}, noteId);
      });
      
      // 切换到新文档
      if (editor) {
        console.log('Switching to new doc:', newDoc.id);
        editor.doc = newDoc;
      }
      
      // 更新文档列表
      const updatedDocs = [...collection.docs.values()].map(blocks => blocks.getDoc());
      setDocs(updatedDocs);
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
