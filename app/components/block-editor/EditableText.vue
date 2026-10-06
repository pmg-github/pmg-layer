<script setup lang="ts">
import { useBlockEditorComponent } from './context';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  modelValue?: string | number | null;
  editable?: boolean;
  rich?: boolean;
  placeholder?: string;
}>();

const editor = useBlockEditorComponent('EditableText');
</script>

<template>
  <component
    v-if="editable && editor"
    :is="editor"
    v-bind="$attrs"
    :model-value="modelValue"
    :editable="editable"
    :rich="rich"
    :placeholder="placeholder"
  />
  <span
    v-else-if="rich"
    v-bind="$attrs"
    class="editor-prose"
    v-html="modelValue == null ? '' : String(modelValue)"
  />
  <template v-else>{{ modelValue }}</template>
</template>
