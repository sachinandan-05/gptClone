'use client'

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      components={{
        // Ensure paragraphs don't wrap around block elements
        p: ({ node, ...props }) => {
          const hasBlockElement = node?.children?.some(
            (child: any) => child.type === 'element' && ['div', 'pre', 'code', 'ul', 'ol', 'table', 'blockquote'].includes(child.tagName)
          );
          return hasBlockElement ? <>{props.children}</> : <p {...props} />;
        },
        code({ node, inline, className, children, ...props }: { node?: any; inline?: boolean; className?: string; children?: React.ReactNode }) {
          const match = /language-(\w+)/.exec(className || '');
          const code = String(children).replace(/\n$/, '');

          if (inline) {
            return (
              <code className="bg-gray-700 rounded px-1 py-0.5 text-sm font-mono">
                {children}
              </code>
            );
          }

          return (
            <div className="my-4 rounded-lg overflow-hidden bg-[#1e1e1e]" key={Math.random().toString(36).substr(2, 9)}>
              <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-gray-300 text-sm">
                <span>{match?.[1] || 'code'}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="flex items-center gap-1 hover:text-white transition text-xs"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              </div>
              <SyntaxHighlighter
                language={match?.[1] || 'text'}
                style={oneDark}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  background: 'transparent',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                }}
                showLineNumbers={code.split('\n').length > 5}
                wrapLines={true}
                wrapLongLines={false}
                {...props}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          );
        },
        ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
        a: ({ node, ...props }) => (
          <a
            className="text-blue-400 hover:text-blue-300 underline break-all"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-gray-500 pl-4 italic text-gray-300 my-4" {...props} />
        ),
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold my-4" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-bold my-3" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-lg font-bold my-2" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default MarkdownRenderer;
