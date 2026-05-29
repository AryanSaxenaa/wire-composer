import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "pending";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded",
        {
          "bg-bg-subtle text-text-secondary": variant === "default",
          "bg-success/20 text-success": variant === "success",
          "bg-warning/20 text-warning": variant === "warning",
          "bg-error/20 text-error": variant === "error",
          "bg-pending/20 text-pending": variant === "pending",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
