import clsx from "clsx";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md";
}

export function Spinner({ className, size = "sm" }: SpinnerProps) {
  return (
    <div
      className={clsx(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        {
          "h-4 w-4": size === "sm",
          "h-6 w-6": size === "md",
        },
        className
      )}
    />
  );
}
