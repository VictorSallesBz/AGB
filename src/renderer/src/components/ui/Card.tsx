import { cn } from "@/lib/utils"

function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "bg-agb-card border border-agb-border rounded-xl hover:border-agb-primary transition group",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
