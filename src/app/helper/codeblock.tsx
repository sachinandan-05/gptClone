"use client"

import React, { useState } from "react"
import { Copy, Check } from "lucide-react"

interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
}

export default function CodeBlock({ 
  code, 
  language = "javascript", 
  showLineNumbers = true 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const formatCode = (code: string) => {
    return code.split('\n').map((line, index) => (
      <div key={index} className="flex hover:bg-[#2a2a2a] transition-colors duration-150">
        {showLineNumbers && (
          <span className="text-gray-500 text-sm mr-6 select-none w-4 text-right flex-shrink-0 font-mono">
            {index + 1}
          </span>
        )}
        <span className="flex-1 min-w-0 font-mono text-sm">
          <SyntaxHighlightedLine line={line} language={language} />
        </span>
      </div>
    ))
  }

  return (
    <div className="bg-[#1e1e1e] rounded-lg overflow-hidden my-4 border border-[#3a3a3a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d2d] border-b border-[#3a3a3a]">
        <span className="text-gray-300 text-sm font-medium">
          {language}
        </span>
        
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all duration-300 ease-in-out cursor-pointer transform ${
            copied 
              ? 'bg-green-600 text-white scale-105' 
              : 'text-gray-300 hover:text-white hover:bg-[#3a3a3a] hover:scale-105 active:scale-95'
          }`}
        >
          <div className={`transition-transform duration-300 ${copied ? 'rotate-12' : ''}`}>
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </div>
          <span className="transition-all duration-300">
            {copied ? 'Copied!' : 'Copy'}
          </span>
        </button>
      </div>

      {/* Code Content */}
      <div className="bg-[#1e1e1e] overflow-x-auto">
        <pre className="p-4 leading-relaxed">
          <code className="text-gray-100">
            {formatCode(code)}
          </code>
        </pre>
      </div>
    </div>
  )
}

// Enhanced syntax highlighting component matching the reference image
function SyntaxHighlightedLine({ line, language }: { line: string, language: string }) {
  const highlightSyntax = (text: string) => {
    if (!text.trim()) return '&nbsp;'
    
    let highlighted = text
    
    // C++ specific highlighting to match the reference
    if (language.toLowerCase() === 'cpp' || language.toLowerCase() === 'c++') {
      // Preprocessor directives
      highlighted = highlighted.replace(/(#include|#define|#ifndef|#ifdef|#endif)/g, '<span class="text-[#c586c0]">$1</span>')
      
      // Header files in angle brackets
      highlighted = highlighted.replace(/(<[^>]+>)/g, '<span class="text-[#4ec9b0]">$1</span>')
      
      // Keywords (blue/purple)
      const cppKeywords = ['int', 'main', 'return', 'void', 'char', 'float', 'double', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'class', 'struct', 'public', 'private', 'protected', 'namespace', 'using', 'std']
      cppKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g')
        highlighted = highlighted.replace(regex, `<span class="text-[#569cd6]">${keyword}</span>`)
      })
      
      // Numbers
      highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-[#b5cea8]">$1</span>')
      
      // Strings
      highlighted = highlighted.replace(/"([^"]*)"/g, '<span class="text-[#ce9178]">"$1"</span>')
      
      // Operators
      highlighted = highlighted.replace(/(<<|>>|::|\+\+|--|==|!=|<=|>=|&&|\|\||[+\-*\/=<>!&|])/g, '<span class="text-[#d4d4d4]">$1</span>')
      
      // Parentheses, brackets, braces
      highlighted = highlighted.replace(/([()[\]{}])/g, '<span class="text-[#ffd700]">$1</span>')
      
      // Semicolons
      highlighted = highlighted.replace(/(;)/g, '<span class="text-[#d4d4d4]">$1</span>')
      
      // Function names and std namespace
      highlighted = highlighted.replace(/(std)(::)/g, '<span class="text-[#4ec9b0]">$1</span><span class="text-[#d4d4d4]">$2</span>')
      highlighted = highlighted.replace(/(cout|endl|cin)/g, '<span class="text-[#4ec9b0]">$1</span>')
    } 
    // Python highlighting
    else if (language.toLowerCase() === 'python') {
      // Keywords
      const pythonKeywords = ['for', 'in', 'if', 'else', 'elif', 'while', 'def', 'class', 'import', 'from', 'return', 'try', 'except', 'with', 'as', 'and', 'or', 'not', 'is', 'True', 'False', 'None']
      pythonKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g')
        highlighted = highlighted.replace(regex, `<span class="text-[#569cd6]">${keyword}</span>`)
      })
      
      // Built-in functions
      const builtins = ['print', 'range', 'len', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple']
      builtins.forEach(builtin => {
        const regex = new RegExp(`\\b${builtin}\\b`, 'g')
        highlighted = highlighted.replace(regex, `<span class="text-[#dcdcaa]">${builtin}</span>`)
      })
      
      // Numbers
      highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-[#b5cea8]">$1</span>')
      
      // Strings
      highlighted = highlighted.replace(/f?"([^"]*)"/g, '<span class="text-[#ce9178]">$&</span>')
      highlighted = highlighted.replace(/f?'([^']*)'/g, '<span class="text-[#ce9178]">$&</span>')
      
      // Variables in f-strings
      highlighted = highlighted.replace(/\{([^}]+)\}/g, '<span class="text-[#9cdcfe]">{$1}</span>')
      
      // Operators
      highlighted = highlighted.replace(/([+\-*\/=<>!&|]+)/g, '<span class="text-[#d4d4d4]">$1</span>')
      
      // Parentheses and brackets
      highlighted = highlighted.replace(/([()[\]{}])/g, '<span class="text-[#ffd700]">$1</span>')
    } 
    // JavaScript/TypeScript highlighting
    else {
      // Keywords
      const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'class', 'interface', 'type', 'async', 'await']
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g')
        highlighted = highlighted.replace(regex, `<span class="text-[#569cd6]">${keyword}</span>`)
      })
      
      // Strings
      highlighted = highlighted.replace(/(["'`])([^"'`]*)\1/g, '<span class="text-[#ce9178]">$1$2$1</span>')
      
      // Numbers
      highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-[#b5cea8]">$1</span>')
      
      // Operators
      highlighted = highlighted.replace(/([+\-*\/=<>!&|]+)/g, '<span class="text-[#d4d4d4]">$1</span>')
      
      // Parentheses and brackets
      highlighted = highlighted.replace(/([()[\]{}])/g, '<span class="text-[#ffd700]">$1</span>')
    }
    
    // Comments (for all languages)
    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-[#6a9955]">$1</span>')
    highlighted = highlighted.replace(/(#.*$)/gm, '<span class="text-[#6a9955]">$1</span>')
    
    return highlighted
  }

  return (
    <span 
      className="block"
      dangerouslySetInnerHTML={{ 
        __html: highlightSyntax(line || '') 
      }} 
    />
  )
}