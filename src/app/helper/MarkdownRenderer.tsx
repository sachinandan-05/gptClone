'use client'

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { match } from 'assert';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface MarkdownRendererProps {
  content: string;
}

interface CodeBlockProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  inline = false,
  className = '',
  children,
  ...props
}) => {
  const code = String(children).replace(/\n$/, '');
  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1] || 'text';

  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (inline) {
    return (
      <code className="bg-gray-700 rounded px-1 py-0.5 text-sm font-mono">
        {children}
      </code>
    );
  }

  return (
    <div className="code-block-container">
      <motion.div 
        className="my-4 rounded-lg overflow-hidden bg-[#1e1e1e] code-block relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-gray-300 text-sm">
        <span>{language}</span>
        <motion.button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 hover:text-white transition-colors text-xs px-2 py-1 rounded-md hover:bg-white/10 cursor-pointer"
          aria-label="Copy code"
          whileTap={{ scale: 0.95 }}
          initial={false}
          animate={isCopied ? 'copied' : 'idle'}
          variants={{
            idle: { backgroundColor: 'rgba(0, 0, 0, 0)' },
            copied: { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
          } as Variants}
        >
          <AnimatePresence mode="wait">
            {isCopied ? (
              <motion.span 
                key="check"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-green-400 flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Copied!
              </motion.span>
            ) : (
              <motion.span 
                key="copy"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: '#1e1e1e',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          padding: '1rem',
        }}
        showLineNumbers={false}
        wrapLines={true}
        wrapLongLines={true}
        {...props}
      >
        {code}
      </SyntaxHighlighter>
      </motion.div>
    </div>
  );
};

interface BaseMarkdownProps {
  node?: unknown;
  className?: string;
  children?: React.ReactNode;
}

// Specific prop types for different elements
interface ParagraphProps extends React.HTMLAttributes<HTMLParagraphElement>, BaseMarkdownProps {}
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement>, BaseMarkdownProps {}
interface ListProps extends React.HTMLAttributes<HTMLUListElement>, BaseMarkdownProps {}
interface OrderedListProps extends React.OlHTMLAttributes<HTMLOListElement>, BaseMarkdownProps {}
interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement>, BaseMarkdownProps {}
interface AnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>, BaseMarkdownProps {}
interface BlockquoteProps extends React.BlockquoteHTMLAttributes<HTMLQuoteElement>, BaseMarkdownProps {}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components = {
    // Handle paragraphs to prevent nesting block elements
    p: ({ children, ...props }: ParagraphProps) => {
      // Check if this paragraph contains any block elements
      const hasBlockElement = React.Children.toArray(children).some(
        (child) => {
          if (!React.isValidElement(child)) return false;
          
          // Handle both string tags and component types
          const elementType = child.type as string | React.ComponentType;
          
          // Get the tag name or component name
          let tagName = '';
          if (typeof elementType === 'string') {
            tagName = elementType.toLowerCase();
          } else if (elementType) {
            // For components, check their displayName or name
            tagName = (
              (elementType as any).displayName ||
              elementType.name ||
              ''
            ).toLowerCase();
          }
          
          // List of block-level elements
          const blockElements = [
            'div', 'pre', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
            'thead', 'tbody', 'tfoot', 'blockquote', 'h1', 'h2', 'h3',
            'h4', 'h5', 'h6', 'hr', 'figure', 'figcaption', 'section',
            'article', 'aside', 'header', 'footer', 'nav', 'main', 'codeblock'
          ];
          
          const childProps = child.props as { className?: string };
          return blockElements.includes(tagName) || 
                 (childProps?.className?.includes('code-block') ?? false);
        }
      );
      
      // If there's a block element, render as div instead of p
      if (hasBlockElement) {
        return <div className="markdown-block">{children}</div>;
      }
      
      // Otherwise, render as normal paragraph
      return (
        <p className="mb-4 last:mb-0" {...props}>{children}</p>
      );
    },
    // Handle code blocks
    code: CodeBlock,
    // Add proper styling for other markdown elements
    h1: ({ children, ...props }: HeadingProps) => (
      <h1 className="text-3xl font-bold mt-8 mb-4" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: HeadingProps) => (
      <h2 className="text-2xl font-bold mt-6 mb-3" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: HeadingProps) => (
      <h3 className="text-xl font-bold mt-4 mb-2" {...props}>
        {children}
      </h3>
    ),
    ul: ({ children, ...props }: ListProps) => (
      <ul className="list-disc pl-6 my-4 space-y-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: OrderedListProps) => (
      <ol className="list-decimal pl-6 my-4 space-y-2" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: ListItemProps) => (
      <li className="pl-2" {...props}>
        {children}
      </li>
    ),
    a: ({ children, className = '', ...props }: AnchorProps) => (
      <a
        className={`text-blue-400 hover:underline ${className}`}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    blockquote: ({ children, ...props }: BlockquoteProps) => (
      <blockquote 
        className="border-l-4 border-gray-600 pl-4 italic text-gray-400 my-4" 
        {...props}
      >
        {children}
      </blockquote>
    ),
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
