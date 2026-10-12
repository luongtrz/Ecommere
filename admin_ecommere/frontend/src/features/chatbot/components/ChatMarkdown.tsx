import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';

export interface ChatMarkdownProps {
  content: string;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="text-sm break-words leading-relaxed space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          ul: ({ children }) => <ul className="my-2 list-disc pl-5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal pl-5 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="text-base font-bold text-foreground mt-3 mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold text-foreground mt-2 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">{children}</h3>,
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full border-collapse border border-border text-left text-xs">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted px-2.5 py-1.5 font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-2.5 py-1.5">{children}</td>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs [&>code]:bg-transparent [&>code]:p-0 [&>code]:rounded-none">
              {children}
            </pre>
          ),
          a: ({ href, children }) => {
            if (href && href.startsWith('/') && !href.startsWith('//')) {
              return (
                <Link to={href} className="text-primary underline underline-offset-2 hover:opacity-80">
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
                  className="text-primary underline underline-offset-2 hover:opacity-80"
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
