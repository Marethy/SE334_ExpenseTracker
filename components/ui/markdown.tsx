"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  children: string;
  className?: string;
}

export const Markdown = ({ children, className }: MarkdownProps) => {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings với style rõ ràng hơn
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-3 text-gray-800 mt-6">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mb-2 text-gray-700 mt-4">
              {children}
            </h3>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-gray-700">{children}</p>
          ),

          // Lists với spacing tốt hơn
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 pl-4">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 leading-relaxed">{children}</li>
          ),

          // Tables với style tốt hơn
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-200">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
              {children}
            </td>
          ),

          // Code blocks
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";

            if (language) {
              const { ref, key, ...safeProps } = props;
              return (
                <div className="my-4">
                  <div className="bg-gray-800 text-gray-200 px-3 py-1 text-xs rounded-t-md font-medium">
                    {language}
                  </div>
                  <SyntaxHighlighter
                    style={oneDark as any}
                    language={language}
                    PreTag="div"
                    className="!mt-0 !rounded-t-none !text-sm"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                </div>
              );
            }

            return (
              <code
                className="bg-gray-100 text-red-600 px-2 py-1 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic rounded-r">
              {children}
            </blockquote>
          ),

          // Links
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              {children}
            </a>
          ),

          // Strong và emphasis
          strong: ({ children }) => (
            <strong className="font-bold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-600">{children}</em>
          ),

          // Horizontal rule
          hr: () => <hr className="my-6 border-gray-300" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};
