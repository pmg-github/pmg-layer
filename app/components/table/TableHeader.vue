<script setup lang="ts">
import { computed } from "vue";
import { twMerge } from "tailwind-merge";

export interface TableHeaderProps {
  /**
   * Keep the header sticky when scrolling.
   */
  sticky?: boolean;
  /**
   * Additional CSS classes for the thead element.
   */
  class?: any;
}

const props = withDefaults(defineProps<TableHeaderProps>(), {
  sticky: false,
});

const headerClasses = computed(() =>
  twMerge(
    "border-b border-gray-200 bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider",
    props.sticky && "sticky top-0 z-10 bg-gray-50 backdrop-blur-sm",
    props.class,
  ),
);
</script>

<template>
  <thead :class="headerClasses">
    <slot />
  </thead>
</template>
