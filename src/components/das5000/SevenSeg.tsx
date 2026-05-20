import { cn } from "@/lib/utils";

// Seven Segment font from cdnfonts
// @import url('https://fonts.cdnfonts.com/css/seven-segment');
// Add that import to your global CSS or layout if not already present.

// ---------------------------------------------------------------------------
// Dim / ghost layer — renders "88" or "8" etc. behind the real digits so the
// unlit segments are visible just like a real scoreboard.
// ---------------------------------------------------------------------------

function ghostChar(c: string): string {
  if (c === ":" || c === ".") return c;
  if (c === " ") return " ";
  return "8";
}

const FONT_FAMILY = "'Seven Segment', monospace";

interface DigitStyleProps {
  height: number;
  color: string;
}

function fontSizeFromHeight(height: number): number {
  // The Seven Segment font cap-height is ~75% of font-size.
  // Empirically, font-size ≈ height * 0.95 gives a good fit.
  return Math.round(height * 0.95);
}

// ---------------------------------------------------------------------------
// SevenSegDigit — single character, kept for backwards compat
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
      {/* ghost / unlit layer */}
      <span
        aria-hidden
        style={{
          fontFamily: FONT_FAMILY,
          fontSize,
          color: offColor,
          lineHeight: 1,
          userSelect: "none",
          letterSpacing: 0,
        }}
      >
        {ghostChar(d)}
      </span>
      {/* lit layer */}
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
          textShadow: `0 0 12px ${color}cc, 0 0 30px ${color}66`,
        }}
      >
        {d}
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

  // Delegate clock strings (contains : or .) to SegText
  if (typeof value === "string" && (value.includes(":") || value.includes("."))) {
    return <SegText text={value} height={height} color={color} className={className} />;
  }

  str = leadingZero ? str.padStart(digits, "0") : str.padStart(digits, " ");

  return (
    <SegText text={str} height={height} color={color} className={className} />
  );
}

// ---------------------------------------------------------------------------
// SegText — renders a full string (digits, colons, dots, spaces)
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
      {/* ghost / unlit layer */}
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
      {/* lit layer */}
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
