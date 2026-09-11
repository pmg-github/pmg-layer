<script setup lang="ts">
import { computed } from "vue";
import { twMerge } from "tailwind-merge";
import type { TableAlign } from "~/types/table";

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
  align?: TableAlign;
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
</script>

<template>
  <th :scope="scope" :class="headClasses">
    <slot />
  </th>
</template>
