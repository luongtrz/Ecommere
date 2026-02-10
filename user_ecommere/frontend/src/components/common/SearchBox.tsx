import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative group">
      <div className={`
        relative flex items-center rounded-xl border transition-all duration-300
        ${isFocused
          ? 'border-blue-400 shadow-lg shadow-blue-500/10 bg-white ring-2 ring-blue-100'
          : 'border-gray-200 bg-gray-50/80 hover:bg-white hover:border-gray-300'
        }
      `}>
        <Search className={`
          absolute left-3.5 h-4 w-4 transition-colors duration-200
          ${isFocused ? 'text-blue-500' : 'text-gray-400'}
        `} />
        <input
          type="search"
          placeholder="Tim kiem san pham..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="
            w-full py-2.5 pl-10 pr-4 bg-transparent text-sm
            placeholder:text-gray-400
            focus:outline-none
          "
        />
      </div>
    </form>
  );
}
