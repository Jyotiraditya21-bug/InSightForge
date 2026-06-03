import React, { useState } from "react";
import { Search, Sparkles } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="glass-panel p-2 flex items-center gap-2 pr-3">
        <div className="pl-3 text-gray-400 flex items-center justify-center">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What would you like me to research today?..."
          disabled={isLoading}
          className="flex-1 bg-transparent border-none outline-none py-3 text-white placeholder-gray-500 text-lg"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="gradient-btn px-6 py-3 h-[48px] min-w-[120px]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Running...</span>
            </div>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Research</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
