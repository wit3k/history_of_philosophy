import { useEffect, useState } from 'react'

export default function useWindowDimensions() {
  const hasWindow = typeof window !== 'undefined'

  const getWindowDimensions = () => ({
    height: hasWindow ? window.innerHeight : 0,
    width: hasWindow ? window.innerWidth : 0,
  })

  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions())

  useEffect(() => {
    if (hasWindow) {
      function handleResize() {
        setWindowDimensions(getWindowDimensions())
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [hasWindow])

  return windowDimensions
}
