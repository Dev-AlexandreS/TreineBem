'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// ─── Inner component (needs Suspense because of useSearchParams) ──────────────

function ProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPathRef = useRef<string | null>(null)

  const currentPath = pathname + searchParams.toString()

  // Detect completed navigation → finish the bar
  useEffect(() => {
    if (prevPathRef.current === null) {
      prevPathRef.current = currentPath
      return
    }
    if (prevPathRef.current === currentPath) return

    prevPathRef.current = currentPath

    if (intervalRef.current) clearInterval(intervalRef.current)

    setProgress(100)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 350)
  }, [currentPath])

  // Start bar on any internal link click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) return
      if (href === pathname) return

      if (timerRef.current) clearTimeout(timerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)

      setProgress(5)
      setVisible(true)

      let current = 5
      intervalRef.current = setInterval(() => {
        // Ease toward 85% with diminishing increments
        const remaining = 85 - current
        const step = Math.max(1, remaining * 0.12)
        current = Math.min(85, current + step)
        setProgress(current)
        if (current >= 85 && intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }, 120)
    }

    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
      if (timerRef.current) clearTimeout(timerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [pathname])

  if (!visible && progress === 0) return null

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[200] h-[3px] pointer-events-none"
    >
      <div
        className="h-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.7)]"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transition:
            progress === 100
              ? 'width 150ms ease-out, opacity 350ms ease-out 150ms'
              : 'width 120ms ease-out',
        }}
      />
    </div>
  )
}

// ─── Public component (wraps in Suspense for useSearchParams) ─────────────────

/**
 * Thin blue progress bar at the top of the viewport that animates during
 * Next.js client-side route transitions.
 *
 * Mount once in the root layout.
 */
export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  )
}
