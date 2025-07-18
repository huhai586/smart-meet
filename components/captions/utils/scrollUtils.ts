import { useCallback, useEffect } from "react";





export const useScrollToVisible = (domRef: React.RefObject<HTMLDivElement>) => {
  return useCallback(() => {
    window.requestAnimationFrame(() => {
      if (domRef.current) {
        domRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest"
        })
      }
    })
  }, [domRef])
}
