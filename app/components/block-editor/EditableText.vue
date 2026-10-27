<script setup lang="ts">
import { ref, watch } from 'vue';
import { useBlockEditorComponent } from './context';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  modelValue?: string | number | null;
  editable?: boolean;
  rich?: boolean;
  multiline?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editor = useBlockEditorComponent('EditableText');
const textElement = ref<HTMLElement | null>(null);

watch(
  [textElement, () => props.modelValue],
  () => {
    const element = textElement.value;
    if (!element || element === element.ownerDocument.activeElement) return;
    element.textContent = props.modelValue == null ? '' : String(props.modelValue);
  },
  { flush: 'post' },
);

const onInput = () => {
  if (textElement.value) {
    emit('update:modelValue', textElement.value.innerText.replace(/\r\n?/g, '\n'));
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' || event.isComposing) return;
  event.stopPropagation();
  if (event.shiftKey) return;
  event.preventDefault();
  textElement.value?.blur();
};
</script>

<template>
  <span
    v-if="multiline && !rich && editable"
    ref="textElement"
    v-bind="$attrs"
    class="whitespace-pre-wrap outline-none"
    contenteditable="plaintext-only"
    role="textbox"
    aria-multiline="true"
    :aria-label="placeholder"
    :data-placeholder="placeholder"
    @input="onInput"
    @keydown="onKeydown"
    @blur="onInput"
  />
  <span
    v-else-if="multiline && !rich"
    v-bind="$attrs"
    class="whitespace-pre-wrap"
  >{{ modelValue }}</span>
  <component
    v-else-if="editable && editor"
    :is="editor"
    v-bind="$attrs"
    :model-value="modelValue"
    :editable="editable"
    :rich="rich"
    :placeholder="placeholder"
    @update:model-value="emit('update:modelValue', $event)"
  />
  <span
    v-else-if="rich"
    v-bind="$attrs"
    class="editor-prose"
    v-html="modelValue == null ? '' : String(modelValue)"
  />
  <template v-else>{{ modelValue }}</template>
</template>

<style scoped>
[contenteditable][data-placeholder]:empty::before {
  content: attr(data-placeholder);
  pointer-events: none;
  opacity: 0.5;
}
</style>
