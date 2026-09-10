import { useEffect, useCallback, useRef } from 'react';

export interface SSEEvent {
  type: string;
  unitId?: number;
  fileName?: string;
  questionCount?: number;
  step?: number;
  total?: number;
  error?: string;
  warning?: boolean;
}

export function useSSE(onEvent: (event: SSEEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    const es = new EventSource('/api/events');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as SSEEvent;
        onEventRef.current(data);
      } catch {
        // ignore parse errors
      }
    };
    es.onerror = () => {
      es.close();
      // Reconnect after 3s
      setTimeout(connect, 3000);
    };
    return es;
  }, []);

  useEffect(() => {
    const es = connect();
    return () => es.close();
  }, [connect]);
}
