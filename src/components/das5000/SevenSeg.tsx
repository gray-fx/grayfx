import { cn } from "@/lib/utils";

// 7-segment digit using SVG. Each segment a/b/c/d/e/f/g.
const SEG_MAP: Record<string, string> = {
  "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc",
  "5": "afgcd", "6": "afgcde", "7": "abc", "8": "abcdefg", "9": "abcdfg",
  "-": "g", " ": "", "": "",
};

interface SegProps {
  d: string;
  color?: string;
  height?: number;
  on?: string; // override on color
  off?: string;
}

function Segment({ on, off, active, points }: { on: string; off: string; active: boolean; points: string }) {
  return <polygon points={points} fill={active ? on : off} />;
}

export function SevenSegDigit({ d, color = "#ff2d2d", height = 100, on, off }: SegProps) {
  const w = height * 0.6;
  const h = height;
  const t = h * 0.13; // segment thickness
  const onC = on ?? color;
  const offC = off ?? "rgba(255,255,255,0.04)";
  const segs = SEG_MAP[d] ?? "";
  const has = (s: string) => segs.includes(s);
  // Build segment polygons
  // a: top, b: top-right, c: bottom-right, d: bottom, e: bottom-left, f: top-left, g: middle
  const pad = t * 0.15;
  const segs6 = {
    a: `${t},0 ${w - t},0 ${w - t - pad},${t} ${t + pad},${t}`,
    b: `${w},${t} ${w},${h / 2 - t / 2} ${w - t},${h / 2 - t / 2 - pad} ${w - t},${t + pad}`,
    c: `${w},${h / 2 + t / 2} ${w},${h - t} ${w - t},${h - t - pad} ${w - t},${h / 2 + t / 2 + pad}`,
    d: `${t},${h} ${w - t},${h} ${w - t - pad},${h - t} ${t + pad},${h - t}`,
    e: `0,${h / 2 + t / 2} 0,${h - t} ${t},${h - t - pad} ${t},${h / 2 + t / 2 + pad}`,
    f: `0,${t} 0,${h / 2 - t / 2} ${t},${h / 2 - t / 2 - pad} ${t},${t + pad}`,
    g: `${t},${h / 2 - t / 2} ${w - t},${h / 2 - t / 2} ${w - t - pad},${h / 2} ${w - t - pad / 2},${h / 2 + t / 2 - 0.001} ${t + pad},${h / 2 + t / 2} ${t + pad / 2},${h / 2}`,
  };
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {(["a", "b", "c", "d", "e", "f", "g"] as const).map(k => (
        <Segment key={k} on={onC} off={offC} active={has(k)} points={segs6[k]} />
      ))}
    </svg>
  );
}

export function SevenSegNumber({
  value, digits = 2, height = 100, color = "#ff2d2d", leadingZero = false, className,
}: {
  value: number | string; digits?: number; height?: number; color?: string; leadingZero?: boolean; className?: string;
}) {
  let str = typeof value === "number" ? String(value) : value;
  // If has colon or dot, render specially
  if (typeof value === "string" && (value.includes(":") || value.includes("."))) {
    return <SegText text={value} height={height} color={color} className={className} />;
  }
  if (leadingZero) str = str.padStart(digits, "0");
  else str = str.padStart(digits, " ");
  return (
    <div className={cn("inline-flex gap-1 items-center", className)}>
      {str.split("").map((d, i) => <SevenSegDigit key={i} d={d} color={color} height={height} />)}
    </div>
  );
}

export function SegText({ text, height = 100, color = "#ff2d2d", className }: { text: string; height?: number; color?: string; className?: string }) {
  return (
    <div className={cn("inline-flex items-end gap-1", className)}>
      {text.split("").map((c, i) => {
        if (c === ":") {
          const dotSize = height * 0.13;
          return (
            <div key={i} className="flex flex-col justify-between" style={{ height, padding: `${height * 0.2}px 0` }}>
              <div style={{ width: dotSize, height: dotSize, background: color, borderRadius: 2 }} />
              <div style={{ width: dotSize, height: dotSize, background: color, borderRadius: 2 }} />
            </div>
          );
        }
        if (c === ".") {
          const dotSize = height * 0.13;
          return (
            <div key={i} className="flex items-end" style={{ height }}>
              <div style={{ width: dotSize, height: dotSize, background: color, borderRadius: 2 }} />
            </div>
          );
        }
        return <SevenSegDigit key={i} d={c} color={color} height={height} />;
      })}
    </div>
  );
}
