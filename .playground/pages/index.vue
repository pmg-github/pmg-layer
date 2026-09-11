<script setup lang="ts">
import { useForm } from "vee-validate";
import * as yup from "yup";
const counter = ref(0);
const isModalOpen = ref(false);

const increment = () => counter.value++;
const decrement = () => counter.value--;

const fruitOptions = [
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Cherry", value: "cherry" },
  { label: "Date", value: "date" },
  { label: "Elderberry", value: "elderberry" },
];

const selectedFruit = ref<string | null>(null);
const selectedFruits = ref<string[]>([]);

const name = ref("");
const searchQuery = ref("");
const bio = ref("");
const notificationsEnabled = ref(false);
const agreedToTerms = ref(false);
const deliveryMethod = ref<string | null>("standard");

const deliveryOptions = [
  { label: "Standard", value: "standard" },
  { label: "Express", value: "express" },
  { label: "Overnight", value: "overnight" },
];

// vee-validate + yup demo: PMGInput registers itself via its `name` prop,
// no v-model needed — values/errors are managed by the surrounding form.
const validationSchema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  age: yup
    .number()
    .typeError("Age must be a number")
    .min(18, "You must be at least 18")
    .required("Age is required"),
});

const { handleSubmit, values: formValues } = useForm({
  validationSchema,
});

const onSubmit = handleSubmit((submittedValues) => {
  // eslint-disable-next-line no-console
  console.log("submitted", submittedValues);
});

// Table demo state & data
interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
}

const tableUsers = ref<UserItem[]>([
  {
    id: 1,
    name: "Alex Morgan",
    email: "alex@example.com",
    role: "Admin",
    status: "active",
  },
  {
    id: 2,
    name: "Sarah Connor",
    email: "sarah@example.com",
    role: "Editor",
    status: "active",
  },
  {
    id: 3,
    name: "James Wilson",
    email: "james@example.com",
    role: "Viewer",
    status: "pending",
  },
  {
    id: 4,
    name: "Elena Rostova",
    email: "elena@example.com",
    role: "Editor",
    status: "inactive",
  },
]);

