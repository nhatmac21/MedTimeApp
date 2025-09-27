import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

export default function useClock(intervalMs = 1000) {
  const [now, setNow] = useState(dayjs());
  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
