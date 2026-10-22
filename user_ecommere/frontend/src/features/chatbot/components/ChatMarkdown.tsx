import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';

export interface ChatMarkdownProps {
  content: string;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="text-sm md:text-[14px] break-words leading-relaxed space-y-2 text-slate-700 font-sans">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed text-slate-700">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="my-2 list-disc pl-5 space-y-1 text-slate-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal pl-5 space-y-1 text-slate-700">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => (
            <h1 className="font-sans text-base md:text-lg font-bold text-slate-900 mt-3 mb-1 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-sans text-sm md:text-base font-bold text-slate-900 mt-2.5 mb-1 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-sans text-xs md:text-sm font-semibold text-slate-900 mt-2 mb-1 tracking-tight">
              {children}
            </h3>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900 tracking-wider text-[11px] uppercase">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-slate-100 px-3 py-2 text-slate-700">
              {children}
            </td>
          ),
          code: ({ children }) => (
            <code className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 [&>code]:bg-transparent [&>code]:p-0 [&>code]:rounded-none [&>code]:border-0">
              {children}
            </pre>
          ),
          img: ({ alt }) => <span className="text-slate-400">{alt}</span>,
          a: ({ href, children }) => {
            if (href && href.startsWith('/') && !href.startsWith('//')) {
              return (
                <Link
                  to={href}
                  className="text-teal-600 font-medium underline underline-offset-4 decoration-teal-300 hover:text-teal-700 hover:decoration-teal-600 transition-colors"
                >
                  {children}
                </Link>
              );
            }
            if (href && /^https?:\/\//i.test(href)) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-teal-600 font-medium underline underline-offset-4 decoration-teal-300 hover:text-teal-700 hover:decoration-teal-600 transition-colors"
                >
                  {children}
                </a>
              );
            }
            return <span>{children}</span>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default ChatMarkdown;
