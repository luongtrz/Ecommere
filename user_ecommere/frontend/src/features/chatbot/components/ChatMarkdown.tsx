import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';

export interface ChatMarkdownProps {
  content: string;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="text-sm md:text-[14px] break-words leading-relaxed space-y-2 text-foreground/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          ul: ({ children }) => <ul className="my-2 list-disc pl-5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal pl-5 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="font-serif text-base md:text-lg font-bold text-foreground mt-3 mb-1 tracking-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="font-serif text-sm md:text-base font-bold text-foreground mt-2.5 mb-1 tracking-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="font-serif text-xs md:text-sm font-semibold text-foreground mt-2 mb-1">{children}</h3>,
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border bg-muted/80 px-3 py-2 font-semibold text-foreground tracking-wide text-[11px] uppercase">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border/60 px-3 py-2 text-foreground/90">{children}</td>
          ),
          code: ({ children }) => (
            <code className="rounded-md border border-border/50 bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-foreground">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-3 font-mono text-xs text-foreground [&>code]:bg-transparent [&>code]:p-0 [&>code]:rounded-none [&>code]:border-0">
              {children}
            </pre>
          ),
          img: ({ alt }) => (
            <span className="text-muted-foreground">{alt}</span>
          ),
          a: ({ href, children }) => {
            if (href && href.startsWith('/') && !href.startsWith('//')) {
              return (
                <Link to={href} className="text-primary font-medium underline underline-offset-4 decoration-accent/60 hover:decoration-primary transition-colors">
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
                  className="text-primary font-medium underline underline-offset-4 decoration-accent/60 hover:decoration-primary transition-colors"
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
