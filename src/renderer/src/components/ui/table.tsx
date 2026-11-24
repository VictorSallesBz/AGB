import { cn } from "@/lib/utils"

interface TableProps {
  children: React.ReactNode
  className?: string
}

function Table({ children, className }: TableProps) {
  return (
    <div className={cn("w-full overflow-auto rounded-xl border border-agb-border", className)}>
      <table className="w-full caption-bottom text-sm">{children}</table>
    </div>
  )
}

interface TableHeaderProps {
  children: React.ReactNode
  className?: string
}

function TableHeader({ children, className }: TableHeaderProps) {
  return <thead className={cn("[&_tr]:border-b border-agb-border", className)}>{children}</thead>
}

interface TableBodyProps {
  children: React.ReactNode
  className?: string
}

function TableBody({ children, className }: TableBodyProps) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)}>{children}</tbody>
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
}

function TableRow({ children, className }: TableRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-agb-border transition-colors hover:bg-agb-accent/50",
        className,
      )}
    >
      {children}
    </tr>
  )
}

interface TableHeadProps {
  children?: React.ReactNode
  className?: string
  onClick?: () => void
}

function TableHead({ children, className, onClick }: TableHeadProps) {
  return (
    <th
      onClick={onClick}
      className={cn(
        "h-10 px-4 text-left align-middle font-medium text-agb-text-secondary text-xs uppercase tracking-wider",
        className,
      )}
    >
      {children}
    </th>
  )
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode
  className?: string
}

function TableCell({ children, className, ...props }: TableCellProps) {
  return (
    <td className={cn("p-4 align-middle text-agb-text", className)} {...props}>
      {children}
    </td>
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
export default Table
