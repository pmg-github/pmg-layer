<script setup lang="ts">
import { useBlockEditorComponent } from './context';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  editable?: boolean;
}>();

const editor = useBlockEditorComponent('EditableImage');
</script>

<template>
  <component
    v-if="editable && editor"
    :is="editor"
    v-bind="$attrs"
    :editable="editable"
  >
    <slot />
  </component>
  <div v-else v-bind="$attrs">
    <slot />
  </div>
</template>
