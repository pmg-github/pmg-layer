<script setup lang="ts">
import EditorOnly from './EditorOnly.vue';
</script>

<template>
  <EditorOnly name="ImageManager" v-bind="$attrs"><slot /></EditorOnly>
</template>
