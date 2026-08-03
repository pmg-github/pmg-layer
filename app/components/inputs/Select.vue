<script setup lang="ts" generic="T extends Record<string, any>, V = any">
import { useDebounceFn } from "@vueuse/core";

export interface SelectProps<T, V> {
  options?: T[];
  fetch?: (query: string, signal: AbortSignal) => Promise<T[]>;
  resolve?: (values: V | V[]) => Promise<T[]>;
  optionLabel?: (option: T) => string;
  optionValue?: (option: T) => V;
  searchable?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  displayValue?: string;
  searchDebounce?: number;
  noResultsText?: string;
  loadingText?: string;
}

const props = withDefaults(defineProps<SelectProps<T, V>>(), {
  searchable: false,
  multiple: false,
  clearable: false,
  disabled: false,
  required: false,
  searchDebounce: 300,
  noResultsText: "Geen resultaten",
  loadingText: "Laden...",
});

const emit = defineEmits<{
  "update:modelValue": [value: V | V[] | null];
  change: [value: V | V[] | null];
}>();

const modelValue = defineModel<V | V[] | null>({ default: null });

// Internal state
const internalOptions = ref<T[]>([]) as Ref<T[]>;
const resolvedOptions = ref<T[]>([]) as Ref<T[]>;
const searchQuery = ref("");
const isLoading = ref(false);
const isResolving = ref(false);
const isOpen = ref(false);
const hasFetchedOnce = ref(false);

// Abort / staleness
let fetchId = 0;
let controller: AbortController | null = null;

// Deep value comparison (handles arrays, objects, primitives)
const valuesEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  return JSON.stringify(a) === JSON.stringify(b);
};

const valuesInclude = (arr: any[], value: any): boolean => {
  return arr.some((item) => valuesEqual(item, value));
};

// Accessors with defaults
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

// All available options (merged: static + fetched + resolved)
const allOptions = computed<T[]>(() => {
  const base = props.options ?? internalOptions.value;
  const resolved = resolvedOptions.value;

  if (!resolved.length) return base;

  // Merge resolved options that aren't already in the base list
  const baseValues = base.map((o) => getValue(o));
  const extra = resolved.filter((o) => !valuesInclude(baseValues, getValue(o)));
  return [...extra, ...base];
});

// Filtered options for display in dropdown
const filteredOptions = computed<T[]>(() => {
  const list = allOptions.value;
  if (!props.searchable || !searchQuery.value.trim()) return list;
  if (props.fetch) return list; // server-side filtering, don't filter client-side

  const q = searchQuery.value.toLowerCase().trim();
  return list.filter((option) => getLabel(option).toLowerCase().includes(q));
});

// Selected option(s) for display
const selectedOptions = computed<T[]>(() => {
  if (modelValue.value == null) return [];

  if (props.multiple) {
    const values = Array.isArray(modelValue.value) ? modelValue.value : [];
    return allOptions.value.filter((o) => valuesInclude(values, getValue(o)));
  }

  // Single select: find the one option whose value matches modelValue
  const match = allOptions.value.find((o) =>
    valuesEqual(getValue(o), modelValue.value),
  );
  return match ? [match] : [];
});

const displayLabel = computed<string>(() => {
  if (selectedOptions.value.length === 0) {
    return props.displayValue ?? "";
  }
  if (props.multiple) {
    return selectedOptions.value.map((o) => getLabel(o)).join(", ");
  }
  return getLabel(selectedOptions.value[0]!);
});

// Fetch logic
const doFetch = async (query: string) => {
  if (!props.fetch) return;

  controller?.abort();
  controller = new AbortController();
  const id = ++fetchId;

  isLoading.value = true;
  try {
    const results = await props.fetch(query, controller.signal);
    if (id !== fetchId) return; // stale
    internalOptions.value = results;
    hasFetchedOnce.value = true;
  } catch (e: any) {
    if (e?.name === "AbortError") return;
    console.error("Select fetch error:", e);
  } finally {
    if (id === fetchId) isLoading.value = false;
  }
};

