import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, History, Search, Sparkles, X } from 'lucide-react';
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
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (searchTerm: string) => {
    const nextRecent = [
      searchTerm,
      ...recentSearches.filter((item) => item !== searchTerm),
    ].slice(0, 5);
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
            'flex items-center rounded-2xl border px-3.5 py-1.5 transition-all duration-300',
            showingSuggestions
              ? 'border-teal-600 bg-white shadow-lg ring-2 ring-teal-600/20'
              : 'border-slate-200/90 bg-slate-50/80 hover:border-slate-300 hover:bg-white',
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="search"
            placeholder="Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            className="w-full bg-transparent px-3 py-1 text-sm outline-none placeholder:text-slate-400 text-slate-900"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </form>

      {showingSuggestions ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl">
          <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
            <div className="p-4">
              {deferredQuery ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleSearch(deferredQuery)}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition hover:bg-teal-50 text-slate-800 hover:text-teal-900 font-medium"
                  >
                    <Search className="h-4 w-4 text-teal-600" />
                    <span className="flex-1">
                      Tìm kiếm cho{' '}
                      <strong className="text-teal-700">
                        “{deferredQuery}”
                      </strong>
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </button>
                  <p className="px-4 text-xs text-slate-500">
                    Mẹo: Nhập tên sản phẩm, công dụng (đuổi chuột, diệt gián,
                    tẩy bồn cầu) để xem nhanh.
                  </p>
                </div>
              ) : (
                <>
                  {recentSearches.length > 0 ? (
                    <div className="mb-4">
                      <p className="mb-2 flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <History className="h-3.5 w-3.5 text-slate-500" />
                        Tìm gần đây
                      </p>
                      <div className="space-y-1">
                        {recentSearches.map((term) => (
                          <div
                            key={term}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSearch(term)}
                            onKeyDown={(event) => {
                              if (event.target !== event.currentTarget) {
                                return;
                              }
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleSearch(term);
                              }
                            }}
                            className="group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                          >
                            <span>{term}</span>
                            <button
                              onClick={(event) => removeRecent(event, term)}
                              className="rounded-md p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-700"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <p className="mb-2.5 flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Gợi ý phổ biến
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_KEYWORDS.map((keyword) => (
                        <button
                          key={keyword}
                          onClick={() => handleSearch(keyword)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800"
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 p-4 md:border-l md:border-t-0">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Sản phẩm tìm kiếm nhiều
              </p>
              <div className="space-y-2">
                {POPULAR_SEARCHES.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSearch(product.query)}
                    className="group flex w-full items-center gap-3 rounded-xl bg-white p-2.5 text-left border border-slate-200/70 transition hover:border-teal-400 hover:shadow-md"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 text-xs font-bold">
                      TS
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900 group-hover:text-teal-700">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Chính hãng Thái Lan
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
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
