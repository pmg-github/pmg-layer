<script setup lang="ts">
import CardAlignment from './CardAlignment.vue';

defineProps<{
  modelValue: 'left' | 'center' | 'right';
}>();

const emit = defineEmits<{
  'update:modelValue': [value: 'left' | 'center' | 'right'];
}>();
</script>

<template>
  <CardAlignment
    :model-value="modelValue"
    label="Uitlijning titel en subtitel"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
