'use client';

import { useState, useCallback, FormEvent } from 'react';

interface SearchBarProps {
  onSubmit: (ticker: string) => void;
  isCompact: boolean;
  disabled: boolean;
  initialValue?: string;
}

export default function SearchBar({
  onSubmit,
  isCompact,
  disabled,
  initialValue = '',
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const ticker = value.trim().toUpperCase();
      if (ticker) onSubmit(ticker);
    },
    [value, onSubmit],
  );

  if (isCompact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-xl">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter stock ticker…"
            disabled={disabled}
            className="w-full pl-9 pr-3 py-2 bg-card border border-card-border rounded-lg
                       text-sm text-foreground placeholder:text-muted
                       focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30
                       disabled:opacity-50 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium
                     rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Analyze
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="relative">
        <svg
          className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter a stock ticker (e.g. TSLA, AAPL, NVDA)…"
          autoFocus
          className="w-full pl-14 pr-28 py-4 bg-card border border-card-border rounded-2xl
                     text-lg text-foreground placeholder:text-muted
                     focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
                     shadow-lg shadow-black/20 transition-all"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2
                     px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium
                     rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Analyze
        </button>
      </div>
      <div className="flex gap-2 mt-4 justify-center">
        {['TSLA', 'AAPL', 'NVDA', 'MSFT', 'AMZN'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setValue(t);
              onSubmit(t);
            }}
            className="px-3 py-1 text-xs text-muted-foreground bg-card-border/40 rounded-full
                       hover:bg-card-border hover:text-foreground transition-colors"
          >
            {t}
          </button>
        ))}
      </div>
    </form>
  );
}
