import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, History, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock popular products for suggestions
const POPULAR_PRODUCTS = [
  { id: '1', name: 'Nước hoa Body Mist (combo 3 chai)', slug: 'nuoc-hoa-body-mist-combo-3-chai' },
  { id: '2', name: 'Tinh dầu thơm phòng', slug: 'tinh-dau-thom-phong' },
  { id: '3', name: 'Xịt thơm quần áo', slug: 'xit-thom-quan-ao' },
];

const POPULAR_KEYWORDS = ['Body mist', 'Tinh dầu', 'Quà tặng', 'Xịt thơm'];

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    // Save to history
    const newRecent = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));

    setIsFocused(false);
    setQuery(searchTerm); // Update input to show what was clicked
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const removeRecent = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const newRecent = recentSearches.filter(s => s !== term);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
  };

  return (
    <div ref={containerRef} className="relative group w-full z-50">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`
          relative flex items-center rounded-xl border transition-all duration-300
          ${isFocused
            ? 'border-blue-500 shadow-lg shadow-blue-500/10 bg-white ring-2 ring-blue-100 rounded-b-none border-b-0'
            : 'border-gray-200 bg-gray-50/80 hover:bg-white hover:border-gray-300'
          }
        `}>
          <Search className={`
            absolute left-3.5 h-4 w-4 transition-colors duration-200
            ${isFocused ? 'text-blue-500' : 'text-gray-400'}
          `} />
          <input
            type="search"
            placeholder="Tìm kiếm sản phẩm, danh mục..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="
              w-full py-2.5 pl-10 pr-10 bg-transparent text-sm
              placeholder:text-gray-400
              focus:outline-none
            "
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown Suggestions */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 bg-white rounded-b-xl border border-t-0 border-blue-500 shadow-xl overflow-hidden animate-fade-in origin-top">
          <div className="p-2">
            {query.trim() === '' ? (
              <>
                {recentSearches.length > 0 && (
                  <div className="mb-4 px-2">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <History className="h-3 w-3" />
                      Tìm kiếm gần đây
                    </h3>
                    <div className="space-y-1">
                      {recentSearches.map((term, idx) => (
                        <div key={idx} className="flex items-center justify-between group/item hover:bg-gray-50 rounded-lg px-2 py-1.5 cursor-pointer" onClick={() => handleSearch(term)}>
                          <span className="text-sm text-gray-700">{term}</span>
                          <button onClick={(e) => removeRecent(e, term)} className="opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-red-400">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-2 pb-2">
                  <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Xu hướng tìm kiếm
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_KEYWORDS.map((keyword, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSearch(keyword)}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 text-sm rounded-lg border border-gray-100 transition-colors"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="px-2 pb-2">
                <button onClick={() => handleSearch(query)} className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Tìm kiếm cho "{query}"
                </button>
                {/* Mock product suggestions matching query could go here */}
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-3 border-t">
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Sản phẩm nổi bật</h4>
            <div className="space-y-2">
              {POPULAR_PRODUCTS.map(prod => (
                <Link to={`/p/${prod.slug}`} key={prod.id} className="flex items-center gap-3 hover:bg-white p-2 rounded-lg transition-colors group">
                  <div className="w-10 h-10 bg-gray-200 rounded-md overflow-hidden">
                    {/* Placeholder image since we don't have real URLs here easily */}
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">{prod.name}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
