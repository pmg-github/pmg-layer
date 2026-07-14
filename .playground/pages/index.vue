<script setup lang="ts">
import Modal from "../../app/components/Modal.vue";

const counter = ref(0);
const isModalOpen = ref(false);

const increment = () => counter.value++;
const decrement = () => counter.value--;
</script>

<template>
  <div style="padding: 2rem">
    <h1>Layer Playground</h1>

    <BaseButton @click="increment">+</BaseButton>
    {{ counter }}
    <BaseButton variant="ghost" @click="decrement">-</BaseButton>
    <BaseButton class="ml-2" @click="isModalOpen = true">Open modal</BaseButton>

    <Modal
      :open="isModalOpen"
      title="Counter Modal"
      @update:open="isModalOpen = $event"
    >
      <p>Current counter: {{ counter }}</p>
      <template #footer>
        <div class="flex justify-end">
          <BaseButton variant="ghost" @click="isModalOpen = false"
            >Close</BaseButton
          >
        </div>
      </template>
    </Modal>
    <p>Today: {{ formatDate(new Date()) }}</p>
  </div>
</template>
