// 为 window.api 添加类型声明
interface Markdown {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface Window {
  api?: {
    getAllMarkdowns: () => Promise<Markdown[]>;
    getMarkdownById: (id: number) => Promise<Markdown | undefined>;
    createMarkdown: (markdown: { title: string; content: string }) => Promise<Markdown>;
    updateMarkdown: (id: number, markdown: { title: string; content: string }) => Promise<Markdown | undefined>;
    deleteMarkdown: (id: number) => Promise<boolean>;
    exportMarkdown: (id: number, fileName?: string) => Promise<{ success: boolean; filePath?: string; message?: string }>;
    exportAllMarkdowns: (fileName?: string) => Promise<{ success: boolean; filePath?: string; message?: string; count?: number }>;
  };
}
