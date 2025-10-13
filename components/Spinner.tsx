// components/JetSpinner.tsx
export default function JetSpinner({ size = 72 }: { size?: number }) {
  const s = size;
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: s, height: s }}
      aria-hidden="true"
    >
      <svg
        width={s}
        height={s}
        viewBox="0 0 100 100"
        className="drop-shadow-sm"
        role="img"
      >
        {/* Outer turbine ring */}
        <defs>
          <radialGradient id="ring" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="60%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
          <radialGradient id="hub" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </radialGradient>
        </defs>

        {/* Casing */}
        <circle cx="50" cy="50" r="48" fill="url(#ring)" />
        <circle cx="50" cy="50" r="43" fill="#0b1220" />

        {/* Blade layer 1 */}
        <g className="animate-spin [animation-duration:1.1s]">
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 360) / 8;
            const rad = (angle * Math.PI) / 180;
            const x1 = 50 + Math.cos(rad) * 8;
            const y1 = 50 + Math.sin(rad) * 8;
            const x2 = 50 + Math.cos(rad) * 40;
            const y2 = 50 + Math.sin(rad) * 40;
            return (
              <polygon
                key={`b1-${i}`}
                points={`${x1},${y1} ${x2},${y2} ${50 + Math.cos(rad + 0.2) * 12},${50 + Math.sin(rad + 0.2) * 12}`}
                fill="#60a5fa"
                opacity="0.65"
              />
            );
          })}
        </g>

        {/* Blade layer 2 (counter-rotating look via different speed) */}
        <g className="animate-spin [animation-duration:0.75s]">
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 360) / 8 + 22.5;
            const rad = (angle * Math.PI) / 180;
            const x1 = 50 + Math.cos(rad) * 10;
            const y1 = 50 + Math.sin(rad) * 10;
            const x2 = 50 + Math.cos(rad) * 38;
            const y2 = 50 + Math.sin(rad) * 38;
            return (
              <polygon
                key={`b2-${i}`}
                points={`${x1},${y1} ${x2},${y2} ${50 + Math.cos(rad + 0.25) * 14},${50 + Math.sin(rad + 0.25) * 14}`}
                fill="#38bdf8"
                opacity="0.45"
              />
            );
          })}
        </g>

        {/* Center hub */}
        <circle cx="50" cy="50" r="12" fill="url(#hub)" />
        <circle cx="50" cy="50" r="3" fill="#0b1220" />
      </svg>
    </div>
  );
}
