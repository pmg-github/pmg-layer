<script setup lang="ts">
import EditorOnly from './EditorOnly.vue';
</script>

<template>
  <EditorOnly name="LinkReferenceSelect" v-bind="$attrs"><slot /></EditorOnly>
</template>
