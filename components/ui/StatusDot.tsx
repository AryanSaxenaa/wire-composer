import clsx from "clsx";

interface StatusDotProps {
  status: string;
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  const colors: Record<string, string> = {
    idle: "bg-text-muted",
    pending: "bg-pending",
    running: "bg-accent-primary animate-pulse",
    success: "bg-success",
    error: "bg-error",
    waiting_input: "bg-warning",
  };

  return (
    <span
      className={clsx(
        "inline-block h-2 w-2 rounded-full flex-shrink-0",
        colors[status] || colors.idle,
        className
      )}
    />
  );
}
