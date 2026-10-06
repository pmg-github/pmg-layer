<script setup lang="ts">
import EditorOnly from './EditorOnly.vue';
</script>

<template>
  <EditorOnly name="SelectionFrame" v-bind="$attrs"><slot /></EditorOnly>
</template>
