<script setup lang="ts">
export interface TextareaProps {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
}

const props = withDefaults(defineProps<TextareaProps>(), {
  disabled: false,
  required: false,
  rows: 3,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | null];
  change: [value: string | null];
}>();

const modelValue = defineModel<string | null>({ default: null });

const inputId = useId();

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  modelValue.value = target.value;
  emit("change", target.value);
};
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="inputId"
      class="mb-1.5 block text-[11px] font-medium text-gray-500"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div
      class="flex w-full items-start gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 transition-colors focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-100"
      :class="{ 'cursor-not-allowed opacity-50': disabled }"
    >
      <textarea
        :id="inputId"
        :value="modelValue ?? ''"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :rows="rows"
        class="min-w-0 flex-1 resize-y border-none bg-transparent p-0 text-xs text-gray-800 placeholder-gray-400 outline-none focus:ring-0"
        @input="onInput"
      />
    </div>
  </div>
</template>
