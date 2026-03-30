import { Check } from "lucide-react"

type Stage = "GREEN" | "AMBER" | "CLOSED" | "EXPIRED" | "CANCELLED"

type Props = {
  currentStage: Stage
}

const STAGES = [
  { key: "GREEN",  label: "Lead",        color: "text-[#3fb950]", activeBg: "bg-[#1a4f2a] border-[#2ea043]" },
  { key: "AMBER",  label: "Reservation", color: "text-[#d29922]", activeBg: "bg-[#4a3000] border-[#9e6a03]" },
  { key: "CLOSED", label: "Closed",      color: "text-[#58a6ff]", activeBg: "bg-[#0d2a4a] border-[#1f6feb]" },
  { key: "PAST",   label: "Past",        color: "text-[#a371f7]", activeBg: "bg-[#2d1f5e] border-[#6e40c9]" },
] as const

const TERMINAL: Record<string, { label: string; bg: string; dot: string }> = {
  EXPIRED:   { label: "Expired",   bg: "bg-[#21262d] border-[#30363d] text-[#7d8590]", dot: "bg-[#484f58]" },
  CANCELLED: { label: "Cancelled", bg: "bg-[#3d1f1f] border-[#da3633] text-[#f85149]", dot: "bg-[#f85149]" },
}

export function PipelineStages({ currentStage }: Props) {
  const isTerminal = currentStage === "EXPIRED" || currentStage === "CANCELLED"
  const terminal   = TERMINAL[currentStage]

  const stageOrder = ["GREEN", "AMBER", "CLOSED"]
  const currentIdx  = stageOrder.indexOf(currentStage)

  if (isTerminal) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${terminal.bg}`}
        >
          <span className={`w-2 h-2 rounded-full ${terminal.dot}`} />
          {terminal.label}
        </div>
        <p className="text-xs text-[#7d8590]">This opportunity is no longer active.</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0 sm:gap-0">
      {STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIdx
        const isActive    = stage.key === currentStage
        const isFuture    = idx > currentIdx

        return (
          <div key={stage.key} className="flex items-center">
            {/* Step */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                isActive
                  ? stage.activeBg + " " + stage.color
                  : isCompleted
                  ? "bg-[#1a4f2a] border-[#2ea043] text-[#3fb950]"
                  : "bg-[#161b22] border-[#30363d] text-[#484f58]"
              }`}
            >
              {isCompleted ? (
                <Check size={11} />
              ) : (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive
                      ? stage.color.replace("text-", "bg-")
                      : "bg-[#484f58]"
                  }`}
                />
              )}
              <span className="hidden sm:inline">{stage.label}</span>
            </div>

            {/* Connector */}
            {idx < STAGES.length - 1 && (
              <div
                className={`w-6 h-px mx-1 ${
                  idx < currentIdx ? "bg-[#2ea043]" : "bg-[#30363d]"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}