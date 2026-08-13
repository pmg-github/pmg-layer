<script setup lang="ts">
import { useField } from "vee-validate";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

export type InputType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "search"
  | "date"
  | "time"
  | "datetime-local";

export interface InputProps {
  type?: InputType;
  /**
   * Field name. When provided, the input registers itself with vee-validate
   * via `useField` (auto-joins a surrounding `useForm`/`<Form>` if present)
   * and displays its validation error below the field. Omit it to use the
   * component as a plain, standalone v-model input.
   */
  name?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
}

const props = withDefaults(defineProps<InputProps>(), {
  type: "text",
  disabled: false,
  required: false,
  clearable: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number | null];
  change: [value: string | number | null];
}>();

const modelValue = defineModel<string | number | null>({ default: null });

const inputId = useId();

const isSearch = computed(() => props.type === "search");

// Opt-in vee-validate integration: only active when a `name` prop is given.
// `syncVModel` keeps this field's value synced with the component's own
// `modelValue` prop/emit, so `v-model` keeps working the same either way.
const field = props.name
  ? useField<string | number | null>(() => props.name!, undefined, {
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

const hasValue = computed(
  () => displayValue.value != null && displayValue.value !== "",
);

const maxLength = computed(() => {
  const ml = attrs.maxlength ?? attrs.maxLength;
  return ml != null ? Number(ml) : null;
});

const currentLength = computed(() =>
  displayValue.value != null ? String(displayValue.value).length : 0,
);

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value =
    props.type === "number"
      ? target.value === ""
        ? null
        : Number(target.value)
      : target.value;

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

const clear = () => {
  if (field) {
    field.setValue(null);
  } else {
    modelValue.value = null;
  }
  emit("change", null);
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
      class="flex min-h-[2.25rem] w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 transition-colors focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-100"
      :class="{
        'cursor-not-allowed opacity-50': disabled,
        'border-red-300 focus-within:border-red-300 focus-within:ring-red-100':
          showError,
      }"
    >
      <!-- Leading magnifying glass for search type -->
      <Icon
        v-if="isSearch"
        name="material-symbols:search-rounded"
        class="size-4 shrink-0 text-gray-400"
      />

      <input
        :id="inputId"
        :type="type"
        :value="displayValue ?? ''"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        v-bind="$attrs"
        class="min-w-0 flex-1 appearance-none border-none bg-transparent p-0 text-xs text-gray-800 placeholder-gray-400 outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none focus:ring-0"
        @input="onInput"
        @blur="onBlur"
      />

      <!-- Clear button -->
      <button
        v-if="clearable && hasValue"
        type="button"
        class="flex shrink-0 items-center text-gray-400 transition hover:text-gray-600"
        @click.stop.prevent="clear"
      >
        <Icon name="material-symbols:close" class="size-3.5" />
      </button>
    </div>

    <div
      v-if="showError || maxLength"
      class="mt-1 flex items-start justify-between gap-2"
    >
      <p v-if="showError" class="text-[11px] text-red-500">
        {{ errorMessage }}
      </p>
      <span v-else />
      <span
        v-if="maxLength"
        class="shrink-0 text-[11px]"
        :class="
          currentLength >= maxLength
            ? 'text-red-500'
            : currentLength >= maxLength * 0.9
              ? 'text-amber-500'
              : 'text-gray-400'
        "
      >
        {{ currentLength }}/{{ maxLength }}
      </span>
    </div>
  </div>
</template>
