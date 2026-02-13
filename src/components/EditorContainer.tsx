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
        if (!doc || !doc.id) {
          console.error('Invalid doc object:', doc);
          return;
        }
        
        console.log('Saving doc:', doc.id);
        console.log('Doc object:', doc);
        console.log('Doc meta:', doc.meta);
        
        // 获取文档的实际内容
        let content = '# Document\n\nContent goes here...';
        try {
          // 尝试获取文档的块结构，这里需要根据 BlockSuite 的 API 来获取实际内容
          // 暂时使用文档的 JSON 表示作为内容
          if (typeof doc.toJSON === 'function') {
            const docJson = doc.toJSON();
            console.log('Doc JSON:', docJson);
            content = JSON.stringify(docJson);
          } else if (doc.content) {
            console.log('Doc content property:', doc.content);
            content = typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content);
          } else {
            // 尝试使用简单的内容作为默认值
            content = `# ${doc.meta?.title || 'Untitled'}\n\nDocument content here...`;
            console.log('Using default content for doc:', doc.id);
          }
        } catch (error) {
          console.error('Failed to get doc content:', error);
        }
        // 确保 content 不是空字符串
        if (!content || content.trim() === '') {
          content = '# Document\n\nContent goes here...';
        }
        console.log('Saving content:', content);
        console.log('Saving title:', doc.meta?.title || 'Untitled');
        
        if (window.api) {
          // 提取文档 ID 中的数字部分
          const docId = doc.id.replace('doc-', '');
          console.log('Saving docId:', docId);
          if (!isNaN(parseInt(docId))) {
            try {
              console.log('Calling updateMarkdown with:', parseInt(docId), doc.meta?.title || 'Untitled', content);
              await window.api.updateMarkdown(parseInt(docId), {
                title: doc.meta?.title || 'Untitled',
                content: content
              });
              console.log('Document saved to local:', doc.id);
            } catch (error) {
              console.error('Failed to update document:', error);
              // 如果更新失败，可能是文档不存在，尝试创建新文档
              try {
                console.log('Calling createMarkdown with:', doc.meta?.title || 'Untitled', content);
                const savedMarkdown = await window.api.createMarkdown({
                  title: doc.meta?.title || 'Untitled',
                  content: content
                });
                console.log('Document created instead:', savedMarkdown);
              } catch (createError) {
                console.error('Failed to create document:', createError);
              }
            }
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
      editor.slots.docUpdated.on((event) => {
        console.log('docUpdated event:', event);
        if (event && event.newDocId) {
          // 从集合中获取文档
          const doc = [...collection.docs.values()].find(
            blocks => blocks.getDoc().id === event.newDocId
          )?.getDoc();
          if (doc) {
            saveDoc(doc);
            
            // 添加定期保存的定时器
            const saveInterval = setInterval(() => {
              console.log('Periodically saving doc:', doc.id);
              saveDoc(doc);
            }, 5000); // 每 5 秒保存一次
            
            // 手动清理定时器，不添加到 disposable 数组中
            setTimeout(() => {
              clearInterval(saveInterval);
            }, 60000); // 1 分钟后清理，避免内存泄漏
          } else {
            console.error('Doc not found for newDocId:', event.newDocId);
          }
        } else {
          console.error('Invalid docUpdated event:', event);
        }
      }),
      collection.slots.docUpdated.on((event) => {
        console.log('collection.docUpdated event:', event);
        // 当集合中的文档更新时，也可以执行保存操作
      }),
    ];

    return () => disposable.forEach(d => d.dispose());
  }, [editor, collection]);

  return <div className="editor-container" ref={editorContainerRef}></div>;
};

export default EditorContainer;
