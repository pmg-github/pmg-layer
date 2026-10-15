<script setup lang="ts">
import { useId } from "vue";
import { BlocksSharedEditableText } from "../../block-editor";

withDefaults(
  defineProps<{
    title?: string | null;
    subtitle?: string | null;
    editable?: boolean;
    alignment?: "left" | "center" | "right";
    titleClass?: string;
    subtitleClass?: string;
    headingId?: string;
    richTitle?: boolean;
  }>(),
  { alignment: "center" },
);

const emit = defineEmits<{
  "update:title": [value: string];
  "update:subtitle": [value: string];
}>();
const generatedId = useId();
</script>

<template>
  <header
    v-if="editable || title || subtitle"
    data-block-heading
    class="not-prose mb-8 min-w-0 sm:mb-10"
    :style="{ textAlign: alignment }"
  >
    <h2
      v-if="editable || title"
      :id="headingId || generatedId"
      class="m-0 break-words text-2xl font-bold leading-tight tracking-tight sm:text-3xl"
      :class="titleClass"
    >
      <BlocksSharedEditableText
        :model-value="title"
        :editable="editable"
        :rich="richTitle"
        placeholder="Titel toevoegen"
        @update:model-value="emit('update:title', String($event ?? ''))"
      />
    </h2>
    <p
      v-if="editable || subtitle"
      class="mb-0 break-words text-base leading-relaxed sm:text-lg"
      :class="[subtitleClass, editable || title ? 'mt-3' : 'mt-0']"
    >
      <BlocksSharedEditableText
        :model-value="subtitle"
        :editable="editable"
        placeholder="Subtitel toevoegen"
        @update:model-value="emit('update:subtitle', String($event ?? ''))"
      />
    </p>
  </header>
</template>
