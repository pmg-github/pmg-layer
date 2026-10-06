<script setup lang="ts">
import { useBlockEditorComponent, useBlockEditorPanel } from "./context";

defineOptions({ inheritAttrs: false });

const editor = useBlockEditorComponent("ImageManager");
const { isOpen, setOpen, open, close } = useBlockEditorPanel("media");

defineExpose({ open, close });
</script>

<template>
  <component
    v-if="editor"
    :is="editor"
    v-bind="$attrs"
    :open="isOpen"
    @update:open="setOpen"
  >
    <slot />
  </component>
</template>
