"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

const PULL_THRESHOLD  = 72  // px to pull before triggering refresh
const MAX_PULL        = 100 // px max drag distance
const RESISTANCE      = 0.4 // how hard it is to pull (0–1)

type Phase = "idle" | "pulling" | "ready" | "refreshing"

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const [phase, setPhase]       = useState<Phase>("idle")
  const [pullY, setPullY]       = useState(0)

  const startYRef               = useRef(0)
  const isDraggingRef           = useRef(false)
  const containerRef            = useRef<HTMLDivElement>(null)

  const isAtTop = useCallback(() => {
    return window.scrollY === 0
  }, [])

  const triggerRefresh = useCallback(() => {
    setPhase("refreshing")
    setPullY(PULL_THRESHOLD)

    // Haptic on Android
    navigator.vibrate?.(15)

    router.refresh()

    // Give server components time to re-render, then reset
    setTimeout(() => {
      setPhase("idle")
      setPullY(0)
    }, 1200)
  }, [router])

  useEffect(() => {
    // Desktop — skip entirely
    if (window.matchMedia("(min-width: 768px)").matches) return

    const el = containerRef.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      if (!isAtTop()) return
      startYRef.current    = e.touches[0].clientY
      isDraggingRef.current = true
    }

    function onTouchMove(e: TouchEvent) {
      if (!isDraggingRef.current) return

      const deltaY = e.touches[0].clientY - startYRef.current

      // Only intercept downward pull from top
      if (deltaY <= 0) {
        setPullY(0)
        setPhase("idle")
        return
      }

      // Apply resistance so it feels natural
      const dampened = Math.min(deltaY * RESISTANCE, MAX_PULL)

      setPullY(dampened)
      setPhase(dampened >= PULL_THRESHOLD ? "ready" : "pulling")

      // Prevent native scroll bounce while pulling
      if (isAtTop() && deltaY > 0) {
        e.preventDefault()
      }
    }

    function onTouchEnd() {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false

      if (phase === "ready" || pullY >= PULL_THRESHOLD) {
        triggerRefresh()
      } else {
        // Snap back
        setPhase("idle")
        setPullY(0)
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove",  onTouchMove,  { passive: false })
    el.addEventListener("touchend",   onTouchEnd,   { passive: true })

    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove",  onTouchMove)
      el.removeEventListener("touchend",   onTouchEnd)
    }
  }, [phase, pullY, isAtTop, triggerRefresh])

  const isRefreshing = phase === "refreshing"
  const isReady      = phase === "ready"
  const showIndicator = pullY > 0 || isRefreshing

  // How far the content shifts down
  const contentTranslate = isRefreshing ? PULL_THRESHOLD : pullY

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Pull indicator */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-center pointer-events-none overflow-hidden"
        style={{
          height:    `${contentTranslate}px`,
          transition: isRefreshing ? "height 0.2s ease" : "none",
        }}
      >
        {showIndicator && (
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#161b22] border border-[#30363d] shadow-lg"
            style={{
              opacity:   Math.min(pullY / PULL_THRESHOLD, 1),
              transform: `scale(${0.8 + (Math.min(pullY / PULL_THRESHOLD, 1) * 0.2)})`,
              transition: isRefreshing ? "all 0.2s ease" : "none",
            }}
          >
            <Loader2
              size={14}
              className={`text-[#58a6ff] ${isRefreshing ? "animate-spin" : ""}`}
              style={{
                transform: isRefreshing
                  ? undefined
                  : `rotate(${Math.min((pullY / PULL_THRESHOLD) * 360, 360)}deg)`,
              }}
            />
            <span className="text-[11px] font-medium text-[#7d8590]">
              {isRefreshing ? "Refreshing…" : isReady ? "Release to refresh" : "Pull to refresh"}
            </span>
          </div>
        )}
      </div>

      {/* Page content — shifts down while pulling */}
      <div
        style={{
          transform:  `translateY(${contentTranslate}px)`,
          transition: isRefreshing || phase === "idle" ? "transform 0.3s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  )
}