<script setup lang="ts" generic="T extends Record<string, any>, V = any">
export interface RadioGroupProps<T, V> {
  options: T[];
  optionLabel?: (option: T) => string;
  optionValue?: (option: T) => V;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  orientation?: "horizontal" | "vertical";
}

const props = withDefaults(defineProps<RadioGroupProps<T, V>>(), {
  disabled: false,
  required: false,
  orientation: "vertical",
});

const emit = defineEmits<{
  "update:modelValue": [value: V | null];
  change: [value: V | null];
}>();

const modelValue = defineModel<V | null>({ default: null });

const groupId = useId();

const getLabel = (option: T): string => {
  if (props.optionLabel) return props.optionLabel(option);
  if ("key" in option) return String((option as any).key ?? "");
  if ("label" in option) return String((option as any).label ?? "");
  return String(option);
};

const getValue = (option: T): V => {
  if (props.optionValue) return props.optionValue(option);
  if ("value" in option) return (option as any).value;
  if ("id" in option) return (option as any).id;
  return option as unknown as V;
};

const onUpdate = (value: unknown) => {
  modelValue.value = value as V;
  emit("change", value as V);
};
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      class="mb-1.5 block text-[11px] font-medium text-gray-500"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <RadioGroupRoot
      :model-value="modelValue as any"
      :disabled="disabled"
      :orientation="orientation"
      class="flex gap-3"
      :class="orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'"
      @update:model-value="onUpdate"
    >
      <div
        v-for="(opt, index) in options"
        :key="JSON.stringify(getValue(opt))"
        class="flex items-center gap-2"
      >
        <RadioGroupItem
          :id="`${groupId}-${index}`"
          :value="getValue(opt) as any"
          :disabled="disabled"
          class="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-white transition-colors data-[state=checked]:border-blue-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-100"
          :class="{ 'cursor-not-allowed opacity-50': disabled }"
        >
          <RadioGroupIndicator class="flex items-center justify-center">
            <span class="size-2 rounded-full bg-blue-500" />
          </RadioGroupIndicator>
        </RadioGroupItem>

        <label
          :for="`${groupId}-${index}`"
          class="text-xs font-medium text-gray-700"
          :class="{ 'cursor-not-allowed opacity-50': disabled }"
        >
          {{ getLabel(opt) }}
        </label>
      </div>
    </RadioGroupRoot>
  </div>
</template>
