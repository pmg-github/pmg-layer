<script setup lang="ts">
import { useBlockEditorComponent, useBlockEditorPanel } from "./context";

defineOptions({ inheritAttrs: false });

const editor = useBlockEditorComponent("ImageManager");
const {
  isOpen,
  setOpen,
  open: openPanel,
  close,
} = useBlockEditorPanel("media");
const editorRef = ref<{ open: () => void }>();
const open = () =>
  editorRef.value?.open ? editorRef.value.open() : openPanel();

defineExpose({ open, close });
</script>

<template>
  <component
    v-if="editor"
    :is="editor"
    ref="editorRef"
    v-bind="$attrs"
    :open="isOpen"
    @update:open="setOpen"
  >
    <slot />
  </component>
</template>
