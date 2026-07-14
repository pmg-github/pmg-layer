<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost'
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    disabled: false
  }
)
</script>

<template>
  <button
    class="base-button"
    :class="[`base-button--${variant}`]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.base-button--primary {
  background: var(--layer-starter-primary, #00dc82);
  color: #04140c;
}

.base-button--ghost {
  background: transparent;
  border: 1px solid currentColor;
}

.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
