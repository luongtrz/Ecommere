import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getAllowedChatImageUrl } from '../lib/chatImagePolicy';

export interface ChatMarkdownProps {
  content: string;
  size?: 'sm' | 'base';
}

interface ChatMarkdownImageProps {
  src?: string;
  alt?: string;
}

function ChatMarkdownImage({ src, alt }: ChatMarkdownImageProps) {
  const [failed, setFailed] = React.useState(false);
  const safeSrc = getAllowedChatImageUrl(src);

  if (!safeSrc || failed) {
    if (!alt) {
      return null;
    }
    return <span className="text-muted-foreground">{alt}</span>;
  }

  return (
    <img
      src={safeSrc}
      alt={alt ?? ''}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="my-2 block max-h-72 w-auto max-w-full rounded-xl border border-border object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export const ChatMarkdown = React.memo(
  function ChatMarkdown({ content, size = 'sm' }: ChatMarkdownProps) {
    const isBase = size === 'base';

    return (
      <div className={cn('break-words leading-relaxed space-y-2', isBase ? 'text-base' : 'text-sm')}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
            ul: ({ children }) => <ul className="my-2 list-disc pl-5 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="my-2 list-decimal pl-5 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            h1: ({ children }) => (
              <h1 className={cn('font-bold text-foreground mt-3 mb-1', isBase ? 'text-xl' : 'text-lg')}>
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className={cn('font-bold text-foreground mt-2.5 mb-1', isBase ? 'text-lg' : 'text-base')}>
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className={cn('font-semibold text-foreground mt-2 mb-1', isBase ? 'text-base' : 'text-sm')}>
                {children}
              </h3>
            ),
            table: ({ children }) => (
              <div className="my-2 overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-left text-xs">
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
              <th className="border-b border-border bg-muted px-2.5 py-1.5 font-semibold text-foreground">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-2.5 py-1.5">{children}</td>
            ),
            code: ({ children }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{children}</code>
            ),
            pre: ({ children }) => (
              <pre className="my-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs [&>code]:bg-transparent [&>code]:p-0 [&>code]:rounded-none">
                {children}
              </pre>
            ),
            // Images are allowed only through chatImagePolicy allowlist (Shop's Cloudinary cloud
            // or origin). Commit c16c9dac previously rendered alt text only to mitigate data
            // exfiltration via prompt injection in model-produced URLs. Blocked or failed images
            // continue rendering as plain alt text.
            img: ({ src, alt }) => <ChatMarkdownImage src={src} alt={alt} />,
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
  },
  (prevProps, nextProps) =>
    prevProps.content === nextProps.content &&
    (prevProps.size ?? 'sm') === (nextProps.size ?? 'sm')
);

export default ChatMarkdown;
