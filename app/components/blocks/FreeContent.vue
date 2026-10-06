<script setup lang="ts">
import { useInlineBlock } from '../../composables/useInlineBlock';
import {
  BlocksSharedBlockSettings,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedSelectionFrame,
} from '../block-editor';
import { computed, ref } from 'vue';

const props = defineProps<{
  editable?: boolean;
  selected?: boolean;
  id?: string;
  links?: { url: string; text: string; target?: string }[];
  title?: string;
  subtitle?: string;
  content?: string;
  colorScheme?: 'light' | 'dark' | 'white';
}>();

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case 'dark':
      return {
        bg: 'bg-primary-900',
        text: 'text-white',
        subtitle: 'text-white',
        content: 'text-white',
        button: 'bg-white text-primary-950 hover:bg-primary-50',
        secondaryButton:
          'border border-white bg-transparent text-white hover:bg-white/10',
      };
    case 'light':
      return {
        bg: 'bg-primary-50',
        text: 'text-primary-900',
        subtitle: 'text-primary-950',
        content: 'text-primary-900',
        button: 'bg-primary-900 text-white hover:bg-primary-950',
        secondaryButton:
          'border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100',
      };
    default: // white
      return {
        bg: 'bg-white',
        text: 'text-primary-900',
        subtitle: 'text-gray-600',
        content: 'text-gray-800',
        button: 'bg-primary-900 text-white hover:bg-primary-950',
        secondaryButton:
          'border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50',
      };
  }
});

const handleAnchorClick = (url: string, target?: string | null) => {
  if (props.editable) return;
  if (url.startsWith('#')) {
    document.querySelector(url)?.scrollIntoView({ behavior: 'smooth' });
  } else if (target === '_blank') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    window.location.href = url;
  }
};

const emits = defineEmits([
  'update:props',
  'update:title',
  'update:subtitle',
  'update:content',
  'update:links',
  'update:kicker',
]);

const { model, update } = useInlineBlock(props, emits);
const blockSettingsRef = ref();
const editableLinksRef = ref();
const contentMode = ref<'visual' | 'html'>('visual');

defineExpose({
  openSettings: () => blockSettingsRef.value?.open?.(),
  openLinks: (event?: MouseEvent) => editableLinksRef.value?.open?.(event),
});
</script>

<template>
  <section
    :id="props.id"
    :class="['group relative scroll-m-16 py-16 md:py-20', themeClasses.bg]"
  >
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />
    <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-screen-lg">
        <h2 :class="['mb-8 text-3xl font-bold', themeClasses.text]">
          <BlocksSharedEditableText
            v-if="editable"
            :editable="editable"
            :model-value="title"
            placeholder="Titel toevoegen"
            @update:model-value="update(['title'], $event)"
          /><template v-else>{{ title }}</template>
        </h2>

        <p
          v-if="editable || subtitle"
          :class="['mb-8 text-xl', themeClasses.subtitle]"
        >
          <BlocksSharedEditableText
            v-if="editable"
            editable
            :model-value="subtitle"
            placeholder="Tekst onder de titel toevoegen"
            @update:model-value="update(['subtitle'], $event)"
          />
          <template v-else>{{ subtitle }}</template>
        </p>

        <div
          v-if="editable || props.content"
          :class="[
            'prose free-content editor-prose max-w-none',
            props.colorScheme === 'dark' ? 'free-content-dark' : '',
            themeClasses.content,
          ]"
        >
          <div
            v-if="editable"
            class="mb-2 flex items-center justify-between gap-3"
          >
            <p class="text-xs text-current opacity-60">
              Gebruik HTML om bijvoorbeeld AI-uitvoer rechtstreeks te plakken.
            </p>
            <div
              class="flex shrink-0 rounded-lg border border-gray-200 bg-white p-0.5 text-xs text-gray-700 shadow-sm"
              role="group"
              aria-label="Inhoudsweergave"
            >
              <button
                type="button"
                class="rounded-md px-2.5 py-1.5 font-medium transition"
                :class="
                  contentMode === 'visual'
                    ? 'bg-gray-900 text-white'
                    : 'hover:bg-gray-100'
                "
                @click="contentMode = 'visual'"
              >
                Visueel
              </button>
              <button
                type="button"
                class="rounded-md px-2.5 py-1.5 font-medium transition"
                :class="
                  contentMode === 'html'
                    ? 'bg-gray-900 text-white'
                    : 'hover:bg-gray-100'
                "
                @click="contentMode = 'html'"
              >
                HTML
              </button>
            </div>
          </div>

          <Tiptap
            v-if="editable && contentMode === 'visual'"
            v-model="model.content"
            class="free-content-html-editor min-h-64 rounded-xl border border-gray-300 bg-white p-5 text-gray-900 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
            placeholder="Voeg hier vrije inhoud toe…"
            can-edit-link
            can-change-style
          />
          <textarea
            v-else-if="editable"
            :value="props.content || ''"
            class="min-h-64 w-full resize-y rounded-xl border border-gray-300 bg-gray-950 p-5 font-mono text-sm leading-6 text-gray-100 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="Plak hier HTML, bijvoorbeeld <h2>...</h2>"
            aria-label="HTML-broncode"
            spellcheck="false"
            @input="
              update(['content'], ($event.target as HTMLTextAreaElement).value)
            "
          />
          <div v-else v-html="props.content" />
        </div>

        <div
          class="mt-8 flex w-full flex-col justify-center gap-3 sm:flex-row sm:flex-wrap"
        >
          <BlocksSharedEditableLinks
            v-if="editable"
            ref="editableLinksRef"
            :model-value="props.links"
            :color-scheme="props.colorScheme"
            :max="2"
            @update:model-value="update(['links'], $event)"
          />
          <template v-else-if="props.links?.length">
            <a
              v-for="(link, index) in props.links"
              :key="index"
              :href="link.url"
              :target="link.target || '_self'"
              rel="noopener noreferrer"
              class="rounded-full px-12 py-3 text-center font-medium transition-colors"
              :class="
                index === 0 ? themeClasses.button : themeClasses.secondaryButton
              "
              @click.prevent="handleAnchorClick(link.url, link.target)"
            >
              {{ link.text }}
            </a>
          </template>
        </div>
      </div>
    </div>
  </section>

  <BlocksSharedBlockSettings
    v-if="editable && selected"
    ref="blockSettingsRef"
    label="Blokinstellingen"
    hide-trigger
  >
    <div class="space-y-5">
      <section>
        <label class="block">
          <span class="mb-1 block text-xs font-semibold text-gray-600">
            Referentie
          </span>
          <input
            class="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            :value="props.id || ''"
            placeholder="section-id"
            @input="update(['id'], ($event.target as HTMLInputElement).value)"
          />
        </label>
      </section>
    </div>
  </BlocksSharedBlockSettings>
