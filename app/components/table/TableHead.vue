<script setup lang="ts">
import { computed } from "vue";
import { twMerge } from "tailwind-merge";

export interface TableHeadProps {
  /**
   * Header scope attribute ('col', 'row', 'colgroup', 'rowgroup').
   * @default 'col'
   */
  scope?: string;
  /**
   * Text and content alignment.
   * @default 'left'
   */
  align?: "left" | "center" | "right";
  /**
   * Column width (e.g., '200px', '25%', 150).
   * In standard tables, setting width on the header automatically sizes the entire column.
   */
  width?: string | number;
  /**
   * Column minimum width (e.g., '150px', '10rem', 120).
   */
  minWidth?: string | number;
  /**
   * Whether this column can be sorted. Renders a clickable header with a sort icon.
   * The consuming app owns the actual sort/filter logic via the `@sort` event.
   * @default false
   */
  sortable?: boolean;
  /**
   * Current sort direction for this column, controlled by the consumer.
   * `null`/`undefined` renders the neutral (unsorted) icon state.
   */
  sortDirection?: "asc" | "desc" | null;
  /**
   * Additional CSS classes for the th element.
   */
  class?: any;
}

const props = withDefaults(defineProps<TableHeadProps>(), {
  scope: "col",
  align: "left",
  sortable: false,
  sortDirection: null,
});

const emit = defineEmits<{
  (e: "sort"): void;
}>();

const headClasses = computed(() =>
  twMerge(
    "px-4 py-3 font-semibold text-gray-600 text-xs tracking-wider align-middle",
    props.align === "left" && "text-left",
    props.align === "center" && "text-center",
    props.align === "right" && "text-right",
    props.class,
  ),
);

const buttonClasses = computed(() =>
  twMerge(
    "inline-flex items-center gap-1 hover:text-gray-900",
    props.align === "center" && "justify-center",
    props.align === "right" && "justify-end",
  ),
);

const headStyles = computed(() => {
  const styles: Record<string, string> = {};
  if (props.width != null) {
    styles.width =
      typeof props.width === "number" ? `${props.width}px` : props.width;
  }
  if (props.minWidth != null) {
    styles.minWidth =
      typeof props.minWidth === "number"
        ? `${props.minWidth}px`
        : props.minWidth;
  }
  return styles;
});
</script>

<template>
  <th
    :scope="scope"
    :class="headClasses"
    :style="headStyles"
    :aria-sort="
      !sortable
        ? undefined
        : sortDirection === 'asc'
          ? 'ascending'
          : sortDirection === 'desc'
            ? 'descending'
            : 'none'
    "
  >
    <button
      v-if="sortable"
      type="button"
      :class="buttonClasses"
      @click="emit('sort')"
    >
      <slot />
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        class="size-3.5 shrink-0"
        :class="!sortDirection && 'text-gray-400'"
        aria-hidden="true"
      >
        <path v-if="sortDirection === 'asc'" d="M10 5l5 6H5l5-6z" />
        <path v-else-if="sortDirection === 'desc'" d="M10 15l-5-6h10l-5 6z" />
        <path v-else d="M10 4l4 5H6l4-5zm0 12l-4-5h8l-4 5z" />
      </svg>
    </button>
    <slot v-else />
  </th>
</template>
