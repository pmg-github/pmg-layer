<script setup lang="ts">
import { computed } from "vue";
import { twMerge } from "tailwind-merge";

export interface TableProps {
  /**
   * Whether the table rows alternate background colors.
   */
  striped?: boolean;
  /**
   * Whether table rows highlight on hover.
   */
  hoverable?: boolean;
  /**
   * Whether the table has outer and cell borders.
   */
  bordered?: boolean;
  /**
   * Whether to reduce padding for a more compact table layout.
   */
  dense?: boolean;
  /**
   * Additional CSS classes for the table element.
   */
  class?: any;
}

const props = withDefaults(defineProps<TableProps>(), {
  striped: false,
  hoverable: false,
  bordered: false,
  dense: false,
});

const tableClasses = computed(() =>
  twMerge(
    "w-full text-left text-sm text-gray-700 border-collapse caption-bottom",
    props.bordered && "border border-gray-200",
    props.striped && "[&_tbody_tr:nth-child(even)]:bg-gray-50/50",
    props.hoverable &&
      "[&_tbody_tr]:hover:bg-gray-50/75 [&_tbody_tr]:transition-colors",
    props.dense && "[&_th]:py-2 [&_th]:px-3 [&_td]:py-2 [&_td]:px-3 text-xs",
    props.class,
  ),
);
</script>

<template>
  <table :class="tableClasses">
    <slot />
  </table>
</template>
