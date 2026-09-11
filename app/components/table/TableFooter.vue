<script setup lang="ts">
import { computed } from "vue";
import { twMerge } from "tailwind-merge";

export interface TableFooterProps {
  /**
   * Additional CSS classes for the tfoot element.
   */
  class?: any;
}

const props = defineProps<TableFooterProps>();

const footerClasses = computed(() =>
  twMerge(
    "border-t border-gray-200 bg-gray-50/80 font-medium text-gray-700 text-sm",
    props.class,
  ),
);
</script>

<template>
  <tfoot :class="footerClasses">
    <slot />
  </tfoot>
</template>
