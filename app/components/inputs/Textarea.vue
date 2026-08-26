<script setup lang="ts">
import { useField } from "vee-validate";

export interface TextareaProps {
  name?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  warningMinLength?: number;
  warningMaxLength?: number;
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

// Opt-in vee-validate integration: only active when a `name` prop is given.
// `syncVModel` keeps this field's value synced with the component's own
// `modelValue` prop/emit, so `v-model` keeps working the same either way.
const field = props.name
  ? useField<string | null>(() => props.name!, undefined, {
      syncVModel: true,
      validateOnValueUpdate: true,
    })
  : null;

const errorMessage = computed(() => field?.errorMessage.value);
const showError = computed(() => !!field?.meta.touched && !!errorMessage.value);

// When vee-validate manages the field, its own `value` ref is the source of
// truth for display (syncVModel emits to the parent, but doesn't write back
// into our local, unbound modelValue ref when no v-model is passed in).
const displayValue = computed(() =>
  field ? field.value.value : modelValue.value,
);

const currentLength = computed(() =>
  displayValue.value != null ? String(displayValue.value).length : 0,
);

const warningMinLength = computed(() => {
  if (props.warningMinLength == null) return null;
  const value = Number(props.warningMinLength);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
});

const warningMaxLength = computed(() => {
  if (props.warningMaxLength == null) return null;
  const value = Number(props.warningMaxLength);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
});

const hasLengthMeta = computed(
  () => !!warningMinLength.value || !!warningMaxLength.value,
);

const lengthMetaText = computed(() => {
  if (warningMaxLength.value && warningMinLength.value) {
    return `${currentLength.value}/${warningMaxLength.value} (min. ${warningMinLength.value})`;
  }

  if (warningMaxLength.value) {
    return `${currentLength.value}/${warningMaxLength.value}`;
  }

  if (warningMinLength.value) {
    return `${currentLength.value} (min. ${warningMinLength.value})`;
  }

  return "";
});

const lengthMetaClass = computed(() => {
  if (
    warningMaxLength.value != null &&
    currentLength.value > warningMaxLength.value
  ) {
    return "text-red-500";
  }

  if (
    warningMaxLength.value != null &&
    currentLength.value >= warningMaxLength.value * 0.9
  ) {
    return "text-amber-500";
  }

  if (
    warningMinLength.value != null &&
    currentLength.value < warningMinLength.value
  ) {
    return "text-amber-500";
  }

  return "text-gray-400";
});

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  const value = target.value;

  if (field) {
    field.handleChange(value);
  } else {
    modelValue.value = value;
  }
  emit("change", value);
};

const onBlur = (event: Event) => {
  field?.handleBlur(event);
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
      class="flex w-full items-start gap-1.5 rounded-lg border border-gray-200 bg-white px-1.5 py-1.5 transition-colors focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-100"
      :class="{
        'cursor-not-allowed opacity-50': disabled,
        'border-red-300 focus-within:border-red-300 focus-within:ring-red-100':
          showError,
      }"
    >
      <textarea
        :id="inputId"
        :value="displayValue ?? ''"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :rows="rows"
        class="min-w-0 flex-1 resize-y border-none bg-transparent p-0 text-xs text-gray-800 placeholder-gray-400 outline-none focus:ring-0"
        @input="onInput"
        @blur="onBlur"
      />
    </div>

    <div
      v-if="showError || hasLengthMeta"
      class="mt-1 flex items-start justify-between gap-2"
    >
      <p v-if="showError" class="text-[11px] text-red-500">
        {{ errorMessage }}
      </p>
      <span v-else />
      <span
        v-if="hasLengthMeta"
        class="shrink-0 text-[11px]"
        :class="lengthMetaClass"
      >
        {{ lengthMetaText }}
      </span>
    </div>
  </div>
</template>
