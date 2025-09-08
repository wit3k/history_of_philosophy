import { useState, useEffect } from 'react';

export default function useWindowDimensions() {
  const hasWindow = typeof window !== 'undefined';

  const getWindowDimensions = () => ({
    width: hasWindow ? window.innerWidth : 0,
    height: hasWindow ? window.innerHeight : 0,
  });

  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions(),
  );

  useEffect(() => {
    if (hasWindow) {
      function handleResize() {
        setWindowDimensions(getWindowDimensions());
      }

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [hasWindow]);

  return windowDimensions;
}
