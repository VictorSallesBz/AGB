import { cn } from "@/lib/utils"
import Card from "./ui/Card"
import { LucideIcon } from "lucide-react"

interface InfoCardItem {
  label: string
  value: React.ReactNode | string
}

interface InfoCardProps {
  icon: LucideIcon
  iconBgColor?: string
  iconColor?: string
  title: string
  subtitle?: string
  items?: InfoCardItem[]
  className?: string
  [key: string]: any
}

const InfoCard = ({
  icon: Icon,
  iconBgColor = "bg-blue-500/10",
  iconColor = "text-blue-500",
  title,
  subtitle,
  items = [],
  className,
  ...props
}: InfoCardProps): React.ReactElement => {
  return (
    <Card
      className={cn(
        "bg-agb-card backdrop-blur-xs rounded-xl border border-agb-border hover:shadow-xs overflow-hidden p-5",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className={cn("p-3 rounded-lg", iconBgColor)}>
          <Icon className={cn("text-lg", iconColor)} size={24} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-agb-text mb-1">{title}</h2>
          {subtitle && <p className="text-agb-text-secondary text-sm">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index}>
            <p className="text-agb-text-secondary text-xs mb-1">{item.label}</p>
            <p className="text-agb-text font-medium">{item.value}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default InfoCard
