import { useEffect, useRef } from 'react';
import { track } from '../lib/telemetry';

// Supports both signatures for backward compatibility:
// - useImpression(ref, payload)
// - useImpression(eventName, payload) -> returns a ref
export function useImpression(refOrEvent, payload) {
  const internalRef = useRef(null);
  const ref = isRefObject(refOrEvent) ? refOrEvent : internalRef;
  const eventName = typeof refOrEvent === 'string' ? refOrEvent : 'impression';
  const sentRef = useRef(false);

  useEffect(() => {
    const el = ref?.current;
    if (!el || sentRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!sentRef.current && entry.intersectionRatio >= 0.6) {
            track(eventName, payload);
            sentRef.current = true;
            io.disconnect();
            break;
          }
        }
      },
      { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eventName, payload, ref]);

  return ref;
}

function isRefObject(obj) {
  return obj && typeof obj === 'object' && 'current' in obj;
}


