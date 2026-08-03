# PMGSelect

Universal select/combobox component intended to replace ad-hoc select
implementations in consuming projects (e.g. custom `Select`, `SelectSm`,
`Dropdown`, `MultiSelect`, `Multi` form components, etc.).

Built on **Reka UI** `ComboboxRoot` primitives. Source lives at
[Select.vue](./Select.vue) in this layer and is auto-imported as
`<PMGSelect>` (prefix `PMG`, no path segment) via the `components` entry in
[nuxt.config.ts](../../../nuxt.config.ts).

---

## Core Principles

1. **`v-model` is always the raw value** — a primitive (`string`, `number`), an array of primitives (for multi-select), or any serializable value (including arrays-as-values like `['nl', 'fr']`).
2. **Display logic lives in the options source** — the component looks up the label from the loaded options list using the value. The entity API never needs to return display labels.
3. **One function per data mode** — `options` for static lists, `fetch` for async search, `resolve` for initial value resolution.
4. **`optionLabel` / `optionValue` accessors** eliminate the need for multiple API endpoints returning different shapes. You remap at the component level.

---

## Props Reference

| Prop             | Type                                                   | Default                             | Description                                                                                                                                                          |
| ---------------- | ------------------------------------------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v-model`        | `V \| V[] \| null`                                     | `null`                              | The selected value(s). Raw value for single, array for multi.                                                                                                        |
| `options`        | `T[]`                                                  | —                                   | Static list of options. Loaded immediately.                                                                                                                          |
| `fetch`          | `(query: string, signal: AbortSignal) => Promise<T[]>` | —                                   | Async function for server-side search. Called on dropdown open (lazy) and on search input (debounced). Signal can be forwarded to `$fetch` for request cancellation. |
| `resolve`        | `(values: V \| V[]) => Promise<T[]>`                   | —                                   | Resolves initial values to option objects on mount. Used for edit pages where you need to display labels for pre-selected values from a search-only endpoint.        |
| `optionLabel`    | `(option: T) => string`                                | Auto-detects `key` or `label` field | Extracts display text from an option.                                                                                                                                |
| `optionValue`    | `(option: T) => V`                                     | Auto-detects `value` or `id` field  | Extracts the raw value from an option.                                                                                                                               |
| `searchable`     | `boolean`                                              | `false`                             | Show search input in the trigger area.                                                                                                                               |
| `multiple`       | `boolean`                                              | `false`                             | Allow selecting multiple values. Shows tags.                                                                                                                         |
| `clearable`      | `boolean`                                              | `false`                             | Show a clear (×) button.                                                                                                                                             |
| `disabled`       | `boolean`                                              | `false`                             | Disable the select.                                                                                                                                                  |
| `required`       | `boolean`                                              | `false`                             | Show required indicator (\*) on label.                                                                                                                               |
| `label`          | `string`                                               | —                                   | Label text above the select.                                                                                                                                         |
| `placeholder`    | `string`                                               | `'Selecteer...'` / `'Zoeken...'`    | Placeholder text.                                                                                                                                                    |
| `displayValue`   | `string`                                               | —                                   | Fallback display string when value can't be matched against options.                                                                                                 |
| `searchDebounce` | `number`                                               | `300`                               | Debounce delay (ms) for search input when using `fetch`.                                                                                                             |
| `noResultsText`  | `string`                                               | `'Geen resultaten'`                 | Text shown when no options match.                                                                                                                                    |
| `loadingText`    | `string`                                               | `'Laden...'`                        | Text shown during loading.                                                                                                                                           |

## Events

| Event               | Payload            | Description                                                      |
| ------------------- | ------------------ | ---------------------------------------------------------------- |
| `update:modelValue` | `V \| V[] \| null` | Standard v-model event.                                          |
| `change`            | `V \| V[] \| null` | Emitted on selection change (same payload as modelValue update). |

---

## Usage Patterns

### 1. Static options (simplest)

Use when the full list is available upfront (pre-fetched via `useAsyncData` or hardcoded).

```vue
<PMGSelect
  v-model="store.metaData.statusId"
  :options="statuses || []"
  :option-label="(o) => o.key"
  :option-value="(o) => o.value"
  label="Status"
  placeholder="Kies een status"
/>
```

**Behavior:**

- Options loaded immediately on mount
- Value matched against options via deep comparison
- Client-side filtering when `searchable` is enabled

### 2. Static options with search (client-side filtering)

```vue
<PMGSelect
  v-model="selectedPortalCode"
  :options="portals || []"
  :option-label="(o) => o.key"
  :option-value="(o) => o.value"
  label="Portaal"
  searchable
  clearable
