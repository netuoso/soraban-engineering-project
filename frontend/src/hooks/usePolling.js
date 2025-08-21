import { useEffect, useRef } from 'react';

export const usePolling = (callback, interval = 2500, dependencies = []) => {
  const savedCallback = useRef();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the polling interval
  useEffect(() => {
    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, ...dependencies]);
};
