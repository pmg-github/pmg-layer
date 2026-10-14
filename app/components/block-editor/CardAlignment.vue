<script setup lang="ts">
type CardAlignment = 'left' | 'center' | 'right';

withDefaults(
  defineProps<{
    modelValue?: CardAlignment;
    label?: string;
  }>(),
  {
    modelValue: 'center',
    label: 'Tekstuitlijning in kaarten',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: CardAlignment];
}>();

const options: Array<{
  value: CardAlignment;
  label: string;
  icon: string;
}> = [
  {
    value: 'left',
    label: 'Links',
    icon: 'material-symbols:format-align-left',
  },
  {
    value: 'center',
    label: 'Gecentreerd',
    icon: 'material-symbols:format-align-center',
  },
  {
    value: 'right',
    label: 'Rechts',
    icon: 'material-symbols:format-align-right',
  },
];
</script>

<template>
  <div class="space-y-2">
    <span class="block text-xs font-medium text-gray-600">{{ label }}</span>
    <div
      class="inline-flex rounded-lg bg-gray-100 p-1"
      role="group"
      :aria-label="label"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition"
        :class="
          modelValue === option.value
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        "
        :aria-pressed="modelValue === option.value"
        @click="emit('update:modelValue', option.value)"
      >
        <Icon :name="option.icon" class="size-4" />
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
