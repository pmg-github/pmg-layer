<script setup lang="ts">
import EditorOnly from './EditorOnly.vue';
</script>

<template>
  <EditorOnly name="EditableIcon" v-bind="$attrs"><slot /></EditorOnly>
</template>
