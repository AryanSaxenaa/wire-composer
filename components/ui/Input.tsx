import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={id}
            className="text-xs text-text-secondary font-mono"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            "h-9 px-3 rounded-md bg-bg-base border border-border-default text-text-primary text-sm font-mono",
            "placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-glow",
            "transition-colors",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";