</template>

<style lang="postcss" scoped>
html {
  scroll-behavior: smooth;
}
.prose {
  line-height: 1.7;
}
.free-content-html-editor :deep(.tiptap) {
  min-height: 14rem;
  outline: none;
}
:deep(p) {
  margin-top: 1rem;
}

.free-content {
  :deep(li) {
    @apply text-gray-900;
  }
  :deep(ul) {
    @apply mb-4 list-inside list-disc pl-2;
  }
  :deep(ol) {
    @apply mb-4 list-decimal;
  }
  :deep(h1) {
    @apply mb-4 text-3xl font-bold text-gray-900;
  }
  :deep(h2) {
    @apply mb-4 text-2xl font-bold text-gray-900;
  }
  :deep(h3) {
    @apply mb-4 text-xl font-bold text-gray-900;
  }
  :deep(h4) {
    @apply mb-4 text-lg font-bold text-gray-900;
  }
  :deep(h5) {
    @apply mb-4 text-base font-bold text-gray-900;
  }
  :deep(h6) {
    @apply mb-4 text-sm font-bold text-gray-900;
  }
  :deep(p) {
    @apply mb-4 text-base text-gray-900;
  }
  :deep(a) {
    @apply text-blue-600 underline hover:text-blue-700;
  }
  :deep(code) {
    @apply rounded-md bg-gray-100 px-1 py-0.5 font-mono text-sm text-gray-900;
  }

  :deep(pre) {
    @apply mb-4 rounded-md bg-gray-100 p-4 font-mono text-sm text-gray-900;
  }

  :deep(pre) :deep(code) {
    @apply m-0;
  }
  :deep(blockquote) {
    @apply mb-4 border-l-4 border-gray-300 pl-4 italic text-gray-900;
  }
  :deep(strong) {
    @apply font-bold text-gray-900;
  }
  :deep(em) {
    @apply italic text-gray-900;
  }
}
.free-content-dark {
  :deep(li),
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6),
  :deep(p),
  :deep(blockquote),
  :deep(strong),
  :deep(em) {
    color: inherit;
  }
  :deep(a) {
    @apply text-white underline decoration-white/60 hover:text-white;
  }
  :deep(code),
  :deep(pre) {
    @apply bg-white/10 text-white;
  }
  :deep(blockquote) {
    @apply border-white/30;
  }
}
:deep(.editor-prose p:empty)::before {
  content: '\00a0'; /* non-breaking space */
}
</style>
