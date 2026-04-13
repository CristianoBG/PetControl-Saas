import { useState, useEffect } from 'react';

/**
 * Hook para debugar valores que mudam rapidamente (ex: input de busca).
 * Retorna o valor apenas após o delay especificado.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
