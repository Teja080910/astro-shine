'use client';

import { useEffect, useState } from 'react';

/**
 * Debounce a value.
 *
 * Admin table searches previously only ran when the user pressed Enter, because
 * `SearchInput` commits its value from a keydown handler. Typing a query and
 * clicking a row left the results unfiltered, which read as a broken search.
 *
 * `useDebouncedValue` lets a page react to typing without firing a request on
 * every keystroke:
 *
 *   const [search, setSearch] = useState('');
 *   const debounced = useDebouncedValue(search, 300);
 *   useEffect(() => { load(debounced); }, [debounced]);
 *
 * Pass `delay = 0` when you want an immediate commit (e.g. pressing Enter).
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (delay <= 0) {
      setDebounced(value);
      return;
    }
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
