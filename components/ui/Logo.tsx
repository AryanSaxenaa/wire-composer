export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes: Record<string, string> = { sm: "text-base", md: "text-lg", lg: "text-2xl" };
  return (
    <span
      className={`font-bold text-accent-primary font-mono tracking-tight ${sizes[size]}`}
    >
      wire
    </span>
  );
}
