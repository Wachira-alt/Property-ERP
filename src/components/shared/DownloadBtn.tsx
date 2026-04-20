// @ts-nocheck
"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  url:       string
  fileName?: string
  label?:    string
  variant?:  "default" | "ghost" | "inline"
  className?: string
}

export function DownloadBtn({
  url,
  fileName,
  label = "Download",
  variant = "default",
  className,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error("Download failed")

      const blob = await res.blob()
      const link = document.createElement("a")
      link.href  = URL.createObjectURL(blob)
      link.download = fileName ?? label
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      toast.error("Failed to download file")
    } finally {
      setLoading(false)
    }
  }

  const base = "inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"

  const variants = {
    default: "px-3 py-1.5 text-xs border border-[#30363d] rounded-md text-[#e6edf3] hover:border-[#484f58] hover:bg-[#21262d]",
    ghost:   "px-2 py-1 text-xs text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d] rounded-md",
    inline:  "text-[11px] text-[#58a6ff] hover:underline",
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={cn(base, variants[variant], className)}
    >
      {loading
        ? <Loader2 size={12} className="animate-spin" />
        : <Download size={12} />
      }
      {label}
    </button>
  )
}