export type TableAlign = "left" | "center" | "right";

export interface PmgTableColumn<T = any> {
  /**
   * The property key in the row object, or a unique identifier for computed/action columns.
   * Supports dot notation for nested properties (e.g. 'user.profile.name').
   */
  key: (keyof T & string) | string;

  /**
   * Header text label. If omitted, falls back to `key`.
   */
  label?: string;

  /**
   * Column and cell alignment.
   * @default 'left'
   */
  align?: TableAlign;

  /**
   * Column width (e.g., '120px', '25%').
   */
  width?: string;

  /**
   * Column minimum width (e.g., '100px', '8rem').
   */
  minWidth?: string;

  /**
   * Whether this column is sortable.
   * @default false
   */
  sortable?: boolean;

  /**
   * Whether this column can be hidden.
   * @default false
   */
  hideable?: boolean;

  /**
   * Custom CSS classes for the column header (`<th>`).
   */
  headerClass?: string;

  /**
   * Custom CSS classes for the column data cells (`<td>`).
   */
  cellClass?: string;

  /**
   * Extensible for future features.
   */
  [key: string]: any;
}

export type PmgRowKey<T = any> =
  | (keyof T & string)
  | string
  | ((row: T, index: number) => string | number);
