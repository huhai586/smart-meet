import { useCallback, useEffect } from "react";





export const useScrollToVisible = (domRef: React.RefObject<HTMLDivElement>) => {
  return useCallback(() => {
    scrollElementIntoView(domRef.current)
  }, [domRef])
}

export const scrollElementIntoView = (element: HTMLDivElement) => {
  window.requestAnimationFrame(() => {
    element.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest"
    })
  })
}