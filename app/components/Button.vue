<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
    size?: "sm" | "md" | "lg";
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    loading?: boolean;
    icon?: string;
    iconRight?: string;
  }>(),
  {
    variant: "primary",
    size: "md",
    type: "button",
    disabled: false,
    loading: false,
  },
);

const isDisabled = computed(() => props.disabled || props.loading);

const iconSize = computed(() => (props.size === "lg" ? "size-4" : "size-3.5"));

// No slot content = icon-only: use square padding
const slots = useSlots();
const iconOnly = computed(() => !slots.default);
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled"
    class="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
    :class="[
      size === 'sm' && !iconOnly && 'min-h-[1.75rem] px-2.5 py-1 text-[11px]',
      size === 'md' && !iconOnly && 'min-h-[2.25rem] px-3 py-1.5 text-xs',
      size === 'lg' && !iconOnly && 'min-h-[2.75rem] px-4 py-2 text-sm',
      size === 'sm' && iconOnly && 'size-[1.75rem] text-[11px]',
      size === 'md' && iconOnly && 'size-[2.25rem] text-xs',
      size === 'lg' && iconOnly && 'size-[2.75rem] text-sm',
      variant === 'primary' &&
        'border-blue-500 bg-blue-500 text-white hover:border-blue-600 hover:bg-blue-600 focus-visible:border-blue-300',
      variant === 'secondary' &&
        'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:border-blue-300',
      variant === 'ghost' &&
        'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus-visible:border-blue-300',
      variant === 'danger' &&
        'border-red-500 bg-red-500 text-white hover:border-red-600 hover:bg-red-600 focus-visible:border-red-300',
      variant === 'success' &&
        'border-green-500 bg-green-500 text-white hover:border-green-600 hover:bg-green-600 focus-visible:border-green-300',
    ]"
  >
    <Icon
      v-if="loading"
      name="material-symbols:progress-activity"
      class="animate-spin"
      :class="iconSize"
    />
    <Icon v-else-if="icon" :name="icon" :class="iconSize" />
    <slot />
    <Icon v-if="iconRight && !loading" :name="iconRight" :class="iconSize" />
  </button>
</template>
