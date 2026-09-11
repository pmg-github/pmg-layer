# PMG Table System

Semantic, lightweight table primitives for Nuxt and Vue 3.

Each component maps 1:1 to a standard HTML table element, providing PMG design system styling, accessibility defaults (e.g. `scope="col"` on headers), and class customization via `tailwind-merge`.

All components are auto-imported in consuming projects with the `PMG` / `Pmg` prefix:

- `<PMGTable>` → `<table>`
- `<PMGTableHeader>` → `<thead>`
- `<PMGTableBody>` → `<tbody>`
- `<PMGTableFooter>` → `<tfoot>`
- `<PMGTableRow>` → `<tr>`
- `<PMGTableHead>` → `<th>`
- `<PMGTableCell>` → `<td>`
- `<PMGTableCaption>` → `<caption>`

---

## Component Reference

### `<PMGTable>`

Base table container.

| Prop        | Type      | Default | Description                                                                               |
| :---------- | :-------- | :------ | :---------------------------------------------------------------------------------------- |
| `fixed`     | `boolean` | `false` | Sets `table-fixed` (vs `table-auto`), enforcing strict column widths set on header cells. |
| `striped`   | `boolean` | `false` | Alternates background color on even body rows.                                            |
| `hoverable` | `boolean` | `false` | Adds hover highlight across body rows.                                                    |
| `bordered`  | `boolean` | `false` | Adds subtle outer and cell borders.                                                       |
| `dense`     | `boolean` | `false` | Reduces padding for compact data presentation.                                            |
| `class`     | `any`     | —       | Additional CSS classes.                                                                   |

### `<PMGTableHeader>`

Header section (`<thead>`).

| Prop     | Type      | Default | Description                                            |
| :------- | :-------- | :------ | :----------------------------------------------------- |
| `sticky` | `boolean` | `false` | Sticky positioning at the top of the scroll container. |
| `class`  | `any`     | —       | Additional CSS classes.                                |

### `<PMGTableBody>`

Body section (`<tbody>`) with row dividers.

| Prop    | Type  | Default | Description             |
| :------ | :---- | :------ | :---------------------- |
| `class` | `any` | —       | Additional CSS classes. |

### `<PMGTableFooter>`

Footer section (`<tfoot>`) with top border.

| Prop    | Type  | Default | Description             |
| :------ | :---- | :------ | :---------------------- |
| `class` | `any` | —       | Additional CSS classes. |

### `<PMGTableRow>`

Table row (`<tr>`).

| Prop          | Type      | Default | Description                                                   |
| :------------ | :-------- | :------ | :------------------------------------------------------------ |
| `selected`    | `boolean` | `false` | Sets active selection background and `data-state="selected"`. |
| `hoverable`   | `boolean` | `true`  | Enables hover highlight on the row.                           |
| `interactive` | `boolean` | `false` | Shows pointer cursor and active press state.                  |
| `class`       | `any`     | —       | Additional CSS classes.                                       |

### `<PMGTableHead>`

Header cell (`<th>`). In HTML tables, setting a width/minWidth prop or class (e.g. `w-48`, `min-w-[200px]`, `w-1/4`) on `<PMGTableHead>` automatically defines the width for every `<PMGTableCell>` in that column without repeating it per row.

| Prop       | Type                            | Default  | Description                                                                     |
| :--------- | :------------------------------ | :------- | :------------------------------------------------------------------------------ |
| `width`    | `string \| number`              | —        | Explicit column width (e.g., `'240px'`, `'30%'`, `200`).                        |
| `minWidth` | `string \| number`              | —        | Explicit column min-width (e.g., `'150px'`, `'12rem'`, `150`).                  |
| `scope`    | `string`                        | `'col'`  | Accessible scope attribute (`col`, `row`, etc.).                                |
| `align`    | `'left' \| 'center' \| 'right'` | `'left'` | Text alignment.                                                                 |
| `class`    | `any`                           | —        | Additional CSS classes (e.g. `w-64`, `min-w-[200px]`, `w-1/3`, `truncate`, etc). |

### `<PMGTableCell>`

Data cell (`<td>`).

| Prop    | Type                            | Default  | Description             |
| :------ | :------------------------------ | :------- | :---------------------- |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Text alignment.         |
| `class` | `any`                           | —        | Additional CSS classes. |

