import { useCallback, useRef, useState } from 'react'

/** Tracks an element's width so SVG charts can lay out in real pixels. Measures on mount, then on resize. */
export function useElementWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState(0)
  const observer = useRef<ResizeObserver | null>(null)
  const ref = useCallback((node: T | null) => {
    observer.current?.disconnect()
    if (!node) return
    setWidth(node.getBoundingClientRect().width)
    observer.current = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.current.observe(node)
  }, [])
  return [ref, width] as const
}