const dataTableColumns = [
  { key: "name", label: "User Name" },
  { key: "email", label: "Email Address" },
  { key: "role", label: "System Role" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", align: "right" as const },
];

const isTableLoading = ref(false);
const emptyTableRows = ref<UserItem[]>([]);
</script>

<template>
  <div style="padding: 2rem">
    <h1>Layer Playground</h1>

    <PMGButton @click="increment">+</PMGButton>
    {{ counter }}
    <PMGButton variant="ghost" @click="decrement">-</PMGButton>
    <PMGButton class="ml-2" @click="isModalOpen = true">Open modal</PMGButton>

    <PMGModal
      :open="isModalOpen"
      title="Counter Modal"
      @update:open="isModalOpen = $event"
    >
      <p>Current counter: {{ counter }}</p>
      <template #footer>
        <div class="flex justify-end">
          <PMGButton variant="ghost" @click="isModalOpen = false"
            >Close</PMGButton
          >
        </div>
      </template>
    </PMGModal>

    <div class="mt-6 max-w-xs space-y-4">
      <PMGSelect
        v-model="selectedFruit"
        :options="fruitOptions"
        label="Favorite fruit"
        placeholder="Select a fruit"
        clearable
      />

      <PMGSelect
        v-model="selectedFruits"
        :options="fruitOptions"
        label="Favorite fruits (multiple)"
        placeholder="Select fruits"
        multiple
        searchable
        clearable
      />

      <p class="text-xs text-gray-500">
        Selected: {{ selectedFruit }} / {{ selectedFruits }}
      </p>

      <PMGInput
        v-model="name"
        label="Name"
        placeholder="Enter your name"
        clearable
      />

      <PMGInput
        v-model="searchQuery"
        type="search"
        label="Search"
        placeholder="Search..."
        clearable
      />

      <PMGTextarea
        v-model="bio"
        label="Bio"
        placeholder="Tell us about yourself"
      />

      <PMGSwitch v-model="notificationsEnabled" label="Enable notifications" />

      <PMGCheckbox v-model="agreedToTerms" label="I agree to the terms" />

      <PMGRadioGroup
        v-model="deliveryMethod"
        :options="deliveryOptions"
        label="Delivery method"
      />

      <p class="text-xs text-gray-500">
        Bio: {{ bio }} / Notifications: {{ notificationsEnabled }} / Agreed:
        {{ agreedToTerms }} / Delivery: {{ deliveryMethod }}
      </p>
    </div>

    <form class="mt-6 max-w-xs space-y-4" @submit.prevent="onSubmit">
      <h2>vee-validate + yup demo</h2>

      <PMGInput
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        required
      />

      <PMGInput
        name="age"
        type="number"
        label="Age"
        placeholder="18"
        required
      />

      <PMGButton type="submit">Submit</PMGButton>

      <ClientOnly>
        <pre class="text-xs text-gray-500">{{ formValues }}</pre>
      </ClientOnly>
    </form>

    <p>Today: {{ formatDate(new Date()) }}</p>

    <div class="mt-12 max-w-4xl space-y-10 border-t pt-8">
      <h2 class="text-2xl font-bold text-gray-900">Table System Demos</h2>

      <!-- 1. Low-level Table Primitives -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold text-gray-800">
          1. Low-Level Table Primitives (PMGTable)
        </h3>
        <p class="text-xs text-gray-500">
          Direct semantic HTML control with default PMG styling.
        </p>

        <div class="overflow-x-auto rounded-lg border border-gray-200">
          <PMGTable hoverable>
            <PMGTableCaption>Active team members</PMGTableCaption>
            <PMGTableHeader>
              <PMGTableRow>
                <PMGTableHead>Name</PMGTableHead>
                <PMGTableHead>Email</PMGTableHead>
                <PMGTableHead>Role</PMGTableHead>
                <PMGTableHead align="right">Status</PMGTableHead>
              </PMGTableRow>
            </PMGTableHeader>
            <PMGTableBody>
              <PMGTableRow v-for="user in tableUsers" :key="user.id">
                <PMGTableCell class="font-medium text-gray-900">
                  {{ user.name }}
                </PMGTableCell>
                <PMGTableCell>{{ user.email }}</PMGTableCell>
                <PMGTableCell>{{ user.role }}</PMGTableCell>
                <PMGTableCell align="right">
                  <span
                    class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                    :class="{
                      'bg-green-100 text-green-700': user.status === 'active',
                      'bg-amber-100 text-amber-700': user.status === 'pending',
                      'bg-gray-100 text-gray-600': user.status === 'inactive',
                    }"
                  >
                    {{ user.status }}
                  </span>
                </PMGTableCell>
              </PMGTableRow>
            </PMGTableBody>
          </PMGTable>
        </div>
      </section>

      <!-- 2. High-Level PMGDataTable with Scoped Slots -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold text-gray-800">
          2. High-Level Data Table (PMGDataTable) with Scoped Slots
        </h3>
        <p class="text-xs text-gray-500">
          Data-driven table with custom #cell-name, #cell-status, and
          #cell-actions templates.
        </p>

        <div class="rounded-lg border border-gray-200 bg-white">
          <PMGDataTable
            :rows="tableUsers"
            :columns="dataTableColumns"
            row-key="id"
            hoverable
          >
            <template #cell-name="{ row, value }">
              <div class="flex items-center gap-2">
                <div
                  class="flex size-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700"
                >
                  {{ row.name.charAt(0) }}
                </div>
                <span class="font-medium text-gray-900">{{ value }}</span>
              </div>
            </template>

            <template #cell-status="{ value }">
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="{
                  'bg-green-100 text-green-700': value === 'active',
                  'bg-amber-100 text-amber-700': value === 'pending',
                  'bg-gray-100 text-gray-600': value === 'inactive',
                }"
              >
                {{ value }}
              </span>
            </template>

            <template #cell-actions="{ row }">
              <PMGButton
                size="sm"
                variant="ghost"
                @click="alert(`Edit user: ${row.name}`)"
              >
                Edit
              </PMGButton>
            </template>
          </PMGDataTable>
        </div>
      </section>

      <!-- 3. Empty & Loading State Demos -->
      <section class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">
          3. Empty State & Loading States
        </h3>
        <div class="flex gap-2">
          <PMGButton
            size="sm"
            variant="secondary"
            @click="isTableLoading = !isTableLoading"
          >
            Toggle Loading State ({{ isTableLoading ? "ON" : "OFF" }})
          </PMGButton>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white">
          <PMGDataTable
            :rows="emptyTableRows"
            :columns="dataTableColumns"
            :loading="isTableLoading"
            empty-text="No team members found. Click 'Add Member' to create one."
          />
        </div>
      </section>
    </div>

    <PMGTest video-id="EDBbe2052V05" />
  </div>
</template>
