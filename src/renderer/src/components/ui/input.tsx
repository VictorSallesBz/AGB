import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface InputProps {
  type?: string
  defaultValue?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  placeholder?: string
  Icon?: LucideIcon
  disabled?: boolean
}

function Input({
  type = "text",
  defaultValue,
  onChange,
  className,
  placeholder,
  disabled,
  ...props
}: InputProps): React.ReactElement {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      onChange={onChange}
      className={cn(
        "w-full bg-agb-card border border-agb-border rounded-lg px-3 py-2 text-agb-text",
        "focus:ring-0 focus:outline-hidden focus:border-agb-primary transition-colors",
        "placeholder:text-agb-text-secondary disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      placeholder={placeholder}
      disabled={disabled}
      {...props}
    />
  )
}

interface LargeInputProps {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  icon?: LucideIcon
  className?: string
}

function LargeInput({
  placeholder,
  value,
  onChange,
  icon: Icon,
  className,
  ...props
}: LargeInputProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex items-center gap-3 bg-agb-card border border-agb-border",
        "rounded-xl px-4 backdrop-blur-xs transition-colors",
        "focus-within:border-agb-primary",
        className,
      )}
    >
      {Icon && <Icon className="w-5 h-5 text-agb-text-secondary" />}
      <input
        type="text"
        placeholder={placeholder}
        className={cn(
          "w-full py-3 px-0 bg-transparent border-none",
          "focus:outline-hidden focus:ring-0 text-agb-text",
          "placeholder:text-agb-text-secondary",
        )}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  )
}

export { Input, LargeInput }