/>
```

### 3. Multi-select with static options

```vue
<PMGSelect
  v-model="selectedLanguages"
  :options="[
    { key: 'Nederlands', value: 'nl' },
    { key: 'Frans', value: 'fr' },
    { key: 'Engels', value: 'en' },
  ]"
  :option-label="(o) => o.key"
  :option-value="(o) => o.value"
  label="Talen"
  multiple
  clearable
/>
```

**`v-model` is a `string[]`** like `['nl', 'fr']`. Selected items show as removable tags.

### 4. Async search (server-side filtering)

Use when the list is too large to load fully. The `fetch` function is called:

- Once on first dropdown open with `''` (empty query)
- On every search keystroke (debounced, 300ms default)

```vue
<PMGSelect
  v-model="store.metaData.customerReference"
  :fetch="(q) => getCustomerReferences({ query: q })"
  :option-label="(o) => o.key"
  :option-value="(o) => o.value"
  label="Klant"
  searchable
  clearable
/>
```

**Behavior:**

- Lazy: no fetch until dropdown opens
- Debounced: waits 300ms after typing stops
- Stale responses discarded via internal sequence counter
- Optional: forward `signal` for true network-level abort (see below)

### 5. Async search with AbortController (network-level cancellation)

For expensive endpoints, forward the signal to cancel in-flight requests:

```vue
<PMGSelect
  v-model="store.metaData.customerReference"
  :fetch="(q, signal) => getCustomerReferences({ query: q }, { signal })"
  :option-label="(o) => o.key"
  :option-value="(o) => o.value"
  label="Klant"
  searchable
/>
```

Your composable accepts and forwards it:

```ts
const getCustomerReferences = (params, opts?: { signal?: AbortSignal }) => {
  return api("/api/filters/customers", { params, signal: opts?.signal });
};
```

If you don't forward the signal, stale responses are still safely discarded client-side.

### 6. Async search + resolve (edit pages with pre-selected values)

On edit pages, you need to display labels for already-selected values immediately. The `resolve` prop handles this:

```vue
<PMGSelect
  v-model="store.metaData.interestIds"
  :fetch="(q) => getInteresses({ query: q })"
  :resolve="(values) => getInteresses({ ids: values })"
  :option-label="(o) => o.key"
  :option-value="(o) => o.value"
  label="Interesses"
  searchable
  multiple
  clearable
/>
```

**Behavior:**

- On mount: calls `resolve(modelValue)` → gets option objects → displays labels/tags instantly
- On dropdown open: calls `fetch('')` for search list
- On search: calls `fetch(query)` debounced

The `resolve` function receives:

- **Single select:** the raw value (e.g., `'ABC123'`)
- **Multi select:** the array of values (e.g., `[3, 7, 12]`)

It must return a `Promise<T[]>` — the resolved option objects.

### 7. Values that are arrays/objects (non-primitive)

The component supports any value type via deep comparison (`JSON.stringify`). Example where each option's value is an array:

```vue
<PMGSelect
  v-model="selectedLanguage"
  :options="[
    { key: 'Enkel Nederlands', value: ['nl'] },
    { key: 'Nederlands en Frans', value: ['nl', 'fr'] },
  ]"
  :option-label="(o) => o.key"
  :option-value="(o) => o.value"
  label="Taal"
/>
```

Here `selectedLanguage` would be `['nl', 'fr']` — NOT to be confused with multi-select. This is a **single select** where the value happens to be an array.

---

## Migration Guide (for consuming projects)

If a consuming project has its own legacy select components, they typically map
onto `PMGSelect` as follows. Adjust names/paths to whatever that project
actually calls its old components.

### Replacing a legacy `Select` (object-based `v-model`)

**Before:**

```vue
<LegacySelect
  v-model:selected="selectedItem"
  label="Label"
  :itemList="items"
  :show-full-list="true"
  placeholder="Kies..."
/>
```

**After:**

```vue
<PMGSelect
  v-model="selectedItemValue"
  :options="items"
  :option-label="(o) => o.key"
  :option-value="(o) => o.value"
  label="Label"
  placeholder="Kies..."
