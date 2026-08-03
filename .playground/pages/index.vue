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
  </div>
</template>