const debouncedFetch = useDebounceFn((query: string) => {
  doFetch(query);
}, props.searchDebounce);

// Resolve initial values
const resolveInitialValues = async () => {
  if (!props.resolve || modelValue.value == null) return;

  const values = Array.isArray(modelValue.value)
    ? modelValue.value
    : modelValue.value;
  if (Array.isArray(values) && values.length === 0) return;

  isResolving.value = true;
  try {
    const resolved = await props.resolve(values as any);
    resolvedOptions.value = resolved;
  } catch (e) {
    console.error("Select resolve error:", e);
  } finally {
    isResolving.value = false;
  }
};

// Handle dropdown open
const onOpenChange = (open: boolean) => {
  isOpen.value = open;
  if (open && props.fetch && !hasFetchedOnce.value) {
    doFetch("");
  }
  if (!open) {
    searchQuery.value = "";
  }
};

// Handle search input
const onSearchInput = (value: string) => {
  searchQuery.value = value;
  if (props.fetch) {
    debouncedFetch(value);
  }
};

// Handle selection
const onSelect = (option: T) => {
  const value = getValue(option);

  if (props.multiple) {
    const current = Array.isArray(modelValue.value)
      ? [...modelValue.value]
      : [];
    const idx = current.findIndex((v) => valuesEqual(v, value));
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(value);
    }
    modelValue.value = current as any;
    emit("change", current as any);
  } else {
    modelValue.value = value as any;
    emit("change", value as any);
    isOpen.value = false;
  }
};

const isSelected = (option: T): boolean => {
  const value = getValue(option);
  if (props.multiple && Array.isArray(modelValue.value)) {
    return valuesInclude(modelValue.value, value);
  }
  return valuesEqual(modelValue.value, value);
};

const clear = () => {
  modelValue.value = props.multiple ? ([] as any) : null;
  emit("change", props.multiple ? ([] as any) : null);
  searchQuery.value = "";
};

const removeTag = (value: V) => {
  if (!Array.isArray(modelValue.value)) return;
  const updated = modelValue.value.filter((v) => !valuesEqual(v, value));
  modelValue.value = updated as any;
  emit("change", updated as any);
};

// Lifecycle
onMounted(() => {
  // Static options: load immediately
  if (props.options) {
    internalOptions.value = props.options;
  }

  // Resolve initial values for async selects
  if (props.resolve && modelValue.value != null) {
    const hasValue = Array.isArray(modelValue.value)
      ? modelValue.value.length > 0
      : true;
    if (hasValue) resolveInitialValues();
  }
});

// Watch for external options changes
watch(
  () => props.options,
  (newOptions) => {
    if (newOptions) internalOptions.value = newOptions;
  },
);

// Re-resolve when modelValue changes externally (e.g., form reset)
watch(
  () => modelValue.value,
  (newVal, oldVal) => {
    if (JSON.stringify(newVal) === JSON.stringify(oldVal)) return;
    if (!props.resolve || newVal == null) return;

    // Only re-resolve if there are values we can't find in current options
    const values = Array.isArray(newVal) ? newVal : [newVal];
    const knownValues = allOptions.value.map((o) => getValue(o));
    const unknown = values.filter((v) => !valuesInclude(knownValues, v));
    if (unknown.length > 0) resolveInitialValues();
  },
);

