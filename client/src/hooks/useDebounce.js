import { useState, useEffect } from 'react';

/**
 * Custom lightweight useDebounce hook.
 * Delays updating the debounced value until after `delay` ms have elapsed
 * since the last time `value` changed.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
