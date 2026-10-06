<script setup lang="ts">
import { useBlockEditorComponent, useBlockEditorPanel } from "./context";

defineOptions({ inheritAttrs: false });

const editor = useBlockEditorComponent("BlockSettings");
const { isOpen, setOpen, open, close } = useBlockEditorPanel("settings");

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
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps || {}" />
    </template>
  </component>
</template>
