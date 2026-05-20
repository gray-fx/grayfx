import { cn } from "@/lib/utils";

// Inline @font-face so the space in the woff filename is properly encoded
const FONT_STYLE = `
@font-face {
  font-family: 'SevenSeg';
  font-style: normal;
  font-weight: 400;
  src: local('Seven Segment'),
       url('https://fonts.cdnfonts.com/s/71640/Seven%20Segment.woff') format('woff');
}
`;

// Inject once into <head>
if (typeof document !== "undefined") {
  const id = "seven-seg-font";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = FONT_STYLE;
    document.head.appendChild(style);
  }
}

const FONT_FAMILY = "'SevenSeg', monospace";

function fontSizeFromHeight(height: number): number {
  return Math.round(height * 0.95);
}

function ghostChar(c: string): string {
  if (c === ":" || c === "." || c === " ") return c;
  return "8";
}

// ---------------------------------------------------------------------------
// SevenSegDigit — single character
// ---------------------------------------------------------------------------
export function SevenSegDigit({
  d,
  color = "#ff2d2d",
  height = 100,
}: {
  d: string;
  color?: string;
  height?: number;
}) {
  const fontSize = fontSizeFromHeight(height);
  const offColor = "rgba(255,255,255,0.07)";

  return (
    <span style={{ position: "relative", display: "inline-block", lineHeight: 1 }}>
      <span
        aria-hidden
        style={{
          fontFamily: FONT_FAMILY,
          fontSize,
          color: offColor,
          lineHeight: 1,
          userSelect: "none",
          letterSpacing: 0,
          display: "block",
          whiteSpace: "pre",
        }}
      >
        {ghostChar(d)}
      </span>
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize,
          color,
          lineHeight: 1,
          position: "absolute",
          left: 0,
          top: 0,
          letterSpacing: 0,
          whiteSpace: "pre",
          textShadow: `0 0 12px ${color}cc, 0 0 30px ${color}66`,
        }}
      >
        {d}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// SegText — renders a full string with ghost unlit layer
// ---------------------------------------------------------------------------
export function SegText({
  text,
  height = 100,
  color = "#ff2d2d",
  className,
}: {
  text: string;
  height?: number;
  color?: string;
  className?: string;
}) {
  const fontSize = fontSizeFromHeight(height);
  const offColor = "rgba(255,255,255,0.07)";
  const ghost = text.split("").map(ghostChar).join("");

  return (
    <span
      className={cn("inline-block", className)}
      style={{ position: "relative", lineHeight: 1, display: "inline-block" }}
    >
      <span
        aria-hidden
        style={{
          fontFamily: FONT_FAMILY,
          fontSize,
          color: offColor,
          lineHeight: 1,
          letterSpacing: "0.04em",
          userSelect: "none",
          whiteSpace: "pre",
          display: "block",
        }}
      >
        {ghost}
      </span>
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize,
          color,
          lineHeight: 1,
          letterSpacing: "0.04em",
          position: "absolute",
          left: 0,
          top: 0,
          whiteSpace: "pre",
          textShadow: `0 0 12px ${color}cc, 0 0 30px ${color}66`,
        }}
      >
        {text}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// SevenSegNumber
// ---------------------------------------------------------------------------
export function SevenSegNumber({
  value,
  digits = 2,
  height = 100,
  color = "#ff2d2d",
  leadingZero = false,
  className,
}: {
  value: number | string;
  digits?: number;
  height?: number;
  color?: string;
  leadingZero?: boolean;
  className?: string;
}) {
  let str = typeof value === "number" ? String(value) : value;

  if (typeof value === "string" && (value.includes(":") || value.includes("."))) {
    return <SegText text={value} height={height} color={color} className={className} />;
  }

  str = leadingZero ? str.padStart(digits, "0") : str.padStart(digits, " ");

  return <SegText text={str} height={height} color={color} className={className} />;
}