### `<PMGTableCaption>`

Accessible table caption (`<caption>`).

| Prop    | Type                | Default    | Description             |
| :------ | :------------------ | :--------- | :---------------------- |
| `side`  | `'top' \| 'bottom'` | `'bottom'` | Caption position.       |
| `class` | `any`               | —          | Additional CSS classes. |

---

## Usage Example

```vue
<script setup lang="ts">
const users = [
  {
    id: 1,
    name: "Alex Morgan",
    email: "alex@example.com",
    role: "Admin",
    status: "Active",
  },
  {
    id: 2,
    name: "Sarah Connor",
    email: "sarah@example.com",
    role: "Editor",
    status: "Active",
  },
  {
    id: 3,
    name: "James Wilson",
    email: "james@example.com",
    role: "Viewer",
    status: "Pending",
  },
];
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-gray-200">
    <PMGTable hoverable>
      <PMGTableCaption>Team members directory</PMGTableCaption>

      <PMGTableHeader>
        <PMGTableRow>
          <PMGTableHead>Name</PMGTableHead>
          <PMGTableHead>Email</PMGTableHead>
          <PMGTableHead>Role</PMGTableHead>
          <PMGTableHead>Status</PMGTableHead>
          <PMGTableHead align="right">Actions</PMGTableHead>
        </PMGTableRow>
      </PMGTableHeader>

      <PMGTableBody>
        <PMGTableRow v-for="user in users" :key="user.id">
          <PMGTableCell class="font-medium text-gray-900">
            {{ user.name }}
          </PMGTableCell>
          <PMGTableCell>{{ user.email }}</PMGTableCell>
          <PMGTableCell>{{ user.role }}</PMGTableCell>
          <PMGTableCell>
            <span
              class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="
                user.status === 'Active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              "
            >
              {{ user.status }}
            </span>
          </PMGTableCell>
          <PMGTableCell align="right">
            <PMGButton size="sm" variant="ghost">Edit</PMGButton>
          </PMGTableCell>
        </PMGTableRow>
      </PMGTableBody>
    </PMGTable>
  </div>
</template>
```

- `dense?: boolean` — Reduces padding for compact datasets (`default: false`).

#### `PmgTableHeader`

- `sticky?: boolean` — Sticky positioning at top of scroll viewport (`default: false`).

#### `PmgTableRow`

- `selected?: boolean` — Sets selection style and `data-state="selected"` (`default: false`).
- `hoverable?: boolean` — Enables row hover effect (`default: true`).
- `interactive?: boolean` — Adds pointer cursor and active press feedback (`default: false`).

#### `PmgTableHead`

- `scope?: string` — Native scope attribute (`default: 'col'`).
- `align?: 'left' | 'center' | 'right'` — Text alignment (`default: 'left'`).

#### `PmgTableCell`

- `align?: 'left' | 'center' | 'right'` — Text alignment (`default: 'left'`).

#### `PmgTableCaption`

- `side?: 'top' | 'bottom'` — Caption position (`default: 'bottom'`).

### Primitives Example

```vue
<template>
  <div class="overflow-x-auto">
    <PmgTable hoverable bordered>
      <PmgTableCaption>Registered system administrators</PmgTableCaption>

      <PmgTableHeader>
        <PmgTableRow>
          <PmgTableHead>Name</PmgTableHead>
          <PmgTableHead>Email</PmgTableHead>
          <PmgTableHead>Role</PmgTableHead>
          <PmgTableHead align="right">Actions</PmgTableHead>
        </PmgTableRow>
      </PmgTableHeader>

      <PmgTableBody>
        <PmgTableRow v-for="user in users" :key="user.id">
          <PmgTableCell class="font-medium text-gray-900">
            {{ user.name }}
          </PmgTableCell>
          <PmgTableCell>{{ user.email }}</PmgTableCell>
          <PmgTableCell>
            <span
              class="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700"
            >
              {{ user.role }}
            </span>
          </PmgTableCell>
          <PmgTableCell align="right">
            <PmgButton size="sm" variant="ghost" @click="editUser(user)">
              Edit
            </PmgButton>
          </PmgTableCell>
        </PmgTableRow>
      </PmgTableBody>
    </PmgTable>
  </div>
</template>
```

