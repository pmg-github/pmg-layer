<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "primary" | "ghost";
    disabled?: boolean;
  }>(),
  {
    variant: "primary",
    disabled: false,
  },
);
</script>

<template>
  <button
    class="inline-flex min-h-[2.25rem] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-center text-xs font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
    :class="[
      variant === 'primary'
        ? 'border-blue-500 bg-blue-500 text-white hover:border-blue-600 hover:bg-blue-600 focus-visible:border-blue-300'
        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus-visible:border-blue-300',
    ]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
