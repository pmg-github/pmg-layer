<script setup lang="ts">
import { computed } from "vue";
import type { NuxtLinkProps } from "nuxt/app";
import { twMerge } from "tailwind-merge";

export interface TableRowProps {
  to?: NuxtLinkProps["to"];
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

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
const router = useRouter();

const isNestedControl = (event: MouseEvent | KeyboardEvent) => {
  const target = event.target as Element | null;
  const control = target?.closest(
    "a, button, input, select, textarea, [role='button'], [role='link'], [contenteditable='true'], .table-action-cell",
  );
  return !!control && control !== event.currentTarget;
};

const handleClick = (event: MouseEvent) => {
  emit("click", event);
  if (!props.to || event.defaultPrevented || isNestedControl(event)) return;
  if (event.button !== 0 && event.button !== 1) return;
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1) {
    event.preventDefault();
    window.open(router.resolve(props.to).href, "_blank", "noopener");
    return;
  }
  if (event.altKey) return;
  event.preventDefault();
  router.push(props.to);
};

const handleKeydown = (event: KeyboardEvent) => {
  if (
    !props.to ||
    event.defaultPrevented ||
    event.target !== event.currentTarget ||
    event.key !== "Enter"
  ) {
    return;
  }
  event.preventDefault();
  (event.currentTarget as HTMLElement).click();
};

const rowClasses = computed(() =>
  twMerge(
    "group/table-row border-b border-gray-100 transition-colors last:border-b-0",
    props.hoverable && "hover:bg-gray-50/70",
    (props.interactive || props.to) &&
      "cursor-pointer hover:bg-gray-100/70 active:bg-gray-100",
    props.selected && "bg-blue-50/60 hover:bg-blue-50/80",
    props.class,
  ),
);
</script>

<template>
  <tr
    :class="rowClasses"
    :data-state="selected ? 'selected' : undefined"
    :tabindex="to ? 0 : undefined"
    :role="to ? 'link' : undefined"
    @click="handleClick"
    @auxclick="handleClick"
    @keydown="handleKeydown"
  >
    <slot />
  </tr>
</template>
