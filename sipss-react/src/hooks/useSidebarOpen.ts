import { useEffect, useState } from 'react';

const STORAGE_KEY = 'sipss-sidebar-open';

function getInitial(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'true') return true;
  if (stored === 'false') return false;
  return window.innerWidth >= 1024;
}

export function useSidebarOpen() {
  const [open, setOpen] = useState(getInitial);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(open));
    }
  }, [open]);

  return [open, setOpen] as const;
}
