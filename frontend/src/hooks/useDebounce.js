import { useCallback, useRef } from 'react';

export const useDebounce = (callback, delay) => {
  const debounceRef = useRef();

  const debouncedCallback = useCallback((...args) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  return debouncedCallback;
};
