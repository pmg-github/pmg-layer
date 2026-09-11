<script setup lang="ts">
import { computed } from "vue";
import { twMerge } from "tailwind-merge";

export interface TableCaptionProps {
  /**
   * Vertical placement of the caption.
   * @default 'bottom'
   */
  side?: "top" | "bottom";
  /**
   * Additional CSS classes for the caption element.
   */
  class?: any;
}

const props = withDefaults(defineProps<TableCaptionProps>(), {
  side: "bottom",
});

const captionClasses = computed(() =>
  twMerge(
    "text-xs text-gray-500",
    props.side === "top" ? "caption-top mb-2" : "caption-bottom mt-2",
    props.class,
  ),
);
</script>

<template>
  <caption :class="captionClasses">
    <slot />
  </caption>
</template>
