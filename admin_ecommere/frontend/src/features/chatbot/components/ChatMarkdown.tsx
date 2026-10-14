import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';

export interface ChatMarkdownProps {
  content: string;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="text-sm break-words leading-relaxed space-y-2.5 text-slate-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-700">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
          ul: ({ children }) => <ul className="my-2 list-disc pl-5 space-y-1 text-slate-700">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal pl-5 space-y-1 text-slate-700 tabular-nums">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="text-base font-bold text-slate-900 mt-3 mb-1.5 tracking-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold text-slate-900 mt-2.5 mb-1 tracking-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-2 mb-1">{children}</h3>,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full border-collapse text-left text-xs tabular-nums">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="sticky top-0 border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-900 text-xs whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-slate-100 px-4 py-3 text-slate-700 transition-colors hover:bg-slate-50">
              {children}
            </td>
          ),
          code: ({ children }) => (
            <code className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-teal-700 font-medium">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="my-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3.5 font-mono text-xs text-slate-800 shadow-sm [&>code]:bg-transparent [&>code]:p-0 [&>code]:rounded-none [&>code]:border-0 [&>code]:text-inherit">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-teal-600 bg-teal-50/50 py-1 pl-3.5 italic text-slate-600 rounded-r-md">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-slate-200" />,
          img: ({ alt }) => (
            <span className="text-slate-400">{alt}</span>
          ),
          a: ({ href, children }) => {
            const linkClasses = "font-medium text-teal-600 underline underline-offset-4 decoration-teal-600/40 hover:text-teal-700 hover:decoration-teal-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-sm";
            if (href && href.startsWith('/') && !href.startsWith('//')) {
              return (
                <Link to={href} className={linkClasses}>
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
                  className={linkClasses}
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
