import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';

export interface ChatMarkdownProps {
  content: string;
  size?: 'sm' | 'base';
}

function isNumericCell(children: React.ReactNode): boolean {
  if (typeof children === 'number') return true;
  if (typeof children === 'string') {
    const trimmed = children.trim();
    if (!trimmed) return false;
    return /^[\d\s.,%+₫$€¥/-]+$/.test(trimmed) && /\d/.test(trimmed);
  }
  if (Array.isArray(children) && children.length === 1) {
    return isNumericCell(children[0]);
  }
  return false;
}

interface ChatMarkdownImageProps {
  src?: string;
  alt?: string;
}

function ChatMarkdownImage({ src, alt }: ChatMarkdownImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <span className="text-muted-foreground text-xs italic">
        {alt || 'Hình ảnh không tải được'}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className="max-h-36 max-w-xs rounded-lg border border-border object-contain my-2 bg-muted/20"
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}

export const ChatMarkdown = memo(
  function ChatMarkdown({ content, size = 'sm' }: ChatMarkdownProps) {
    const isBase = size === 'base';

    return (
      <div
        className={`${
          isBase ? 'text-base' : 'text-sm'
        } break-words leading-relaxed space-y-2`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">
                {children}
              </strong>
            ),
            ul: ({ children }) => (
              <ul className="my-2 list-disc pl-5 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="my-2 list-decimal pl-5 space-y-1">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">{children}</li>
            ),
            h1: ({ children }) => (
              <h1
                className={`${
                  isBase ? 'text-xl' : 'text-lg'
                } font-bold text-foreground mt-3 mb-1`}
              >
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2
                className={`${
                  isBase ? 'text-lg' : 'text-base'
                } font-bold text-foreground mt-2.5 mb-1`}
              >
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3
                className={`${
                  isBase ? 'text-base' : 'text-sm'
                } font-semibold text-foreground mt-2 mb-1`}
              >
                {children}
              </h3>
            ),
            table: ({ children }) => (
              <div className="my-2 overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-left text-xs tabular-nums">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-muted">{children}</thead>
            ),
            tr: ({ children }) => (
              <tr className="border-b border-border last:border-b-0 even:bg-muted/40">
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className="border border-border bg-muted px-2.5 py-1.5 font-semibold text-foreground tabular-nums">
                {children}
              </th>
            ),
            td: ({ children }) => {
              const numeric = isNumericCell(children);
              return (
                <td
                  className={`border border-border px-2.5 py-1.5 tabular-nums ${
                    numeric ? 'text-right' : 'text-left'
                  }`}
                >
                  {children}
                </td>
              );
            },
            code: ({ children }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="my-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs [&>code]:bg-transparent [&>code]:p-0 [&>code]:rounded-none">
                {children}
              </pre>
            ),
            img: ({ src, alt }) => <ChatMarkdownImage src={src} alt={alt} />,
            a: ({ href, children }) => {
              if (href && href.startsWith('/') && !href.startsWith('//')) {
                return (
                  <Link
                    to={href}
                    className="text-primary underline underline-offset-2 hover:opacity-80"
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
  },
  (prevProps, nextProps) =>
    prevProps.content === nextProps.content &&
    (prevProps.size ?? 'sm') === (nextProps.size ?? 'sm')
);

ChatMarkdown.displayName = 'ChatMarkdown';

export default ChatMarkdown;
