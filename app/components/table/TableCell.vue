<script setup lang="ts">
import { computed } from "vue";
import { twMerge } from "tailwind-merge";

export interface TableCellProps {
  /**
   * Text and content alignment.
   * @default 'left'
   */
  align?: "left" | "center" | "right";
  /**
   * Additional CSS classes for the td element.
   */
  class?: any;
}

const props = withDefaults(defineProps<TableCellProps>(), {
  align: "left",
});

const cellClasses = computed(() =>
  twMerge(
    "px-4 py-3 align-middle text-sm text-gray-700",
    props.align === "left" && "text-left",
    props.align === "center" && "text-center",
    props.align === "right" && "text-right",
    props.class,
  ),
);
</script>

<template>
  <td :class="cellClasses">
    <slot />
  </td>
</template>