---

## 2. High-Level `PmgDataTable`

`PmgDataTable` provides a high-level, declarative API for rendering data-driven tables. Internally, it renders the semantic `PmgTable` primitives, keeping markup clean and accessible.

### TypeScript Types

Import types directly from `#imports`, `~/types/table`, or the layer package:

```ts
import type { PmgTableColumn, PmgRowKey, TableAlign } from "~/types/table";

export interface PmgTableColumn<T = any> {
  key: (keyof T & string) | string;
  label?: string;
  align?: "left" | "center" | "right";
  width?: string;
  minWidth?: string;
  sortable?: boolean;
  hideable?: boolean;
  headerClass?: string;
  cellClass?: string;
  [key: string]: any;
}
```

### Props Reference (`PmgDataTable`)

| Prop              | Type                                                                 | Default               | Description                                                  |
| :---------------- | :------------------------------------------------------------------- | :-------------------- | :----------------------------------------------------------- |
| `columns`         | `PmgTableColumn<T>[]`                                                | **Required**          | Column definitions array.                                    |
| `rows`            | `T[]`                                                                | `[]`                  | Array of row data objects.                                   |
| `rowKey`          | `keyof T \| string \| ((row: T, index: number) => string \| number)` | `'id'`                | Unique key for `v-for` tracking.                             |
| `loading`         | `boolean`                                                            | `false`               | When true, renders loading indicator row or `#loading` slot. |
| `loadingText`     | `string`                                                             | `'Loading...'`        | Default text shown during loading state.                     |
| `emptyText`       | `string`                                                             | `'No data available'` | Default text shown when `rows` is empty.                     |
| `caption`         | `string`                                                             | `undefined`           | Caption text rendered above or below table.                  |
| `captionSide`     | `'top' \| 'bottom'`                                                  | `'bottom'`            | Caption placement.                                           |
| `striped`         | `boolean`                                                            | `false`               | Alternates row background colors.                            |
| `hoverable`       | `boolean`                                                            | `true`                | Highlights rows on hover.                                    |
| `bordered`        | `boolean`                                                            | `false`               | Outer and cell borders.                                      |
| `dense`           | `boolean`                                                            | `false`               | Compact row and cell padding.                                |
| `interactiveRows` | `boolean`                                                            | `false`               | Sets pointer cursor and emits `@rowClick`.                   |
| `wrapperClass`    | `any`                                                                | `undefined`           | Custom CSS class on outer scroll container.                  |
| `tableClass`      | `any`                                                                | `undefined`           | Custom CSS class on `<table>`.                               |
| `headerClass`     | `any`                                                                | `undefined`           | Custom CSS class on `<thead>`.                               |
| `bodyClass`       | `any`                                                                | `undefined`           | Custom CSS class on `<tbody>`.                               |
| `rowClass`        | `any \| ((row: T, index: number) => any)`                            | `undefined`           | Static class or dynamic callback per row.                    |

### Events

| Event       | Payload                                      | Description                          |
| :---------- | :------------------------------------------- | :----------------------------------- |
| `@rowClick` | `(row: T, index: number, event: MouseEvent)` | Emitted when a table row is clicked. |

### Scoped Slots

`PmgDataTable` uses a clear fallback hierarchy for cell and header rendering:

#### Cell Slot Resolution Order:

1. **Specific dynamic slot:** `#cell-{columnKey}="{ row, value, column, index }"`
2. **Generic fallback slot:** `#cell="{ row, value, column, index }"`
3. **Default text rendering:** Formatted value (`getCellValue(row, column.key)` supporting dot notation like `user.profile.name`).

#### Header Slot Resolution Order:

1. **Specific dynamic slot:** `#header-{columnKey}="{ column, index }"`
2. **Generic fallback slot:** `#header="{ column, index }"`
3. **Default label rendering:** `column.label ?? column.key`

#### State & Structure Slots:

- `#loading` — Custom loading state markup (replaces tbody content).
- `#empty` — Custom empty state markup (replaces tbody content).
- `#caption` — Custom caption content.
- `#footer="{ columns, rows }"` — Custom `<tfoot>` content.

---

## 3. Usage Examples

### A. Simple Table