onUnmounted(() => {
  controller?.abort();
});
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

    <ComboboxRoot
      :open="isOpen"
      :model-value="undefined"
      :ignore-filter="true"
      :disabled="disabled"
      @update:open="onOpenChange"
    >
      <ComboboxAnchor
        class="flex min-h-[2.25rem] w-full flex-col justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 transition-colors focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-100"
        :class="{
          'cursor-not-allowed opacity-50': disabled,
          'border-blue-300 ring-1 ring-blue-100': isOpen,
        }"
      >
        <!-- Multi-select tags (own row, wraps independently) -->
        <div
          v-if="multiple && selectedOptions.length > 0"
          class="flex flex-wrap gap-1"
        >
          <span
            v-for="opt in selectedOptions"
            :key="JSON.stringify(getValue(opt))"
            class="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
          >
            {{ getLabel(opt) }}
            <button
              type="button"
              class="flex items-center text-blue-400 transition hover:text-blue-600"
              @click.stop.prevent="removeTag(getValue(opt))"
            >
              <Icon name="material-symbols:close" class="size-3" />
            </button>
          </span>
        </div>

        <!-- Input / trigger row -->
        <div class="flex w-full items-center gap-1">
          <ComboboxTrigger v-if="!searchable" as-child>
            <button
              type="button"
              class="flex w-full min-w-0 flex-1 items-center justify-between gap-2 text-left"
              :disabled="disabled"
            >
              <span
                class="truncate text-xs"
                :class="displayLabel ? 'text-gray-800' : 'text-gray-400'"
              >
                {{ displayLabel || placeholder || "Selecteer..." }}
              </span>
              <Icon
                name="material-symbols:keyboard-arrow-down-rounded"
                class="size-4 shrink-0 text-gray-400 transition-transform"
                :class="{ 'rotate-180': isOpen }"
              />
            </button>
          </ComboboxTrigger>

          <template v-else>
            <ComboboxInput
              :model-value="searchQuery"
              class="min-w-[4rem] flex-1 border-none bg-transparent p-0 text-xs text-gray-800 placeholder-gray-400 outline-none focus:ring-0"
              :placeholder="
                !multiple && displayLabel
                  ? displayLabel
                  : placeholder || 'Zoeken...'
              "
              autocomplete="off"
              :disabled="disabled"
              @update:model-value="onSearchInput"
            />
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
          </template>

          <!-- Clear button -->
          <button
            v-if="
              clearable &&
              modelValue != null &&
              (Array.isArray(modelValue) ? modelValue.length > 0 : true)
            "
            type="button"
            class="flex shrink-0 items-center text-gray-400 transition hover:text-gray-600"
            @click.stop.prevent="clear"
          >
            <Icon name="material-symbols:close" class="size-3.5" />
          </button>
        </div>
      </ComboboxAnchor>

      <ComboboxPortal>
        <ComboboxContent
          position="popper"
          side="bottom"
          align="start"
          :side-offset="4"
          class="z-50 w-[var(--reka-combobox-trigger-width)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl shadow-gray-200/60"
        >
          <!-- Search inside dropdown (when searchable but want input in dropdown) -->
          <ComboboxViewport class="max-h-60 overflow-y-auto py-1">
            <!-- Loading state -->
            <div
              v-if="isLoading || isResolving"
              class="flex items-center justify-center px-3 py-4"
            >
              <Icon
                name="material-symbols:progress-activity"
                class="size-4 animate-spin text-blue-500"
              />
              <span class="ml-2 text-xs text-gray-500">{{ loadingText }}</span>
            </div>

            <!-- Options -->
            <template v-else-if="filteredOptions.length > 0">
              <ComboboxItem
                v-for="option in filteredOptions"
                :key="JSON.stringify(getValue(option))"
                :value="option"
                :text-value="getLabel(option)"
                class="mx-1 flex cursor-default select-none items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs text-gray-700 outline-none transition-colors data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900"
                :class="{ 'bg-blue-50/50': isSelected(option) }"
                @select.prevent="onSelect(option)"
              >
                <span class="truncate">{{ getLabel(option) }}</span>
                <Icon
                  v-if="isSelected(option)"
                  name="material-symbols:check-rounded"
                  class="size-4 shrink-0 text-blue-600"
                />
              </ComboboxItem>
            </template>

            <!-- No results -->
            <div v-else class="px-3 py-4 text-center text-xs text-gray-400">
              {{ noResultsText }}
            </div>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>
  </div>
</template>
