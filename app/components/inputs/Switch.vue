<script setup lang="ts">
export interface SwitchProps {
  label?: string;
  disabled?: boolean;
  required?: boolean;
}

const props = withDefaults(defineProps<SwitchProps>(), {
  disabled: false,
  required: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  change: [value: boolean];
}>();

const modelValue = defineModel<boolean>({ default: false });

const inputId = useId();

const onUpdate = (value: boolean) => {
  modelValue.value = value;
  emit("change", value);
};
</script>

<template>
  <div class="flex items-center gap-2">
    <SwitchRoot
      :id="inputId"
      :model-value="modelValue"
      :disabled="disabled"
      class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-gray-200 transition-colors data-[state=checked]:bg-blue-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-100"
      :class="{ 'cursor-not-allowed opacity-50': disabled }"
      @update:model-value="onUpdate"
    >
      <SwitchThumb
        class="block size-3.5 translate-x-1 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4"
      />
    </SwitchRoot>

    <label
      v-if="label"
      :for="inputId"
      class="text-xs font-medium text-gray-700"
      :class="{ 'cursor-not-allowed opacity-50': disabled }"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
  </div>
</template>