```vue
<script setup lang="ts">
import type { PmgTableColumn } from "~/types/table";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const columns: PmgTableColumn<User>[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
];

const users: User[] = [
  { id: 1, name: "Alex Morgan", email: "alex@example.com", role: "Admin" },
  { id: 2, name: "Sarah Connor", email: "sarah@example.com", role: "Editor" },
  { id: 3, name: "James Wilson", email: "james@example.com", role: "Viewer" },
];
</script>

<template>
  <PmgDataTable :rows="users" :columns="columns" row-key="id" />
</template>
```

### B. Custom Cell Templates & Actions

```vue
<script setup lang="ts">
import type { PmgTableColumn } from "~/types/table";

interface Product {
  id: string;
  title: string;
  price: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  rating: number;
}

const columns: PmgTableColumn<Product>[] = [
  { key: "title", label: "Product" },
  { key: "price", label: "Price", align: "right" },
  { key: "status", label: "Inventory" },
  { key: "actions", label: "", align: "right", width: "120px" },
];

const products: Product[] = [
  {
    id: "p1",
    title: "Wireless Keyboard",
    price: 79.99,
    status: "in_stock",
    rating: 4.8,
  },
  {
    id: "p2",
    title: "Ergonomic Mouse",
    price: 49.5,
    status: "low_stock",
    rating: 4.5,
  },
];

function editProduct(product: Product) {
  console.log("Editing", product);
}
</script>

<template>
  <PmgDataTable :rows="products" :columns="columns" row-key="id" bordered>
    <!-- Custom Price Formatting -->
    <template #cell-price="{ value }">
      <span class="font-mono font-medium">${{ Number(value).toFixed(2) }}</span>
    </template>

    <!-- Custom Status Badge -->
    <template #cell-status="{ value }">
      <span
        class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
        :class="{
          'bg-green-50 text-green-700': value === 'in_stock',
          'bg-amber-50 text-amber-700': value === 'low_stock',
          'bg-red-50 text-red-700': value === 'out_of_stock',
        }"
      >
        {{ value.replace("_", " ") }}
      </span>
    </template>

    <!-- Action Buttons -->
    <template #cell-actions="{ row }">
      <PmgButton size="sm" variant="ghost" @click="editProduct(row)">
        Edit
      </PmgButton>
    </template>
  </PmgDataTable>
</template>
```

### C. Empty & Loading States

```vue
<script setup lang="ts">
import type { PmgTableColumn } from "~/types/table";

const columns: PmgTableColumn[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
];

const loading = ref(false);
const items = ref([]);
</script>

<template>
  <div class="space-y-4">
    <!-- Default Empty State -->
    <PmgDataTable
      :rows="[]"
      :columns="columns"
      empty-text="No records found matching your filters."
    />

    <!-- Custom Empty Slot -->
    <PmgDataTable :rows="[]" :columns="columns">
      <template #empty>
        <PmgTableRow :hoverable="false">
          <PmgTableCell :colspan="columns.length" class="py-12 text-center">
            <p class="text-base font-semibold text-gray-900">
              No results found
            </p>
            <p class="mt-1 text-sm text-gray-500">
              Try adjusting your search terms or filters.
            </p>
            <div class="mt-4">
              <PmgButton size="sm" variant="primary">Create New Item</PmgButton>
            </div>
          </PmgTableCell>
        </PmgTableRow>
      </template>
    </PmgDataTable>

    <!-- Loading State -->
    <PmgDataTable
      :rows="items"
      :columns="columns"
      :loading="loading"
      loading-text="Fetching latest updates..."
    />
  </div>
</template>
```

---

## 4. Accessibility & Best Practices

1. **Native Semantic HTML:** All components use standard `<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<th>`, `<td>`, `<caption>` elements — no `<div>` replacement.
2. **Column & Row Scopes:** `PmgTableHead` applies `scope="col"` by default. If a cell serves as a row header, use `<PmgTableHead scope="row">`.
3. **Colspan in State Rows:** Loading and empty rows calculate `:colspan="columns.length"` automatically so screen readers and table layout engines parse single full-width state messages properly.
4. **Interactive Rows:** When `@rowClick` is used or `interactive-rows` is set, rows are styled for interactive discovery without breaking table DOM structure.
