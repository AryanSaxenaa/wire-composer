import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-accent-primary text-white hover:bg-accent-hover rounded-md":
            variant === "primary",
          "bg-bg-subtle text-text-secondary border border-border-default hover:bg-bg-elevated hover:text-text-primary rounded-md":
            variant === "secondary",
          "text-text-secondary hover:text-text-primary bg-transparent rounded-md":
            variant === "ghost",
          "bg-error/20 text-error border border-error/30 hover:bg-error/30 rounded-md":
            variant === "danger",
        },
        {
          "h-7 px-3 text-xs": size === "sm",
          "h-9 px-4 text-sm": size === "md",
          "h-11 px-6 text-base": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
