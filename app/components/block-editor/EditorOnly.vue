<script setup lang="ts">
import type { BlockEditorComponentName } from './context';
import { useBlockEditorComponent } from './context';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  name: BlockEditorComponentName;
}>();

const editor = useBlockEditorComponent(props.name);
</script>

<template>
  <component v-if="editor" :is="editor" v-bind="$attrs">
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps || {}" />
    </template>
  </component>
</template>
