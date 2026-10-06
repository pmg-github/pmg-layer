<script setup lang="ts">
import { computed, provide } from "vue";
import { blockEditorScopeKey, type BlockEditorBlockId } from "./context";

const props = defineProps<{
  blockId: BlockEditorBlockId;
}>();

provide(
  blockEditorScopeKey,
  computed(() => props.blockId),
);
</script>

<template>
  <slot />
</template>
