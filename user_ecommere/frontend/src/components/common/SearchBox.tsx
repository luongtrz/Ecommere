import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, History, Search, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const RECENT_SEARCHES_KEY = 'recentSearches';
const POPULAR_PRODUCTS = [
  { id: '1', name: 'Body mist hương sạch cho hằng ngày', slug: 'nuoc-hoa-body-mist-combo-3-chai' },
  { id: '2', name: 'Xịt phòng cho phòng khách và phòng ngủ', slug: 'tinh-dau-thom-phong' },
  { id: '3', name: 'Xịt thơm quần áo giữ mùi nhẹ và gọn', slug: 'xit-thom-quan-ao' },
];
const POPULAR_KEYWORDS = ['Body mist', 'Xịt phòng', 'Phòng khách', 'Quà tặng'];

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
            'flex items-center rounded-full border px-4 py-1.5 transition duration-300',
            showingSuggestions
              ? 'border-primary/30 bg-white shadow-[0_12px_40px_-12px_rgba(24,46,37,0.12)]'
              : 'border-white/80 bg-white/75 backdrop-blur hover:border-primary/20 hover:bg-white',
          )}
        >
          <Search className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            placeholder="Tìm mùi hương, sản phẩm, dung tích..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            className="w-full bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </form>

      {showingSuggestions ? (
        <div className="glass-panel absolute left-0 right-0 top-[calc(100%+0.6rem)] overflow-hidden rounded-[1.5rem]">
          <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
            <div className="p-4">
              {deferredQuery ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleSearch(deferredQuery)}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition hover:bg-secondary"
                  >
                    <Search className="h-4 w-4 text-primary" />
                    <span className="flex-1">
                      Tìm kiếm cho <strong className="text-foreground">“{deferredQuery}”</strong>
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <p className="px-4 text-xs text-muted-foreground">
                    Mẹo: nhập mùi hương, không gian sử dụng hoặc khoảng giá để tìm nhanh hơn.
                  </p>
                </div>
              ) : (
                <>
                  {recentSearches.length > 0 ? (
                    <div className="mb-5">
                      <p className="mb-3 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        <History className="h-3.5 w-3.5" />
                        Tìm gần đây
                      </p>
                      <div className="space-y-1">
                        {recentSearches.map((term) => (
                          <div
                            key={term}
                            onClick={() => handleSearch(term)}
                            className="group flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-secondary"
                          >
                            <span className="text-sm text-foreground">{term}</span>
                            <button
                              onClick={(event) => removeRecent(event, term)}
                              className="rounded-full p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-white hover:text-foreground"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <p className="mb-3 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                      Gợi ý nhanh
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_KEYWORDS.map((keyword) => (
                        <button
                          key={keyword}
                          onClick={() => handleSearch(keyword)}
                          className="rounded-full border border-border bg-white px-4 py-2 text-sm text-foreground transition hover:border-primary/30 hover:bg-secondary"
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-border/70 bg-secondary/60 p-4 md:border-l md:border-t-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Lựa chọn được xem nhiều
              </p>
              <div className="space-y-2">
                {POPULAR_PRODUCTS.map((product) => (
                  <Link
                    key={product.id}
                    to={`/p/${product.slug}`}
                    className="group flex items-center gap-3 rounded-2xl bg-white px-3 py-3 transition hover:translate-x-1 hover:shadow-lg"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,rgba(255,230,206,1),rgba(194,234,216,1))] text-sm font-bold text-foreground">
                      TS
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Xem chi tiết và chọn dung tích phù hợp</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