/>
```

**Key differences:**

1. `v-model:selected` → `v-model` (standard v-model)
2. The ref changes from holding a full object `{ key, value }` to holding just the raw value
3. Update all places that read `selectedItem.value?.value` to just `selectedItemValue.value`
4. Update resets from `selectedItem.value = fullObject` to `selectedItemValue.value = rawValue`
5. `:itemList` → `:options`
6. `:show-full-list` → not needed (default behavior shows full list)
7. Add `:option-label` and `:option-value` accessors

### Replacing a legacy `Select` with async `fetchData`

**Before:**

```vue
<LegacySelect
  v-model:selected="selectedCustomer"
  label="Klant"
  search-in-data
  placeholder="Zoek klant..."
  :fetch-data="(data) => getCustomers({ query: data.query })"
/>
```

**After:**

```vue
<PMGSelect
  v-model="selectedCustomerValue"
  :fetch="(q) => getCustomers({ query: q })"
  :option-label="(o) => o.key"
  :option-value="(o) => o.value"
  label="Klant"
  searchable
  placeholder="Zoek klant..."
/>
```

**Key differences:**

1. `search-in-data` → `searchable` (search is always server-side when `fetch` is provided)
2. `:fetch-data="(data) => fn({ query: data.query })"` → `:fetch="(q) => fn({ query: q })"`
3. Same v-model changes as above (raw value instead of object)

### Replacing a legacy multi-select with `fetchData` + `selectedFetchData` (resolve)

**Before:**

```vue
<LegacyFormMulti
  v-model:selected="selectedIds"
  :fetch-data="(data) => searchItems({ query: data.query })"
  :selected-fetch-data="(ids) => getItemsByIds(ids)"
  search-in-data
  label="Items"
/>
```

**After:**

```vue
<PMGSelect
  v-model="selectedIds"
  :fetch="(q) => searchItems({ query: q })"
  :resolve="(values) => getItemsByIds(values)"
  :option-label="(o) => o.key"
  :option-value="(o) => o.value"
  label="Items"
  searchable
  multiple
/>
```

### Replacing a legacy multi-select component

**Before:**

```vue
<LegacyMultiSelect
  :item-list="portals || []"
  label="Portaal"
  v-model:selected="selectedPortalCodes"
/>
```

**After:**

```vue
<PMGSelect
  v-model="selectedPortalCodes"
  :options="portals || []"
  :option-label="(o) => o.key"
  :option-value="(o) => o.value"
  label="Portaal"
  multiple
/>
```

**Note:** Legacy multi-select components often already use raw value arrays for
`v-model` (arrays of `value` fields). So the v-model binding usually stays the
same — just verify the ref holds `string[]` or `number[]`.

### Replacing a legacy status/tag `Dropdown` (color-mapped)

`PMGSelect` does not currently support color mapping per option. Keep using a
dedicated status/tag dropdown component for colored badges until color support
is added, OR migrate if colors aren't needed:

**Before:**

```vue
<LegacyStatusDropdown
  v-model="store.metaData.typeId"
  :options="types || []"
  default-color="blue"
  @update="updateType"
/>
```

**After:**

```vue
<PMGSelect
  v-model="store.metaData.typeId"
  :options="types || []"
  :option-label="(o) => o.key"
  :option-value="(o) => o.value"
  @change="updateType"
/>
```

**Note:** The `@update` event becomes `@change`. The payload is the raw value,
not the full option object. If you need the full option (e.g., for
`option.tags`), find it from the options list:

```ts
const handleTypeChange = (value: number) => {
  const option = types.value?.find((t) => t.value === value);
  // use option.tags, option.description, etc.
};
```

---

## Internal Behavior

### Value resolution priority

1. Match `modelValue` against `options` prop (static)
2. Match `modelValue` against fetched results (from `fetch`)
3. Match `modelValue` against resolved results (from `resolve`)
4. Show `displayValue` string (if provided)
5. Show empty/placeholder

### Fetch lifecycle

- **Static (`options` prop):** Loaded into internal state on mount. Updated reactively when prop changes.
- **Async (`fetch` prop):** First call on dropdown open (lazy). Subsequent calls on search input (debounced). Previous in-flight requests are superseded (sequence counter + optional AbortController).
- **Resolve (`resolve` prop):** Called once on mount when `modelValue` is non-null and no matching option is found. Re-called when `modelValue` changes externally to unknown values.

### Deep comparison

All value matching uses `JSON.stringify` deep comparison. This means:

- Primitive values (`number`, `string`) work as expected
- Array values (like `['nl', 'fr']`) work correctly
- Object values work as long as key order is consistent
- `null` and `undefined` are handled safely

---

## Component Name in Templates

Due to this layer's `components` config (`prefix: "PMG"`, `pathPrefix: false`),
use:

```vue
<PMGSelect ... />
```

This resolves to [Select.vue](./Select.vue) regardless of which project
extends this layer.
