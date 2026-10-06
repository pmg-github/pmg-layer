<script setup lang="ts">
import { computed, provide } from 'vue';
import {
  blockEditorComponentsKey,
  type BlockEditorComponents,
} from './context';

const props = defineProps<{
  components: BlockEditorComponents;
}>();

provide(
  blockEditorComponentsKey,
  computed(() => props.components),
);
</script>

<template>
  <slot />
</template>
