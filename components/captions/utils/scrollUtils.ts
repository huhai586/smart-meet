import { useCallback } from "react";





export const useScrollToVisible = (domRef: React.RefObject<HTMLDivElement>) => {
  return useCallback(() => {
    scrollElementIntoView(domRef.current)
  }, [domRef])
}

export const scrollElementIntoView = (element: HTMLDivElement) => {
  if (!element) return;
  
  element.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "nearest"
  })
}