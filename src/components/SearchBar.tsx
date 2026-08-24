import { motion, AnimatePresence } from 'motion/react';
import { SearchIcon, CloseIcon } from './Icons';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSearch?: (q: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChange, onSearch, placeholder = 'Search songs, artists, albums...', className = '', autoFocus = false }: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch?.(value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-10 pr-10 py-2.5 bg-surface-2 border border-border rounded-full text-text text-[0.9rem] placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
        aria-label="Search music"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-surface-3 transition-colors"
          aria-label="Clear search"
        >
          <CloseIcon size={14} className="text-text-muted" />
        </button>
      )}
    </div>
  );
}
