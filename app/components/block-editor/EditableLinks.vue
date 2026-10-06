<script setup lang="ts">
import EditorOnly from './EditorOnly.vue';
</script>

<template>
  <EditorOnly name="EditableLinks" v-bind="$attrs"><slot /></EditorOnly>
</template>
