const responsiveColumnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
} as const;

/**
 * Keep tile grids as compact as their content allows, up to the configured
 * maximum. This prevents two tiles from occupying two slots in a wider
 * three- or four-column grid and leaving an empty slot behind.
 */
export function responsiveTileGridClass(
  itemCount: number,
  maxColumns = 3,
) {
  const safeItemCount = Number.isFinite(itemCount) ? Math.trunc(itemCount) : 1;
  const safeMaxColumns = Number.isFinite(maxColumns)
    ? Math.trunc(maxColumns)
    : 3;
  const columnCount = Math.min(
    4,
    Math.max(1, Math.min(safeItemCount || 1, safeMaxColumns)),
  ) as keyof typeof responsiveColumnClasses;

  return `grid gap-6 ${responsiveColumnClasses[columnCount]}`;
}
