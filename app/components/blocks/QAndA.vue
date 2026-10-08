<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import { useInlineBlock } from "../../composables/useInlineBlock";
import {
  BlocksSharedAddItem,
  BlocksSharedBlockSettings,
  BlocksSharedEditableText,
  BlocksSharedItemControls,
  BlocksSharedSelectionFrame,
} from "../block-editor";

interface QAndAItem {
  question?: string;
  answer?: string;
}

const props = defineProps<{
  editable?: boolean;
  selected?: boolean;
  id?: string | number;
  title?: string;
  subtitle?: string;
  content?: QAndAItem[];
  colorScheme?: "light" | "dark" | "white";
}>();

const emits = defineEmits([
  "update:props",
  "update:title",
  "update:subtitle",
  "update:content",
]);

const { model, setField, update } = useInlineBlock(props, emits);
const blockSettingsRef = ref<InstanceType<
  typeof BlocksSharedBlockSettings
> | null>(null);
const openIndex = ref<number | null>(0);
const generatedId = useId().replaceAll(":", "");

const items = computed(() => props.content || []);
const displayedItems = computed(() =>
  props.editable
    ? items.value
    : items.value.filter(
        (item) => item.question?.trim() && item.answer?.trim(),
      ),
);
const sectionId = computed(() => `q-and-a-${props.id || generatedId}`);

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case "dark":
      return {
        background: "bg-primary-900",
        title: "text-white",
        subtitle: "text-white/80",
        accordion: "border-white/20 bg-white/10",
        divider: "divide-white/20",
        question: "text-white hover:bg-white/10",
        answer: "text-white/80",
        icon: "text-white/80",
      };
    case "light":
      return {
        background: "bg-primary-50",
        title: "text-primary-900",
        subtitle: "text-primary-950/80",
        accordion: "border-primary-200 bg-white",
        divider: "divide-primary-100",
        question: "text-primary-950 hover:bg-primary-50",
        answer: "text-gray-700",
        icon: "text-primary-700",
      };
    default:
      return {
        background: "bg-white",
        title: "text-primary-900",
        subtitle: "text-gray-600",
        accordion: "border-gray-200 bg-white",
        divider: "divide-gray-200",
        question: "text-gray-900 hover:bg-gray-50",
        answer: "text-gray-600",
        icon: "text-gray-500",
      };
  }
});

function toggleItem(index: number) {
  openIndex.value = openIndex.value === index ? null : index;
}

watch(
  () => items.value.length,
  (length) => {
    if (!length) openIndex.value = null;
    else if (openIndex.value !== null && openIndex.value >= length) {
      openIndex.value = length - 1;
    }
  },
);

defineExpose({
  openSettings: () => blockSettingsRef.value?.open?.(),
});
</script>

<template>
  <section
    :id="sectionId"
    :class="[
      'group relative scroll-mt-20 py-16 md:py-20',
      themeClasses.background,
    ]"
  >
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />

    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h2 :class="['text-2xl font-bold sm:text-3xl', themeClasses.title]">
          <BlocksSharedEditableText
            v-if="editable"
            :editable="editable"
            :model-value="title"
            placeholder="Titel toevoegen"
            @update:model-value="update(['title'], $event)"
          />
          <template v-else>{{ title }}</template>
        </h2>

        <p :class="['mt-3 text-xl', themeClasses.subtitle]">
          <BlocksSharedEditableText
            v-if="editable"
            :editable="editable"
            :model-value="subtitle"
            placeholder="Subtitel toevoegen"
            @update:model-value="update(['subtitle'], $event)"
          />
          <template v-else>{{ subtitle }}</template>
        </p>
      </div>

      <div
        v-if="displayedItems.length || editable"
        :class="[
          'mt-10 overflow-hidden rounded-lg border shadow-sm',
          themeClasses.accordion,
        ]"
      >
        <div :class="['divide-y', themeClasses.divider]">
          <article
            v-for="(item, index) in displayedItems"
            :key="index"
            class="group/item relative"
          >
            <div v-if="editable" class="flex items-start gap-3 p-5 md:p-6">
              <div class="min-w-0 flex-1">
                <h3 :class="['font-semibold', themeClasses.question]">
                  <BlocksSharedEditableText
                    :editable="editable"
                    :model-value="item.question"
                    placeholder="Vraag toevoegen"
                    @update:model-value="setField(item, 'question', $event)"
                  />
                </h3>
                <div :class="['mt-3 text-sm leading-6', themeClasses.answer]">
                  <BlocksSharedEditableText
                    :editable="editable"
                    :model-value="item.answer"
                    placeholder="Antwoord toevoegen"
                    rich
                    @update:model-value="setField(item, 'answer', $event)"
                  />
                </div>
              </div>

              <BlocksSharedItemControls
                v-if="selected"
                label="Vraag en antwoord bewerken"
                direction="horizontal"
                :items="model.content"
                :index="index"
                @update:items="model.content = $event"
              />
            </div>

            <template v-else>
              <h3>
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold transition-colors md:p-6"
                  :class="themeClasses.question"
                  :aria-expanded="openIndex === index"
                  :aria-controls="`${sectionId}-answer-${index}`"
                  :id="`${sectionId}-question-${index}`"
                  @click="toggleItem(index)"
                >
                  <span>{{ item.question }}</span>
                  <Icon
                    :name="
                      openIndex === index
                        ? 'material-symbols:remove-rounded'
                        : 'material-symbols:add-rounded'
                    "
                    :class="['size-5 flex-none', themeClasses.icon]"
                    aria-hidden="true"
                  />
                </button>
              </h3>

              <div
                v-show="openIndex === index"
                :id="`${sectionId}-answer-${index}`"
                role="region"
                :aria-labelledby="`${sectionId}-question-${index}`"
                :class="[
                  'px-5 pb-5 text-sm leading-6 md:px-6 md:pb-6',
                  themeClasses.answer,
                ]"
              >
                <BlocksSharedEditableText :model-value="item.answer" rich />
              </div>
            </template>
          </article>

          <div v-if="editable" class="p-4 md:p-5">
            <BlocksSharedAddItem
              class="min-h-24"
              label="Vraag en antwoord toevoegen"
              @add="
                model.content = [
                  ...(model.content || []),
                  { question: '', answer: '' },
                ]
              "
            />
          </div>
        </div>
      </div>
    </div>
  </section>

  <BlocksSharedBlockSettings
    v-if="editable && selected"
    ref="blockSettingsRef"
    label="Q&A-instellingen"
    hide-trigger
  >
    <p class="text-sm text-gray-500">
      Vragen en antwoorden beheer je rechtstreeks in het blok.
    </p>
  </BlocksSharedBlockSettings>
</template>
