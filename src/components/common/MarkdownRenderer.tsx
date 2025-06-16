import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '', 
  style = {} 
}) => {
  return (
    <div 
      className={`markdown-content contract-preview ${className}`}
      style={{
        fontFamily: 'Times New Roman, serif',
        lineHeight: '1.6',
        fontSize: '14px',
        ...style
      }}
    >
      <style jsx>{`
        .contract-preview table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          border: 2px solid #000;
        }
        .contract-preview th,
        .contract-preview td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        .contract-preview th {
          background-color: #f5f5f5;
          font-weight: bold;
          border-bottom: 2px solid #000;
        }
        .contract-preview tbody tr:nth-child(even) {
          background-color: #fafafa;
        }
        .contract-preview tbody tr:hover {
          background-color: #f0f0f0;
        }
        .contract-preview table caption {
          font-weight: bold;
          margin-bottom: 10px;
          text-align: center;
        }
      `}</style>
      
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize table rendering with explicit borders and spacing
          table: ({ children }) => (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              margin: '15px 0',
              border: '2px solid #000',
              fontSize: 'inherit'
            }}>
              {children}
            </table>
          ),
          thead: ({ children }) => (
            <thead>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody>
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr>
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th style={{
              border: '1px solid #000',
              padding: '8px',
              textAlign: 'left',
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              borderBottom: '2px solid #000',
              verticalAlign: 'top'
            }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{
              border: '1px solid #000',
              padding: '8px',
              textAlign: 'left',
              verticalAlign: 'top'
            }}>
              {children}
            </td>
          ),
          // Customize heading rendering
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-center mb-6 mt-8">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-4 mt-6">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-3 mt-5">
              {children}
            </h3>
          ),
          // Customize paragraph rendering
          p: ({ children }) => (
            <p className="mb-4 text-justify leading-relaxed">
              {children}
            </p>
          ),
          // Customize list rendering
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 ml-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 ml-4">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="mb-1">
              {children}
            </li>
          ),
          // Customize emphasis rendering
          strong: ({ children }) => (
            <strong className="font-semibold">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic">
              {children}
            </em>
          ),
          // Customize code rendering
          code: ({ children, className }) => {
            const isInline = !className?.includes('language-');
            if (isInline) {
              return (
                <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-sm">
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto mb-4">
                <code className="font-mono text-sm">
                  {children}
                </code>
              </pre>
            );
          },
          // Customize blockquote rendering
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600">
              {children}
            </blockquote>
          ),
          // Customize horizontal rule rendering
          hr: () => (
            <hr className="border-t-2 border-gray-800 my-6" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;