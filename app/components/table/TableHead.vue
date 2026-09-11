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
   * Additional CSS classes for the th element.
   */
  class?: any;
}

const props = withDefaults(defineProps<TableHeadProps>(), {
  scope: "col",
  align: "left",
});

const headClasses = computed(() =>
  twMerge(
    "px-4 py-3 font-semibold text-gray-600 text-xs tracking-wider align-middle",
    props.align === "left" && "text-left",
    props.align === "center" && "text-center",
    props.align === "right" && "text-right",
    props.class,
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
      typeof props.minWidth === "number" ? `${props.minWidth}px` : props.minWidth;
  }
  return styles;
});
</script>

<template>
  <th :scope="scope" :class="headClasses" :style="headStyles">
    <slot />
  </th>
</template>
