<script setup lang="ts">
const counter = ref(0);
const increment = () => counter.value++;
const decrement = () => counter.value--;
</script>

<template>
  <div style="padding: 2rem">
    <h1>Layer Playground</h1>

    <BaseButton @click="increment">+</BaseButton>
    {{ counter }}
    <BaseButton variant="ghost" @click="decrement">-</BaseButton>

    <p>Today: {{ formatDate(new Date()) }}</p>
  </div>
</template>
