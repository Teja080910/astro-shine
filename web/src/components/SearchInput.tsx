'use client';

import { Search } from 'lucide-react';

export function SearchInput({
  value,
  onChange,
  onEnter,
  placeholder = 'Search...',
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  onEnter?: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative flex-1 max-w-md ${className}`}>
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onEnter?.(value);
          }
        }}
        placeholder={placeholder}
        className="input-field pl-10 pr-4 py-3 text-sm w-full"
      />
    </div>
  );
}

export function matchesSearch(
  query: string,
  ...fields: (string | number | null | undefined)[]
): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return fields.some((f) => f != null && String(f).toLowerCase().includes(q));
}
