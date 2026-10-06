<script setup lang="ts">
import { computed, provide } from "vue";
import {
  blockEditorComponentsKey,
  blockEditorPanelControllerKey,
  type BlockEditorComponents,
  type BlockEditorPanelState,
} from "./context";

const props = defineProps<{
  components: BlockEditorComponents;
  activePanel?: BlockEditorPanelState | null;
}>();

const emit = defineEmits<{
  "update:activePanel": [panel: BlockEditorPanelState | null];
}>();

provide(
  blockEditorComponentsKey,
  computed(() => props.components),
);

provide(blockEditorPanelControllerKey, {
  activePanel: computed(() => props.activePanel ?? null),
  setActivePanel: (panel) => emit("update:activePanel", panel),
});
</script>

<template>
  <slot />
</template>
