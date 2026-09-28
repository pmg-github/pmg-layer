<script setup lang="ts">
import { computed } from "vue";
import { twMerge } from "tailwind-merge";

export interface TableActionCellProps {
  /**
   * Text and content alignment.
   * @default 'right'
   */
  align?: "left" | "center" | "right";
  /**
   * Additional CSS classes for the td element.
   */
  class?: any;
}

const props = withDefaults(defineProps<TableActionCellProps>(), {
  align: "right",
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

const contentClasses = computed(() => [
  "invisible flex items-center gap-2 group-hover/row:visible group-focus-within/row:visible [@media(hover:none)]:visible",
  props.align === "left" && "justify-start",
  props.align === "center" && "justify-center",
  props.align === "right" && "justify-end",
]);
</script>

<template>
  <td :class="cellClasses">
    <div :class="contentClasses">
      <slot />
    </div>
  </td>
</template>
