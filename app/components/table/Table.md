# PMG Table System

A modular, accessible, and strongly-typed table system for Nuxt and Vue 3.

The table system is organized into two distinct layers:

1. **Low-level Table Primitives (`PmgTable`)** — Direct 1:1 mapping to semantic HTML table elements (`<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<th>`, `<td>`, `<caption>`).
2. **High-level Data Table (`PmgDataTable`)** — Configuration-driven table with automatic markup generation, TypeScript generics, and granular scoped slot customization.

All components are auto-imported in consuming projects with the `PMG` / `Pmg` prefix:
`<PmgTable>`, `<PmgTableHeader>`, `<PmgTableBody>`, `<PmgTableFooter>`, `<PmgTableRow>`, `<PmgTableHead>`, `<PmgTableCell>`, `<PmgTableCaption>`, and `<PmgDataTable>`.

---

## When to Use What

| Feature / Requirement | `PmgTable` (Primitives)                                                     | `PmgDataTable` (High-Level)                                            |
| :-------------------- | :-------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **Primary Use Case**  | Custom layouts, static content, asymmetric grids, complex multi-row headers | Application data grids, lists, CRUD tables, API responses              |
| **Data Source**       | Manual markup via Vue template                                              | `rows` array and `columns` schema                                      |
| **Markup Control**    | 100% manual control over every `<tr>`, `<th>`, `<td>`                       | Auto-generated standard table structure                                |
| **Customization**     | Native template markup & standard Vue directives (`v-for`, `v-if`)          | Scoped dynamic slots (`#cell-{key}`, `#header-{key}`)                  |
| **State Handling**    | Custom markup for empty / loading                                           | Built-in `:loading` prop, `emptyText`, and `#empty` / `#loading` slots |

---

## 1. Low-Level Table Primitives

The low-level components wrap native HTML table elements to ensure semantic correctness, accessibility defaults, and consistent PMG styling while forwarding all native attributes.

### Component Mapping

| Component           | Semantic HTML Tag | Default Behavior / Role                                                      |
| :------------------ | :---------------- | :--------------------------------------------------------------------------- |
| `<PmgTable>`        | `<table>`         | Base table container with collapse, typography, and optional borders/stripes |
| `<PmgTableHeader>`  | `<thead>`         | Header group with muted background and uppercase typography                  |
| `<PmgTableBody>`    | `<tbody>`         | Body section with row dividers                                               |
| `<PmgTableFooter>`  | `<tfoot>`         | Footer section with top border and medium weight                             |
| `<PmgTableRow>`     | `<tr>`            | Table row with optional hover, selection, and interactive styles             |
| `<PmgTableHead>`    | `<th>`            | Header cell with default `scope="col"` and alignment options                 |
| `<PmgTableCell>`    | `<td>`            | Data cell with standard padding and alignment options                        |
| `<PmgTableCaption>` | `<caption>`       | Accessible table caption positioned at top or bottom                         |

### Props Reference (Primitives)

#### `PmgTable`

- `striped?: boolean` — Alternates row backgrounds (`default: false`).
- `hoverable?: boolean` — Enables hover highlight on body rows (`default: false`).
- `bordered?: boolean` — Adds outer border and subtle cell borders (`default: false`).
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
