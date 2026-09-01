<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import { useField } from "vee-validate";

export interface ComboboxProps {
  name?: string;
  options?: string[];
  fetch?: (query: string, signal: AbortSignal) => Promise<string[]>;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  autocomplete?: boolean;
  searchDebounce?: number;
  noResultsText?: string;
  loadingText?: string;
}

const props = withDefaults(defineProps<ComboboxProps>(), {
  clearable: false,
  disabled: false,
  required: false,
  autocomplete: false,
  searchDebounce: 300,
  noResultsText: "Geen resultaten",
  loadingText: "Laden...",
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
const currentValue = computed(() => field?.value.value ?? modelValue.value);
const inputValue = computed(() => currentValue.value ?? "");
const hasValue = computed(() => inputValue.value.length > 0);

const internalOptions = ref<string[]>([]);
const isOpen = ref(false);
const isLoading = ref(false);
const hasFetchedOnce = ref(false);

let fetchId = 0;
let controller: AbortController | null = null;

const setValue = (value: string | null) => {
  if (field) {
    field.handleChange(value);
  } else {
    modelValue.value = value;
  }
  emit("change", value);
};

const suggestions = computed(() => props.options ?? internalOptions.value);

const filteredOptions = computed(() => {
  const query = inputValue.value.toLowerCase().trim();
  if (!query || props.fetch) return suggestions.value;

  return suggestions.value.filter((option) =>
    option.toLowerCase().includes(query),
  );
});

const doFetch = async (query: string) => {
  if (!props.fetch) return;

  controller?.abort();
  controller = new AbortController();
  const id = ++fetchId;

  isLoading.value = true;
  try {
    const results = await props.fetch(query, controller.signal);
    if (id !== fetchId) return;
    internalOptions.value = results;
    hasFetchedOnce.value = true;
  } catch (error: any) {
    if (error?.name === "AbortError") return;
    console.error("Combobox fetch error:", error);
  } finally {
    if (id === fetchId) isLoading.value = false;
  }
};

const debouncedFetch = useDebounceFn((query: string) => {
  doFetch(query);
}, props.searchDebounce);

const onOpenChange = (open: boolean) => {
  isOpen.value = open;

  if (!open) {
    field?.setTouched(true);
    return;
  }

  if (props.fetch && !hasFetchedOnce.value) {
    doFetch(inputValue.value);
  }
};

const onInput = (value: string) => {
  setValue(value || null);

  if (props.fetch) {
    debouncedFetch(value);
  }
};

const onSelect = (value: string) => {
  setValue(value);
  field?.setTouched(true);
  isOpen.value = false;
};

const clear = () => {
  setValue(null);
  field?.setTouched(true);
};

watch(
  () => props.options,
  (newOptions) => {
    if (newOptions) internalOptions.value = newOptions;
  },
  { immediate: true },
);

onUnmounted(() => {
  controller?.abort();
});
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

    <ComboboxRoot
      :open="isOpen"
      :model-value="inputValue"
      :ignore-filter="true"
      :disabled="disabled"
      @update:open="onOpenChange"
    >
      <ComboboxAnchor
        class="flex min-h-[2.25rem] w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-1.5 py-1.5 transition-colors focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-100"
        :class="{
          'cursor-not-allowed opacity-50': disabled,
          'border-blue-300 ring-1 ring-blue-100': isOpen,
          'border-red-300 focus-within:border-red-300 focus-within:ring-red-100':
            showError,
        }"
        @focusout="field?.handleBlur($event)"
      >
        <Icon
          name="material-symbols:search-rounded"
          class="size-4 shrink-0 text-gray-400"
        />

        <ComboboxInput
          :id="inputId"
          :model-value="inputValue"
          class="min-w-0 flex-1 border-none bg-transparent p-0 text-xs text-gray-800 placeholder-gray-400 outline-none focus:ring-0"
          :placeholder="placeholder || 'Zoeken...'"
          :autocomplete="autocomplete ? 'on' : 'off'"
          :disabled="disabled"
          :required="required"
          @update:model-value="onInput"
        />

        <button
          v-if="clearable && hasValue"
          type="button"
          class="flex shrink-0 items-center text-gray-400 transition hover:text-gray-600"
          @click.stop.prevent="clear"
        >
          <Icon name="material-symbols:close" class="size-3.5" />
        </button>

        <ComboboxTrigger as-child>
          <button
            type="button"
            class="flex shrink-0 items-center"
            :disabled="disabled"
          >
            <Icon
              name="material-symbols:keyboard-arrow-down-rounded"
              class="size-4 text-gray-400 transition-transform"
              :class="{ 'rotate-180': isOpen }"
            />
          </button>
        </ComboboxTrigger>
      </ComboboxAnchor>

      <ComboboxPortal>
        <ComboboxContent
          position="popper"
          side="bottom"
          align="start"
          :side-offset="4"
          class="w-[var(--reka-combobox-trigger-width)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl shadow-gray-200/60"
        >
          <ComboboxViewport class="max-h-60 overflow-y-auto py-1">
            <div
              v-if="isLoading"
              class="flex items-center justify-center px-3 py-4"
            >
              <Icon
                name="material-symbols:progress-activity"
                class="size-4 animate-spin text-blue-500"
              />
              <span class="ml-2 text-xs text-gray-500">{{ loadingText }}</span>
            </div>

            <template v-else-if="filteredOptions.length > 0">
              <ComboboxItem
                v-for="option in filteredOptions"
                :key="option"
                :value="option"
                :text-value="option"
                class="mx-1 flex cursor-default select-none items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs text-gray-700 outline-none transition-colors data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900"
                :class="{ 'bg-blue-50/50': option === inputValue }"
                @select.prevent="onSelect(option)"
              >
                <span class="truncate">{{ option }}</span>
                <Icon
                  v-if="option === inputValue"
                  name="material-symbols:check-rounded"
                  class="size-4 shrink-0 text-blue-600"
                />
              </ComboboxItem>
            </template>

            <div v-else class="px-3 py-4 text-center text-xs text-gray-400">
              {{ noResultsText }}
            </div>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>

    <p v-if="showError" class="mt-1 text-[11px] text-red-500">
      {{ errorMessage }}
    </p>
  </div>
</template>
