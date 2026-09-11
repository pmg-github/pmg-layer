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

// Table demo data
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

    <div class="mt-12 max-w-4xl space-y-6 border-t pt-8">
      <h2 class="text-2xl font-bold text-gray-900">PMGTable Demo</h2>
      <p class="text-xs text-gray-500">
        Semantic HTML table primitives with PMG styling and accessibility
        defaults.
      </p>

      <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <PMGTable hoverable>
          <PMGTableCaption>Active team members directory</PMGTableCaption>
          <PMGTableHeader>
            <PMGTableRow>
              <PMGTableHead class="w-64">Name</PMGTableHead>
              <PMGTableHead class="min-w-[200px]">Email</PMGTableHead>
              <PMGTableHead class="w-32">Role</PMGTableHead>
              <PMGTableHead class="w-28">Status</PMGTableHead>
              <PMGTableHead align="right" width="100px">Actions</PMGTableHead>
            </PMGTableRow>
          </PMGTableHeader>
          <PMGTableBody>
            <PMGTableRow v-for="user in tableUsers" :key="user.id">
              <PMGTableCell class="font-medium text-gray-900">
                {{ user.name }}
              </PMGTableCell>
              <PMGTableCell>{{ user.email }}</PMGTableCell>
              <PMGTableCell>{{ user.role }}</PMGTableCell>
              <PMGTableCell>
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
              <PMGTableCell align="right">
                <PMGButton size="sm" variant="ghost">Edit</PMGButton>
              </PMGTableCell>
            </PMGTableRow>
          </PMGTableBody>
        </PMGTable>
      </div>
    </div>

    <PMGTest video-id="EDBbe2052V05" />
  </div>
</template>
