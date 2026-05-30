export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden>
      <path d="M5 27V9l8.5 10.5L20.5 9v18h-5L16 19.5 10 27H5z" fill="#4f6ef7" />
      <path
        d="M5 9l8.5 9.5L20.5 9"
        stroke="rgba(79,110,247,0.5)"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
