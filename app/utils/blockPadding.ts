export interface BlockPadding {
  top?: number | null;
  bottom?: number | null;
}

export const MIN_BLOCK_PADDING = 32;

export function blockPaddingStyle(padding?: BlockPadding | null) {
  const pixels = (value?: number | null) =>
    typeof value === 'number' && Number.isFinite(value)
      ? `${Math.min(320, Math.max(MIN_BLOCK_PADDING, value))}px`
      : undefined;

  return {
    paddingTop: pixels(padding?.top),
    paddingBottom: pixels(padding?.bottom),
  };
}
