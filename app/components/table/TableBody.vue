<script setup lang="ts">
import { computed } from "vue";
import { twMerge } from "tailwind-merge";

export interface TableBodyProps {
  /**
   * Additional CSS classes for the tbody element.
   */
  class?: any;
}

const props = defineProps<TableBodyProps>();

const bodyClasses = computed(() =>
  twMerge("divide-y divide-gray-200 bg-white", props.class),
);
</script>

<template>
  <tbody :class="bodyClasses">
    <slot />
  </tbody>
</template>
