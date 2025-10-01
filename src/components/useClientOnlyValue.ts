import { useEffect, useState } from 'react';

export function useClientOnlyValue<T>(web: T, native: T): T {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? native : web;
}
