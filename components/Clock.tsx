'use client';

import { useEffect, useState } from 'react';

/** Live local time for a zone, e.g. "9:41 pm". Client-only to avoid a hydration mismatch. */
export default function Clock({ timeZone }: { timeZone: string }) {
  const [now, setNow] = useState('');
  useEffect(() => {
    const tick = () =>
      setNow(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone }).toLowerCase());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [timeZone]);
  return <time suppressHydrationWarning>{now}</time>;
}
