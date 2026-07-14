<script setup lang="ts">
const { count, increment, decrement } = useLayerCounter(0)
</script>

<template>
  <div style="padding: 2rem;">
    <h1>Layer Playground</h1>

    <p>Count: {{ count }}</p>
    <BaseButton @click="increment">+</BaseButton>
    <BaseButton variant="ghost" @click="decrement">-</BaseButton>

    <p>Today: {{ formatDate(new Date()) }}</p>
  </div>
</template>
