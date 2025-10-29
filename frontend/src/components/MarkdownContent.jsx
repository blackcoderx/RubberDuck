import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

function MarkdownContent({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings
        h1: ({ node, ...props }) => (
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-6 mb-3" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-5 mb-2" {...props} />
        ),
        h4: ({ node, ...props }) => (
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2" {...props} />
        ),

        // Paragraphs
        p: ({ node, ...props }) => (
          <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4" {...props} />
        ),

        // Strong (bold)
        strong: ({ node, ...props }) => (
          <strong className="font-bold text-gray-900 dark:text-white" {...props} />
        ),

        // Emphasis (italic)
        em: ({ node, ...props }) => (
          <em className="italic" {...props} />
        ),

        // Lists
        ul: ({ node, ...props }) => (
          <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-200" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-200" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="ml-4" {...props} />
        ),

        // Blockquote
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 mb-4 italic text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20" {...props} />
        ),

        // Links
        a: ({ node, ...props }) => (
          <a className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer" {...props} />
        ),

        // Inline code
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : 'javascript';

          return !inline ? (
            // Block code with syntax highlighting
            <div className="my-6 rounded-lg overflow-hidden">
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '1.5rem',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                }}
                showLineNumbers
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          ) : (
            // Inline code
            <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 rounded text-sm font-mono" {...props}>
              {children}
            </code>
          );
        },

        // Horizontal rule
        hr: ({ node, ...props }) => (
          <hr className="my-8 border-gray-300 dark:border-gray-700" {...props} />
        ),

        // Tables
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700" {...props} />
          </div>
        ),
        th: ({ node, ...props }) => (
          <th className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-left text-sm font-semibold text-gray-900 dark:text-white" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="px-4 py-2 border-t border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default MarkdownContent;
