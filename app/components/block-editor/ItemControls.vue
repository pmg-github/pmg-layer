<script setup lang="ts">
import EditorOnly from './EditorOnly.vue';
</script>

<template>
  <EditorOnly name="ItemControls" v-bind="$attrs">
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps || {}" />
    </template>
  </EditorOnly>
</template>
