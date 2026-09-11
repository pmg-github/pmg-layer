<script setup lang="ts">
import { computed } from "vue";
import { twMerge } from "tailwind-merge";

export interface TableRowProps {
  /**
   * Whether the row is selected.
   */
  selected?: boolean;
  /**
   * Whether the row highlights on hover.
   */
  hoverable?: boolean;
  /**
   * Whether the row shows a pointer cursor and click styles.
   */
  interactive?: boolean;
  /**
   * Additional CSS classes for the tr element.
   */
  class?: any;
}

const props = withDefaults(defineProps<TableRowProps>(), {
  selected: false,
  hoverable: true,
  interactive: false,
});

const rowClasses = computed(() =>
  twMerge(
    "border-b border-gray-100 transition-colors last:border-b-0",
    props.hoverable && "hover:bg-gray-50/70",
    props.interactive &&
      "cursor-pointer hover:bg-gray-100/70 active:bg-gray-100",
    props.selected && "bg-blue-50/60 hover:bg-blue-50/80",
    props.class,
  ),
);
</script>

<template>
  <tr :class="rowClasses" :data-state="selected ? 'selected' : undefined">
    <slot />
  </tr>
</template>
