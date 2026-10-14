import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';

export interface ChatMarkdownProps {
  content: string;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="text-sm break-words leading-relaxed space-y-2.5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-foreground/90">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          ul: ({ children }) => <ul className="my-2 list-disc pl-5 space-y-1 text-foreground/90">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal pl-5 space-y-1 text-foreground/90 tabular-nums">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="text-base font-bold text-foreground mt-3 mb-1.5 tracking-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold text-foreground mt-2.5 mb-1 tracking-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2 mb-1">{children}</h3>,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-border/80 shadow-sm">
              <table className="w-full border-collapse text-left text-xs tabular-nums">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="sticky top-0 border-b border-border/80 bg-muted/90 backdrop-blur-sm px-4 py-3 font-semibold text-foreground text-xs whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border/40 px-4 py-3 text-foreground/90 transition-colors hover:bg-muted/40">
              {children}
            </td>
          ),
          code: ({ children }) => (
            <code className="rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-primary font-medium">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="my-3 overflow-x-auto rounded-xl border border-border/70 bg-background/80 p-3.5 font-mono text-xs text-foreground/90 shadow-inner [&>code]:bg-transparent [&>code]:p-0 [&>code]:rounded-none [&>code]:border-0 [&>code]:text-inherit">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-primary/50 bg-muted/20 py-1 pl-3.5 italic text-muted-foreground rounded-r-md">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-border/60" />,
          img: ({ alt }) => (
            <span className="text-muted-foreground">{alt}</span>
          ),
          a: ({ href, children }) => {
            const linkClasses = "font-medium text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm";
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
