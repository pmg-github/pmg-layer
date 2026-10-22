import type { CSSProperties } from "vue";

export type ButtonVariant = "primary" | "secondary";

export const buttonColorPresets = [
  "#111827",
  "#ffffff",
  "#dc2626",
  "#ea580c",
  "#f59e0b",
  "#16a34a",
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#db2777",
] as const;

/** Returns a lowercase `#rrggbb` string, or null when the value is not a hex color. */
export function normalizeButtonColor(value?: string | null): string | null {
  const raw = value?.trim().replace(/^#/, "") ?? "";
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw
      .split("")
      .map((c) => c + c)
      .join("")}`.toLowerCase();
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`.toLowerCase();
  return null;
}

/** Picks dark or white text, whichever contrasts best with the background. */
export function readableTextColor(background: string): string {
  const hex = normalizeButtonColor(background);
  if (!hex) return "#ffffff";

  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // Contrast ratio against white vs. against gray-900 (#111827).
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.0632
    ? "#ffffff"
    : "#111827";
}

/**
 * Inline style for a link button with a custom color. Primary buttons get a
 * filled background; secondary buttons keep their outline style.
 */
export function linkButtonStyle(
  color: string | null | undefined,
  variant: ButtonVariant,
): CSSProperties | undefined {
  const hex = normalizeButtonColor(color);
  if (!hex) return undefined;

  if (variant === "primary") {
    return {
      backgroundColor: hex,
      borderColor: hex,
      color: readableTextColor(hex),
    };
  }

  return { borderColor: hex, color: hex };
}
