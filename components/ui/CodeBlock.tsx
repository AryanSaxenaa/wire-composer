import clsx from "clsx";
import { ReactNode } from "react";

interface CodeBlockProps {
  children: ReactNode;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  return (
    <pre
      className={clsx(
        "bg-bg-base border border-border-default rounded-md p-3 overflow-auto text-xs font-mono text-text-secondary",
        className
      )}
    >
      {children}
    </pre>
  );
}
