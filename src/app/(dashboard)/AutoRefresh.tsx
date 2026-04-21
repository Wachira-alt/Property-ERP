"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    // Refresh when user returns to the tab from another app or window
    function onFocus() {
      router.refresh()
    }

    // Refresh every 60 seconds as a safety net for users who never leave the tab
    const interval = setInterval(() => {
      router.refresh()
    }, 60 * 1000)

    window.addEventListener("focus", onFocus)

    return () => {
      window.removeEventListener("focus", onFocus)
      clearInterval(interval)
    }
  }, [router])

  return null
}