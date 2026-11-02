<script setup lang="ts">
import { useField } from "vee-validate";
import {
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
  TagsInputRoot,
} from "reka-ui";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

export interface TagsProps {
  /**
   * Field name. When provided, the tags input registers itself with
   * vee-validate via `useField` and displays validation feedback.
   */
  name?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  separator?: string;
  delimiters?: RegExp;
  allowDuplicates?: boolean;
  maxlength?: number;
  warningMaxLength?: number;
}

const props = withDefaults(defineProps<TagsProps>(), {
  placeholder: "Trefwoorden toevoegen...",
  disabled: false,
  required: false,
  clearable: false,
  separator: ",",
  allowDuplicates: false,
  maxlength: 300,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | null];
  change: [value: string | null];
}>();

const modelValue = defineModel<string | null>({ default: null });

const inputId = useId();

const field = props.name
  ? useField<string | null>(() => props.name!, undefined, {
      syncVModel: true,
      validateOnValueUpdate: true,
    })
  : null;

const errorMessage = computed(() => field?.errorMessage.value);
const showError = computed(() => !!field?.meta.touched && !!errorMessage.value);

const rawValue = computed(() => (field ? field.value.value : modelValue.value));

const maxLength = computed(() => {
  if (props.maxlength == null) return null;
  const value = Number(props.maxlength);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
});

const warningMaxLength = computed(() => {
  if (props.warningMaxLength == null) return null;
  const value = Number(props.warningMaxLength);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
});

const serializedValue = computed(() => {
  const raw = rawValue.value;
  if (Array.isArray(raw)) return normalizeTags(raw).join(props.separator);
  return raw == null ? "" : String(raw);
});

const draftValue = ref("");

const currentLength = computed(() => {
  if (!draftValue.value) return serializedValue.value.length;
  return (
    serializedValue.value.length +
    (serializedValue.value ? props.separator.length : 0) +
    draftValue.value.length
  );
});

const inputMaxLength = computed(() => {
  if (maxLength.value == null) return undefined;
  return Math.max(
    0,
    maxLength.value -
      serializedValue.value.length -
      (serializedValue.value ? props.separator.length : 0),
  );
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
  if (maxLength.value != null && currentLength.value >= maxLength.value) {
    return "text-red-500";
  }
  if (maxLength.value != null && currentLength.value >= maxLength.value * 0.9) {
    return "text-amber-500";
  }
  return "text-gray-400";
});

const lengthMetaText = computed(() => {
  const limit = warningMaxLength.value ?? maxLength.value;
  return limit == null ? "" : `${currentLength.value}/${limit}`;
});

const delimiterPattern = computed(() => props.delimiters ?? /[,;]/);

const normalizeTags = (values: string[]) => {
  const normalized: string[] = [];

  for (const value of values) {
    const tag = value.trim();
    if (!tag) continue;

    if (!props.allowDuplicates && normalized.includes(tag)) continue;
    normalized.push(tag);
  }

  return normalized;
};

const setSerializedValue = (value: string | null) => {
  if (field) {
    field.setValue(value);
  } else {
    modelValue.value = value;
  }
};

const serializeTags = (values: string[]) => {
  const normalized = normalizeTags(values);
  return normalized.length > 0 ? normalized.join(props.separator) : null;
};

const tags = computed<string[]>({
  get() {
    const raw = rawValue.value as string | string[] | null;

    if (Array.isArray(raw)) {
      return normalizeTags(raw);
    }

    if (!raw) return [];

    return normalizeTags(String(raw).split(delimiterPattern.value));
  },
  set(values) {
    const nextValue = serializeTags(values);
    if (
      maxLength.value != null &&
      nextValue &&
      nextValue.length > maxLength.value &&
      nextValue.length > serializedValue.value.length
    ) {
      return;
    }
    draftValue.value = "";
    setSerializedValue(nextValue);
    field?.setTouched(true);
    emit("change", nextValue);
  },
});

const hasTags = computed(() => tags.value.length > 0);

const onBlur = (event: FocusEvent) => {
  field?.handleBlur(event);
};

const onInput = (event: Event) => {
  draftValue.value = (event.target as HTMLInputElement).value;
};

const clear = () => {
  setSerializedValue(null);
  field?.setTouched(true);
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

    <TagsInputRoot
      addOnBlur
      :id="inputId"
      v-model="tags"
      :delimiter="delimiterPattern"
      :disabled="disabled"
      v-bind="attrs"
      class="flex min-h-[2.25rem] w-full flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-1.5 py-1.5 transition-colors focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-100"
      :class="{
        'cursor-not-allowed opacity-50': disabled,
        'border-red-300 focus-within:border-red-300 focus-within:ring-red-100':
          showError,
      }"
    >
      <TagsInputItem
        v-for="item in tags"
        :key="item"
        :value="item"
        class="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
      >
        <TagsInputItemText />
        <TagsInputItemDelete
          class="flex items-center justify-center rounded-full text-blue-500 transition hover:bg-blue-100 hover:text-blue-700 focus:outline-none"
        >
          <Icon name="material-symbols:close" class="size-3.5" />
        </TagsInputItemDelete>
      </TagsInputItem>

      <TagsInputInput
        :placeholder="placeholder"
        :maxlength="inputMaxLength"
        class="min-w-[8rem] flex-1 border-none bg-transparent p-0 text-xs text-gray-800 placeholder-gray-400 outline-none focus:ring-0"
        @input="onInput"
        @blur="onBlur"
      />

      <button
        v-if="clearable && hasTags"
        type="button"
        class="flex shrink-0 items-center text-gray-400 transition hover:text-gray-600"
        @click.stop.prevent="clear"
      >
        <Icon name="material-symbols:close" class="size-3.5" />
      </button>
    </TagsInputRoot>

    <div class="mt-1 flex items-start justify-between gap-2">
      <p class="text-[11px] text-gray-500">
        Druk op Enter of gebruik het "{{ separator }}" om een trefwoord toe te
        voegen.
      </p>
      <span
        v-if="maxLength != null || warningMaxLength != null"
        class="shrink-0 text-[11px]"
        :class="lengthMetaClass"
      >
        {{ lengthMetaText }}
      </span>
    </div>

    <div v-if="showError" class="mt-1 flex items-start justify-between gap-2">
      <p class="text-[11px] text-red-500">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>
