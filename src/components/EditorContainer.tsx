import { useEffect, useRef, useCallback } from 'react';
import { Job } from '@blocksuite/store';
import { useEditor } from '../editor/context';

const EditorContainer = () => {
  const { editor, collection } = useEditor()!;
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (editorContainerRef.current && editor) {
      editorContainerRef.current.innerHTML = '';
      editorContainerRef.current.appendChild(editor);
    }
  }, [editor]);

  const saveDoc = useCallback(async (doc: any) => {
    try {
      if (!doc || !doc.id) {
        console.error('Invalid doc object:', doc);
        return;
      }
      
      if (!doc.id.startsWith('doc-')) {
        console.log('Skipping save for temp doc:', doc.id);
        return;
      }
      
      console.log('Saving doc:', doc.id);
      
      const job = new Job({ collection });
      const snapshot = await job.docToSnapshot(doc);
      const content = JSON.stringify(snapshot);
      
      console.log('Saving snapshot:', snapshot);
      
      if (window.api) {
        const docId = doc.id.replace('doc-', '');
        if (!isNaN(parseInt(docId))) {
          await window.api.updateMarkdown(parseInt(docId), {
            title: doc.meta?.title || 'Untitled',
            content: content
          });
          console.log('Document saved to local:', doc.id);
        }
      } else {
        console.log('Simulating save document in development mode:', doc.id);
      }
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  }, [collection]);

  useEffect(() => {
    if (!editor || !collection) return;

    const disposables: (() => void)[] = [];
    const subscribedDocs = new Set<string>();

    const scheduleSave = (doc: any) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveDoc(doc);
      }, 1000);
    };

    const subscribeToDoc = (doc: any) => {
      if (!doc || !doc.slots || subscribedDocs.has(doc.id)) return;
      
      subscribedDocs.add(doc.id);
      console.log('Subscribing to doc:', doc.id);
      
      const blockUpdatedDisposable = doc.slots.blockUpdated.on(() => {
        console.log('Block updated in doc:', doc.id);
        scheduleSave(doc);
      });
      
      const historyUpdatedDisposable = doc.slots.historyUpdated.on(() => {
        console.log('History updated in doc:', doc.id);
        scheduleSave(doc);
      });
      
      disposables.push(() => {
        blockUpdatedDisposable.dispose();
        historyUpdatedDisposable.dispose();
        subscribedDocs.delete(doc.id);
      });
    };

    collection.docs.forEach(blockCollection => {
      const doc = blockCollection.getDoc();
      subscribeToDoc(doc);
    });

    const docUpdatedDisposable = editor.slots.docUpdated.on((event) => {
      console.log('docUpdated event:', event);
      if (event && event.newDocId) {
        const blockCollection = [...collection.docs.values()].find(
          blocks => blocks.getDoc().id === event.newDocId
        );
        const doc = blockCollection?.getDoc();
        if (doc) {
          subscribeToDoc(doc);
          saveDoc(doc);
        }
      }
    });
    disposables.push(() => docUpdatedDisposable.dispose());

    const collectionDocUpdatedDisposable = collection.slots.docUpdated.on(() => {
      console.log('Collection doc updated');
      collection.docs.forEach(blockCollection => {
        const doc = blockCollection.getDoc();
        subscribeToDoc(doc);
      });
    });
    disposables.push(() => collectionDocUpdatedDisposable.dispose());

    return () => {
      disposables.forEach(d => d());
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor, collection, saveDoc]);

  return <div className="editor-container" ref={editorContainerRef}></div>;
};

export default EditorContainer;
