'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  language: string;
}

function CodeBlock({ children, className, language, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const copyToClipboard = async () => {
    const code = Array.isArray(children) ? children.join('') : String(children).replace(/\n$/, '');
    
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Language label and copy button header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 text-sm text-gray-300 rounded-t-lg border-b border-gray-700">
        <span className="font-mono text-xs uppercase tracking-wide">
          {language || 'code'}
        </span>
        <button
          onClick={copyToClipboard}
          className={`
            flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium
            transition-all duration-200 ease-in-out
            ${copied 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
            }
            ${copied ? 'scale-105' : 'scale-100'}
          `}
        >
          {copied ? (
            <>
              <Check size={12} className="animate-in fade-in-0 zoom-in-75 duration-200" />
              <span className="animate-in fade-in-0 slide-in-from-right-1 duration-200">
                Copied!
              </span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Syntax highlighted code */}
      <div className="relative overflow-hidden rounded-b-lg">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: '0 0 0.5rem 0.5rem',
            background: '#1e1e1e',
          }}
          {...props}
        >
          {Array.isArray(children) ? children.join('') : String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
        
        {/* Copy animation overlay */}
        {copied && (
          <div className="absolute inset-0 bg-green-500/10 animate-in fade-in-0 duration-300 pointer-events-none" />
        )}
      </div>
    </div>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose dark:prose-invert max-w-none prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            return !inline && (match || String(children).includes('\n')) ? (
              <CodeBlock 
                language={language}
                className={className}
                {...props}
              >
                {children}
              </CodeBlock>
            ) : (
              <code 
                className="bg-gray-800 text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Style other markdown elements for dark theme
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-white mb-4 mt-6 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-white mb-3 mt-5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-white mb-2 mt-4">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-gray-200 leading-relaxed mb-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-gray-200 mb-4 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-gray-200 mb-4 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-200">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-300 my-4">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-blue-400 hover:text-blue-300 underline"
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-gray-600 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-800">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border border-gray-600 px-4 py-2 text-left text-gray-200 font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-600 px-4 py-2 text-gray-200">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}