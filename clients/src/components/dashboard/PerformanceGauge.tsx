import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface PerformanceGaugeProps {
  /** 0–100 fill percentage of the arc */
  percent: number;
  points: number;
}

const RANGES = ["Monthly", "Weekly", "Yearly"] as const;

// Polar-to-cartesian helper for building the arc path + needle angle.
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function PerformanceGauge({ percent, points }: PerformanceGaugeProps) {
  const [range, setRange] = useState<(typeof RANGES)[number]>("Monthly");
  const [open, setOpen] = useState(false);

  const cx = 100;
  const cy = 95;
  const r = 78;
  const clamped = Math.min(100, Math.max(0, percent));
  const needleAngle = (clamped / 100) * 180; // 0 = left (0%), 180 = right (100%)
  const needleTip = polarToCartesian(cx, cy, r - 22, needleAngle);

  return (
    <div className="card flex flex-col p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-secondary" />
          <h3 className="text-sm font-semibold text-on-surface">Point Progress</h3>
        </div>
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 rounded-lg border border-outline-variant px-2.5 py-1 text-xs font-medium text-on-surface-variant hover:border-outline"
          >
            {range}
            <ChevronDown size={14} />
          </button>
          {open && (
            <ul className="absolute right-0 z-10 mt-1 w-28 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-md">
              {RANGES.map((r) => (
                <li key={r}>
                  <button
                    onClick={() => {
                      setRange(r);
                      setOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-on-surface hover:bg-surface-container"
                  >
                    {r}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mx-auto mt-4">
        <svg viewBox="0 0 200 120" width="220" height="132">
          <defs>
            <linearGradient id="gaugeTrack" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-secondary)" />
              <stop offset="100%" stopColor="var(--color-tertiary-container)" />
            </linearGradient>
          </defs>
          {/* background track */}
          <path
            d={arcPath(cx, cy, r, 0, 180)}
            fill="none"
            stroke="var(--color-surface-container-high)"
            strokeWidth={14}
            strokeLinecap="round"
          />
          {/* active progress */}
          <path
            d={arcPath(cx, cy, r, 0, needleAngle)}
            fill="none"
            stroke="url(#gaugeTrack)"
            strokeWidth={14}
            strokeLinecap="round"
          />
          {/* needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke="var(--color-accent)"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={7} fill="var(--color-surface-container-lowest)" stroke="var(--color-accent)" strokeWidth={3} />
        </svg>
      </div>

      <p className="text-center text-sm text-on-surface-variant">
        Your Point: <span className="text-base font-bold text-on-surface">{points.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
      </p>
    </div>
  );
}