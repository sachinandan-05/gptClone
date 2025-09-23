'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { Element } from 'hast';

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  node?: Element;
  className?: string;
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose dark:prose-invert max-w-none prose-code:before:content-none prose-code:after:content-none break-words whitespace-pre-wrap overflow-x-hidden ">
      <ReactMarkdown
        components={{
          img: ({ ...props }) => (
            <img
              {...props as any}
              style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
            />
          ),
          a: ({ children, ...props }) => (
            <a {...props as any} style={{ wordBreak: 'break-all' }}>
              {children}
            </a>
          ),
          code: ({
            inline = false,
            className = '',
            children,
            ...props
          }: CodeProps) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                // @ts-expect-error - vscDarkPlus type is not fully compatible
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  backgroundColor: '#1e1e1e',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowX: 'auto',
                }}
                wrapLongLines={true}
                {...props}
              >
                {Array.isArray(children) ? children.join('') : String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
