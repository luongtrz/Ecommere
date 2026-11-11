import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, History, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const RECENT_SEARCHES_KEY = 'recentSearches';
const POPULAR_SEARCHES = [
  { id: '1', name: 'Xịt đuổi chuột ARS Thái Lan', query: 'chuột' },
  { id: '2', name: 'Xịt diệt gián kiến & thằn lằn', query: 'gián' },
  { id: '3', name: 'Tẩy rửa nhà bếp đa năng Magiclean', query: 'tẩy' },
  { id: '4', name: 'Xịt thơm phòng sả chanh O-Zone', query: 'sả chanh' },
];

const POPULAR_KEYWORDS = [
  'Đuổi chuột ARS',
  'Diệt gián kiến',
  'Xịt thằn lằn',
  'Tẩy bồn cầu',
  'Xịt thơm sả chanh',
  'Nước giặt Hygiene',
];

function readRecentSearches() {
  try {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    return saved ? (JSON.parse(saved) as string[]) : [];
  } catch {
    return [];
  }
}

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(query.trim());
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentSearches(readRecentSearches());

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (searchTerm: string) => {
    const nextRecent = [searchTerm, ...recentSearches.filter((item) => item !== searchTerm)].slice(0, 5);
    setRecentSearches(nextRecent);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextRecent));
  };

  const handleSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();

    if (!trimmed) {
      return;
    }

    saveRecentSearch(trimmed);
    setIsFocused(false);
    setQuery(trimmed);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleSearch(query);
  };

  const removeRecent = (event: React.MouseEvent, term: string) => {
    event.stopPropagation();
    const nextRecent = recentSearches.filter((item) => item !== term);
    setRecentSearches(nextRecent);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextRecent));
  };

  const showingSuggestions = isFocused;

  return (
    <div ref={containerRef} className="relative z-[70] w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            'flex h-11 items-center rounded-md border border-input bg-card px-3 transition-colors',
            showingSuggestions
              ? 'border-ring ring-1 ring-ring'
              : 'hover:border-foreground/30',
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            placeholder="Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            className="w-full bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Xóa tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </form>

      {showingSuggestions ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          <div className="grid gap-0 divide-y divide-border md:grid-cols-[1.2fr_0.8fr] md:divide-x md:divide-y-0">
            <div className="p-4">
              {deferredQuery ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSearch(deferredQuery)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Search className="h-4 w-4 text-primary" />
                    <span className="flex-1">
                      Tìm kiếm cho <strong className="font-semibold text-primary">“{deferredQuery}”</strong>
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <p className="px-3 text-xs text-muted-foreground">
                    Mẹo: Nhập tên sản phẩm, công dụng (đuổi chuột, diệt gián, tẩy bồn cầu) để xem nhanh.
                  </p>
                </div>
              ) : (
                <>
                  {recentSearches.length > 0 ? (
                    <div className="mb-4">
                      <p className="mb-2 flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <History className="h-3.5 w-3.5 text-muted-foreground" />
                        Tìm gần đây
                      </p>
                      <div className="space-y-1">
                        {recentSearches.map((term) => (
                          <div
                            key={term}
                            onClick={() => handleSearch(term)}
                            className="group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                          >
                            <span>{term}</span>
                            <button
                              type="button"
                              onClick={(event) => removeRecent(event, term)}
                              className="rounded-sm p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-secondary hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={`Xóa ${term}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <p className="mb-2.5 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Gợi ý phổ biến
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_KEYWORDS.map((keyword) => (
                        <button
                          key={keyword}
                          type="button"
                          onClick={() => handleSearch(keyword)}
                          className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:border-foreground/30 hover:bg-muted"
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-muted/30 p-4">
              <p className="mb-3 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sản phẩm tìm kiếm nhiều
              </p>
              <div className="space-y-2">
                {POPULAR_SEARCHES.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSearch(product.query)}
                    className="group flex w-full items-center gap-3 rounded-md border border-border bg-card p-2.5 text-left transition-colors hover:border-foreground/30"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-secondary font-serif text-xs font-semibold text-foreground">
                      TS
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">Chính hãng Thái Lan</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
