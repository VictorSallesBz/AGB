import { useState, useRef } from "react"

type TooltipSide = "top" | "bottom" | "left" | "right"

interface TooltipProps {
  content: string | undefined | null
  children: React.ReactNode
  side?: TooltipSide
  delay?: number
}

const Tooltip = ({
  content,
  children,
  side = "top",
  delay = 0.5,
}: TooltipProps): React.ReactElement => {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleMouseEnter = () => {
    if (!content) return
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay * 1000)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const sideToTransform: Record<TooltipSide, string> = {
    top: "translate(-50%, -0.25rem) scale-95",
    bottom: "translate(-50%, 0.25rem) scale-95",
    left: "translate(-0.25rem, -50%) scale-95",
    right: "translate(0.25rem, -50%) scale-95",
  }

  const sideToPositionStyle: Record<TooltipSide, Record<string, string>> = {
    top: { left: "50%", bottom: "calc(100% + 0.375rem)" },
    bottom: { left: "50%", top: "calc(100% + 0.375rem)" },
    left: { right: "calc(100% + 0.375rem)", top: "50%" },
    right: { left: "calc(100% + 0.375rem)", top: "50%" },
  }

  const transformStyle = isVisible
    ? sideToTransform[side]
        .replace("scale-95", "scale-100")
        .replace(/-0.25rem/, "0rem")
        .replace(/0.25rem/, "0rem")
    : sideToTransform[side]

  if (!content) {
    return <>{children}</>
  }

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        className={`absolute z-50 pointer-events-none px-2.5 py-1 text-xs font-medium bg-agb-card text-agb-text rounded-md shadow-xl border border-agb-border whitespace-nowrap transition-all duration-150 ease-out select-none`}
        style={{
          ...sideToPositionStyle[side],
          transform: transformStyle,
          opacity: isVisible ? 1 : 0,
        }}
      >
        {content}
      </div>
    </div>
  )
}

export default Tooltip
