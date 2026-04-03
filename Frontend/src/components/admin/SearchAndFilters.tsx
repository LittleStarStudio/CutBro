// File: src/components/admin/SearchAndFilters.tsx

import React from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface Filter {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}

interface SearchAndFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchPlaceholder: string;
  filters: Filter[];
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  searchPlaceholder,
  filters
}) => {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 mb-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input — min width agar tidak terjepit filter */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
          />
        </div>

        {/* Filter Dropdowns — lebih kecil */}
        {filters.map((filter, index) => (
          <div key={index} className="md:w-32">
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all cursor-pointer"
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value} className="bg-zinc-800 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchAndFilters;