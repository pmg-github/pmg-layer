<script
  setup
  lang="ts"
  generic="T extends Record<string, any> = Record<string, any>"
>
import { computed } from "vue";
import { twMerge } from "tailwind-merge";
import PmgTable from "./Table.vue";
import PmgTableHeader from "./TableHeader.vue";
import PmgTableBody from "./TableBody.vue";
import PmgTableFooter from "./TableFooter.vue";
import PmgTableRow from "./TableRow.vue";
import PmgTableHead from "./TableHead.vue";
import PmgTableCell from "./TableCell.vue";
import PmgTableCaption from "./TableCaption.vue";
import type { PmgTableColumn, PmgRowKey } from "~/types/table";

export interface DataTableProps<TRecord = T> {
  /**
   * Column definitions for the table.
   */
  columns: PmgTableColumn<TRecord>[];
  /**
   * Array of row items to render.
   */
  rows?: TRecord[];
  /**
   * Property name or accessor function to uniquely identify each row.
   * @default 'id'
   */
  rowKey?: PmgRowKey<TRecord>;
  /**
   * Whether the table is in a loading state.
   * @default false
   */
  loading?: boolean;
  /**
   * Message shown when loading is true and no #loading slot is provided.
   * @default 'Loading...'
   */
  loadingText?: string;
  /**
   * Message shown when rows is empty and no #empty slot is provided.
   * @default 'No data available'
   */
  emptyText?: string;
  /**
   * Table caption text.
   */
  caption?: string;
  /**
   * Placement of the caption ('top' | 'bottom').
   * @default 'bottom'
   */
  captionSide?: "top" | "bottom";
  /**
   * Whether rows alternate background colors.
   * @default false
   */
  striped?: boolean;
  /**
   * Whether rows highlight on hover.
   * @default true
   */
  hoverable?: boolean;
  /**
   * Whether to render outer and cell borders.
   * @default false
   */
  bordered?: boolean;
  /**
   * Whether to reduce padding for a compact layout.
   * @default false
   */
  dense?: boolean;
  /**
   * Whether rows indicate interactivity with cursor-pointer and active styles.
   * @default false
   */
  interactiveRows?: boolean;
  /**
   * CSS classes for the outer scrolling wrapper.
   */
  wrapperClass?: any;
  /**
   * CSS classes for the table element.
   */
  tableClass?: any;
  /**
   * CSS classes for the thead element.
   */
  headerClass?: any;
  /**
   * CSS classes for the tbody element.
   */
  bodyClass?: any;
  /**
   * CSS classes for table rows, or a function returning a class string per row.
   */
  rowClass?: any | ((row: TRecord, index: number) => any);
}

const props = withDefaults(defineProps<DataTableProps<T>>(), {
  rows: () => [],
  rowKey: "id",
  loading: false,
  loadingText: "Loading...",
  emptyText: "No data available",
  captionSide: "bottom",
  striped: false,
  hoverable: true,
  bordered: false,
  dense: false,
  interactiveRows: false,
});

const emit = defineEmits<{
  rowClick: [row: T, index: number, event: MouseEvent];
}>();

defineSlots<{
  caption?: (props: Record<string, never>) => any;
  header?: (props: { column: PmgTableColumn<T>; index: number }) => any;
  cell?: (props: {
    row: T;
    value: any;
    column: PmgTableColumn<T>;
    index: number;
  }) => any;
  empty?: (props: Record<string, never>) => any;
  loading?: (props: Record<string, never>) => any;
  footer?: (props: { columns: PmgTableColumn<T>[]; rows: T[] }) => any;
  [key: `header-${string}`]: (props: {
    column: PmgTableColumn<T>;
    index: number;
  }) => any;
  [key: `cell-${string}`]: (props: {
    row: T;
    value: any;
    column: PmgTableColumn<T>;
    index: number;
  }) => any;
}>();

const wrapperClasses = computed(() =>
  twMerge("w-full overflow-x-auto", props.wrapperClass),
);

function getColumnKey(column: PmgTableColumn<T>, index: number): string {
  return column.key != null ? String(column.key) : String(index);
}

function getRowKey(row: T, index: number): string | number {
  if (typeof props.rowKey === "function") {
    return props.rowKey(row, index);
  }
  if (typeof props.rowKey === "string" && row != null && props.rowKey in row) {
    return (row as any)[props.rowKey];
  }
  return index;
}

function getCellValue(row: T, key: (keyof T & string) | string): any {
  if (row == null || key == null) return undefined;
  const keyStr = String(key);
  if (keyStr in row) {
    return (row as any)[keyStr];
  }
  if (keyStr.includes(".")) {
    const segments = keyStr.split(".");
    let current: any = row;
    for (const segment of segments) {
      if (current == null) return undefined;
      current = current[segment];
    }
    return current;
  }
  return undefined;
}

function formatCellValue(value: any): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function getRowCustomClass(row: T, index: number) {
  if (typeof props.rowClass === "function") {
    return props.rowClass(row, index);
  }
  return props.rowClass;
}

function handleRowClick(row: T, index: number, event: MouseEvent) {
  emit("rowClick", row, index, event);
}
</script>

<template>
  <div :class="wrapperClasses">
    <PmgTable
      :striped="striped"
      :hoverable="hoverable"
      :bordered="bordered"
      :dense="dense"
      :class="tableClass"
    >
      <PmgTableCaption v-if="caption || $slots.caption" :side="captionSide">
        <slot name="caption">{{ caption }}</slot>
      </PmgTableCaption>

      <PmgTableHeader :class="headerClass">
        <PmgTableRow :hoverable="false">
          <PmgTableHead
            v-for="(col, colIndex) in columns"
            :key="getColumnKey(col, colIndex)"
            :align="col.align"
            :style="{ width: col.width, minWidth: col.minWidth }"
            :class="col.headerClass"
          >
            <!-- Header slot resolution: specific #header-{key} -> generic #header -> default label -->
            <slot
              :name="`header-${getColumnKey(col, colIndex)}`"
              :column="col"
              :index="colIndex"
            >
              <slot name="header" :column="col" :index="colIndex">
                {{ col.label ?? col.key }}
              </slot>
            </slot>
          </PmgTableHead>
        </PmgTableRow>
      </PmgTableHeader>

      <PmgTableBody :class="bodyClass">
        <!-- Loading State -->
        <template v-if="loading">
          <slot name="loading">
            <PmgTableRow :hoverable="false">
              <PmgTableCell
                :colspan="columns.length"
                class="py-12 text-center text-gray-500"
              >
                <div class="inline-flex items-center justify-center gap-2">
                  <Icon
                    name="material-symbols:progress-activity"
                    class="size-5 animate-spin text-blue-500"
                  />
                  <span>{{ loadingText }}</span>
                </div>
              </PmgTableCell>
            </PmgTableRow>
          </slot>
        </template>

        <!-- Empty State -->
        <template v-else-if="!rows || rows.length === 0">
          <slot name="empty">
            <PmgTableRow :hoverable="false">
              <PmgTableCell
                :colspan="columns.length"
                class="py-12 text-center text-gray-500"
              >
                <div
                  class="inline-flex flex-col items-center justify-center gap-1.5"
                >
                  <Icon
                    name="material-symbols:inbox-outline"
                    class="size-8 text-gray-400"
                  />
                  <p class="text-sm font-medium text-gray-600">
                    {{ emptyText }}
                  </p>
                </div>
              </PmgTableCell>
            </PmgTableRow>
          </slot>
        </template>

        <!-- Data Rows -->
        <template v-else>
          <PmgTableRow
            v-for="(row, rowIndex) in rows"
            :key="getRowKey(row, rowIndex)"
            :hoverable="hoverable"
            :interactive="interactiveRows"
            :class="getRowCustomClass(row, rowIndex)"
            @click="handleRowClick(row, rowIndex, $event)"
          >
            <PmgTableCell
              v-for="(col, colIndex) in columns"
              :key="getColumnKey(col, colIndex)"
              :align="col.align"
              :class="col.cellClass"
            >
              <!-- Cell slot resolution: specific #cell-{key} -> generic #cell -> default formatted text -->
              <slot
                :name="`cell-${getColumnKey(col, colIndex)}`"
                :row="row"
                :value="getCellValue(row, col.key)"
                :column="col"
                :index="rowIndex"
              >
                <slot
                  name="cell"
                  :row="row"
                  :value="getCellValue(row, col.key)"
                  :column="col"
                  :index="rowIndex"
                >
                  {{ formatCellValue(getCellValue(row, col.key)) }}
                </slot>
              </slot>
            </PmgTableCell>
          </PmgTableRow>
        </template>
      </PmgTableBody>

      <PmgTableFooter v-if="$slots.footer">
        <slot name="footer" :columns="columns" :rows="rows" />
      </PmgTableFooter>
    </PmgTable>
  </div>
</template>
