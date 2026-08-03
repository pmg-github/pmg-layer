<script setup lang="ts">
export interface CheckboxProps {
  label?: string;
  disabled?: boolean;
  required?: boolean;
}

const props = withDefaults(defineProps<CheckboxProps>(), {
  disabled: false,
  required: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  change: [value: boolean];
}>();

const modelValue = defineModel<boolean>({ default: false });

const inputId = useId();

const onUpdate = (value: boolean | "indeterminate") => {
  const checked = value === true;
  modelValue.value = checked;
  emit("change", checked);
};
</script>

<template>
  <div class="flex items-center gap-2">
    <CheckboxRoot
      :id="inputId"
      :model-value="modelValue"
      :disabled="disabled"
      class="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded border border-gray-300 bg-white transition-colors data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-100"
      :class="{ 'cursor-not-allowed opacity-50': disabled }"
      @update:model-value="onUpdate"
    >
      <CheckboxIndicator>
        <Icon name="material-symbols:check-rounded" class="size-3 text-white" />
      </CheckboxIndicator>
    </CheckboxRoot>

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
