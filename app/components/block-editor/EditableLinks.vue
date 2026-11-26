<script setup lang="ts">
import { ref } from "vue";
import { useBlockEditorComponent } from "./context";
defineOptions({ inheritAttrs: false });
const editor = useBlockEditorComponent("EditableLinks");
const editorRef = ref<{
  open?: (...args: any[]) => void;
  close?: () => void;
} | null>(null);
defineExpose({
  open: (...args: any[]) => editorRef.value?.open?.(...args),
  close: () => editorRef.value?.close?.(),
});
</script>
<template>
  <component v-if="editor" :is="editor" ref="editorRef" v-bind="$attrs"
    ><slot
  /></component>
</template>
