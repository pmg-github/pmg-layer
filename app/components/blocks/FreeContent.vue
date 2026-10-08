<script setup lang="ts">
import { useInlineBlock } from "../../composables/useInlineBlock";
import {
  BlocksSharedBlockSettings,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedSelectionFrame,
} from "../block-editor";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps<{
  editable?: boolean;
  selected?: boolean;
  id?: string;
  links?: { url: string; text: string; target?: string }[];
  title?: string;
  subtitle?: string;
  content?: string;
  colorScheme?: "light" | "dark" | "white";
}>();

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case "dark":
      return {
        bg: "bg-primary-900",
        text: "text-white",
        subtitle: "text-white",
        content: "text-white",
        button: "bg-white text-primary-950 hover:bg-primary-50",
        secondaryButton:
          "border border-white bg-transparent text-white hover:bg-white/10",
      };
    case "light":
      return {
        bg: "bg-primary-50",
        text: "text-primary-900",
        subtitle: "text-primary-950",
        content: "text-primary-900",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-100",
      };
    default: // white
      return {
        bg: "bg-white",
        text: "text-primary-900",
        subtitle: "text-gray-600",
        content: "text-gray-800",
        button: "bg-primary-900 text-white hover:bg-primary-950",
        secondaryButton:
          "border border-primary-900 bg-transparent text-primary-950 hover:bg-primary-50",
      };
  }
});

const handleAnchorClick = (url: string, target?: string | null) => {
  if (props.editable) return;
  if (url.startsWith("#")) {
    document.querySelector(url)?.scrollIntoView({ behavior: "smooth" });
  } else if (target === "_blank") {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = url;
  }
};

const emits = defineEmits([
  "update:props",
  "update:title",
  "update:subtitle",
  "update:content",
  "update:links",
  "update:kicker",
]);

const { update } = useInlineBlock(props, emits);
const blockSettingsRef = ref();
const editableLinksRef = ref();
const contentMode = ref<"preview" | "html">("html");
const renderedContentRef = ref<HTMLIFrameElement | null>(null);
let contentResizeObserver: ResizeObserver | null = null;

function stopObservingRenderedContent() {
  contentResizeObserver?.disconnect();
  contentResizeObserver = null;
}

function resizeRenderedContent() {
  const frame = renderedContentRef.value;
  const document = frame?.contentDocument;
  if (!frame || !document) return;

  const height = Math.max(
    256,
    document.documentElement?.scrollHeight || 0,
    document.body?.scrollHeight || 0,
  );
  frame.style.height = `${height}px`;
}

function observeRenderedContent() {
  stopObservingRenderedContent();

  const frame = renderedContentRef.value;
  const document = frame?.contentDocument;
  if (!frame || !document) return;

  frame.style.height = "256px";
  resizeRenderedContent();
  contentResizeObserver = new ResizeObserver(resizeRenderedContent);
  contentResizeObserver.observe(document.documentElement);
  if (document.body) contentResizeObserver.observe(document.body);

  document.fonts?.ready.then(resizeRenderedContent);
  document.querySelectorAll("img").forEach((image) => {
    if (!image.complete) image.addEventListener("load", resizeRenderedContent);
  });
}

watch(
  () => [props.content, contentMode.value],
  () => nextTick(resizeRenderedContent),
);

onBeforeUnmount(stopObservingRenderedContent);

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
        <h2 :class="['mb-8 text-2xl font-bold sm:text-3xl', themeClasses.text]">
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

        <div v-if="editable || props.content" class="max-w-none">
          <div
            v-if="editable"
            class="mb-2 flex items-center justify-between gap-3"
          >
            <p :class="['text-xs opacity-60', themeClasses.content]">
              Plak volledige HTML of een fragment, inclusief een
              &lt;style&gt;-blok. Scripts worden niet uitgevoerd.
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
                  contentMode === 'preview'
                    ? 'bg-gray-900 text-white'
                    : 'hover:bg-gray-100'
                "
                @click="contentMode = 'preview'"
              >
                Voorbeeld
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

          <textarea
            v-if="editable && contentMode === 'html'"
            :value="props.content || ''"
            class="min-h-64 w-full resize-y rounded-lg border border-gray-300 bg-gray-950 p-5 font-mono text-sm leading-6 text-gray-100 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="Plak hier HTML, bijvoorbeeld <style>...</style><section>...</section>"
            aria-label="HTML-broncode"
            spellcheck="false"
            @input="
              update(['content'], ($event.target as HTMLTextAreaElement).value)
            "
          />
          <iframe
            v-else-if="props.content"
            ref="renderedContentRef"
            :srcdoc="props.content"
            class="block min-h-64 w-full border-0 bg-transparent"
            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            title="Vrije HTML-inhoud"
            @load="observeRenderedContent"
          />
          <div
            v-else-if="editable"
            class="flex min-h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white/80 p-8 text-center text-sm text-gray-500"
          >
            Plak eerst HTML in de HTML-weergave.
          </div>
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
