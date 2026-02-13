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
          // 模拟创建一个文档
          const mockDoc = collection.createDoc({ id: `doc-${Date.now()}` });
          mockDoc.load(() => {
            const pageBlockId = mockDoc.addBlock('affine:page', {});
            mockDoc.addBlock('affine:surface', {}, pageBlockId);
            const noteId = mockDoc.addBlock('affine:note', {}, pageBlockId);
            mockDoc.addBlock('affine:paragraph', {}, noteId);
          });
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
    
    // 创建新文档
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
    
    // 保存到本地
    try {
      if (window.api) {
        console.log('Saving new doc to local...');
        const savedMarkdown = await window.api.createMarkdown({
          title: 'New Document',
          content: '# New Document\n\nStart writing here...'
        });
        console.log('Document saved to local:', savedMarkdown);
        
        // 使用返回的 ID 更新文档 ID
        if (savedMarkdown && savedMarkdown.id) {
          // 从集合中删除旧文档
          // 注意：BlockSuite 的 DocCollection 可能没有 deleteDoc 方法，需要查看文档
          // 暂时注释掉这行，因为我们会创建新文档
          // collection.deleteDoc(newDoc.id);
          // 创建新文档，使用数据库返回的 ID
          const updatedDoc = collection.createDoc({ id: `doc-${savedMarkdown.id}` });
          updatedDoc.load(() => {
            const pageBlockId = updatedDoc.addBlock('affine:page', {});
            updatedDoc.addBlock('affine:surface', {}, pageBlockId);
            const noteId = updatedDoc.addBlock('affine:note', {}, pageBlockId);
            updatedDoc.addBlock('affine:paragraph', {}, noteId);
          });
          // 切换到更新后的文档
          if (editor) {
            editor.doc = updatedDoc;
          }
          // 更新文档列表
          const updatedDocs = [...collection.docs.values()].map(blocks => blocks.getDoc());
          setDocs(updatedDocs);
        }
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
