type LandingFloatingCubesProps = {
  className?: string;
  count?: 3 | 4 | 5;
};

function Cube({ x, y, size, opacity }: { x: number; y: number; size: number; opacity: number }) {
  const h = size * 0.55;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      <path
        d={`M0 ${h} L${size / 2} 0 L${size} ${h} L${size / 2} ${h * 2} Z`}
        fill="#dbeafe"
        stroke="#93c5fd"
        strokeWidth="1"
      />
      <path
        d={`M0 ${h} L${size / 2} ${h * 2} L${size / 2} 0 Z`}
        fill="#bfdbfe"
        stroke="#93c5fd"
        strokeWidth="1"
      />
      <path
        d={`M${size / 2} 0 L${size} ${h} L${size / 2} ${h * 2} Z`}
        fill="#eff6ff"
        stroke="#93c5fd"
        strokeWidth="1"
      />
    </g>
  );
}

export function LandingFloatingCubes({ className = "", count = 4 }: LandingFloatingCubesProps) {
  const cubes =
    count === 3
      ? [
          { x: 8, y: 40, size: 28, opacity: 0.5 },
          { x: 44, y: 12, size: 36, opacity: 0.65 },
          { x: 72, y: 48, size: 24, opacity: 0.4 },
        ]
      : count === 5
        ? [
            { x: 4, y: 52, size: 22, opacity: 0.35 },
            { x: 28, y: 20, size: 30, opacity: 0.5 },
            { x: 56, y: 8, size: 38, opacity: 0.7 },
            { x: 80, y: 36, size: 26, opacity: 0.45 },
            { x: 100, y: 58, size: 20, opacity: 0.3 },
          ]
        : [
            { x: 6, y: 44, size: 26, opacity: 0.4 },
            { x: 38, y: 16, size: 34, opacity: 0.6 },
            { x: 68, y: 42, size: 28, opacity: 0.5 },
            { x: 92, y: 24, size: 22, opacity: 0.35 },
          ];

  return (
    <svg
      className={className}
      viewBox="0 0 120 80"
      fill="none"
      aria-hidden
    >
      {cubes.map((c, i) => (
        <Cube key={i} {...c} />
      ))}
    </svg>
  );
}
