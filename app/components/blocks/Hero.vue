<script setup lang="ts">
import { useInlineBlock } from '../../composables/useInlineBlock';
import {
  BlocksSharedBlockSettings,
  BlocksSharedEditableText,
  BlocksSharedLinkReferenceSelect,
} from '../block-editor';
const props = defineProps<{
  editable?: boolean;
  selected?: boolean;
  id?: string;
  title?: string;
  subtitle?: string;
  visibleFrom?: string | null;
  visibleUntil?: string | null;
  links?: { url: string; text: string; target?: string | null }[];
  content: {
    height?: string;
    image?: any;
    imageUrl?: string;
    imagePosition?: { x?: number; y?: number };
    isVideo?: number;
    showPartners?: boolean;
    videoUrl?: string;
    sponsors?: Array<
      string | { src?: string; url?: string; name?: string; link?: string }
    >;
    kicker: string;
  };
}>();

const emits = defineEmits([
  'update:props',
  'update:settings',
  'update:title',
  'update:subtitle',
  'update:content',
  'update:links',
  'update:kicker',
]);

const { model, setField, update } = useInlineBlock(props, emits);

const heroEl = ref<HTMLElement | null>(null);
const blockSettingsRef = ref();
const linkPanelOpen = ref(false);
const selectedLinkIndex = ref<number | null>(null);
const activeLink = computed(() =>
  selectedLinkIndex.value === null
    ? undefined
    : model.links?.[selectedLinkIndex.value],
);
const resizeState = ref<{ startY: number; startHeight: number } | null>(null);

const heightPresets = [
  { label: '60%', value: '60vh' },
  { label: '75%', value: '75vh' },
  { label: 'Volledig', value: '100dvh' },
];

const heroHeight = computed(() => model.content.height || '100dvh');

const backgroundImageUrl = computed(() => {
  const src = model.content.image?.url || model.content.imageUrl;
  if (!src) return '';
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}width=2000`;
});

const backgroundPosition = computed(() => {
  const x = model.content.imagePosition?.x ?? 50;
  const y = model.content.imagePosition?.y ?? 50;
  return `${x}% ${y}%`;
});

const inlineImageSource = computed(
  () => model.content.image?.url || model.content.imageUrl,
);

const inlineUpdateImage = (image: any) => {
  if (!image) return;
  model.content.image = image;
  model.content.imageUrl = image.url;
};

const inlineUpdateSelectedImage = (images: any[]) =>
  inlineUpdateImage(images[0]);

const inlineClearImage = () => {
  model.content.image = null;
  model.content.imageUrl = undefined;
};

const openMediaPanel = () => {
  linkPanelOpen.value = false;
  blockSettingsRef.value?.open?.();
};

const openLinkEditor = (index?: number) => {
  blockSettingsRef.value?.close?.();

  if (typeof index === 'number') {
    selectedLinkIndex.value = index;
    linkPanelOpen.value = true;
    return;
  }

  if (model.links?.length) {
    selectedLinkIndex.value = 0;
    linkPanelOpen.value = true;
    return;
  }

  addButton();
};

const handleLinksRowFocusOut = (event: FocusEvent) => {
  const row = event.currentTarget as HTMLElement;
  const next = event.relatedTarget as Node | null;
  if (next && row.contains(next)) return;
  linkPanelOpen.value = false;
};

const addButton = () => {
  if (!model.links) model.links = [];
  if (model.links.length >= 2) return;

  model.links.push({
    text: 'Nieuwe knop',
    url: '#',
    target: null,
  });
  selectedLinkIndex.value = model.links.length - 1;
  linkPanelOpen.value = true;
  blockSettingsRef.value?.close?.();
};

const removeActiveButton = () => {
  if (selectedLinkIndex.value === null || !model.links) return;
  model.links.splice(selectedLinkIndex.value, 1);
  selectedLinkIndex.value = model.links.length ? 0 : null;
  if (!model.links.length) linkPanelOpen.value = false;
};

const setHeightPreset = (height: string) => {
  model.content.height = height;
};

const handleAnchorClick = (url: string, target?: string | null) => {
  if (props.editable) return;

  if (url.startsWith('#')) {
    const el = document.querySelector(url);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (target === '_blank') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  window.location.href = url;
};

const onResizeMove = (event: PointerEvent) => {
  if (!resizeState.value) return;
  const delta = event.clientY - resizeState.value.startY;
  const nextHeight = Math.min(
    window.innerHeight,
    Math.max(380, resizeState.value.startHeight + delta),
  );
  model.content.height = `${Math.round(nextHeight)}px`;
};

const stopResize = () => {
  resizeState.value = null;
  window.removeEventListener('pointermove', onResizeMove);
  window.removeEventListener('pointerup', stopResize);
  window.removeEventListener('pointercancel', stopResize);
};

const startResize = (event: PointerEvent) => {
  if (!props.editable || !heroEl.value) return;
  event.preventDefault();
  event.stopPropagation();

  resizeState.value = {
    startY: event.clientY,
    startHeight: heroEl.value.getBoundingClientRect().height,
  };

  window.addEventListener('pointermove', onResizeMove);
  window.addEventListener('pointerup', stopResize);
  window.addEventListener('pointercancel', stopResize);
};

watch(
  () => props.selected,
  (selected) => {
    if (!selected) {
      blockSettingsRef.value?.close?.();
      linkPanelOpen.value = false;
      selectedLinkIndex.value = null;
    }
  },
);

onUnmounted(() => {
  stopResize();
});

defineExpose({
  openSettings: openMediaPanel,
  openLinks: () => openLinkEditor(),
  openBackground: openMediaPanel,
});
</script>

<template>
  <div class="contents">
    <BlocksSharedBlockSettings
      v-if="editable && selected"
      ref="blockSettingsRef"
      label="Blokinstellingen"
      hide-trigger
      :can-delete="false"
    >
      <div class="space-y-5">
        <section>
          <h4 class="mb-2 text-xs font-semibold text-gray-600">Achtergrond</h4>
          <div class="mb-3 flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              class="rounded-md px-3 py-1.5 text-sm font-medium"
              :class="
                !model.content.isVideo
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              "
              @click="model.content.isVideo = 0"
            >
              Foto
            </button>
            <button
              type="button"
              class="rounded-md px-3 py-1.5 text-sm font-medium"
              :class="
                model.content.isVideo
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              "
              @click="model.content.isVideo = 1"
            >
              Video
            </button>
          </div>

          <div v-if="!model.content.isVideo" class="space-y-4">
            <ImageLibraryTile
              :image-source="inlineImageSource"
              :image="model.content.image"
              :folder-id="70"
              @selected="inlineUpdateSelectedImage"
              @saved="inlineUpdateImage"
              @clear="inlineClearImage"
            />
          </div>

          <div v-else>
            <PMGInput
              :maxlength="250"
              :model-value="model.content.videoUrl ?? ''"
              label="Video url"
              @update:model-value="model.content.videoUrl = String($event ?? '')"
            />
          </div>
        </section>

        <section class="border-t border-gray-100 pt-5">
          <h4 class="mb-2 text-xs font-semibold text-gray-600">Hoogte</h4>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="preset in heightPresets"
              :key="preset.value"
              type="button"
              class="rounded-md border px-2 py-2 text-xs font-medium"
              :class="
                model.content.height === preset.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              "
              @click="setHeightPreset(preset.value)"
            >
              {{ preset.label }}
            </button>
          </div>
          <p class="mt-2 text-xs text-gray-400">
            Je kunt de hoogte ook rechtstreeks onderaan het blok slepen.
          </p>
        </section>

        <section class="border-t border-gray-100 pt-5">
          <PMGInput
            label="Referentie"
            :model-value="props.id || ''"
            placeholder="section-id"
            @update:model-value="update(['id'], String($event ?? ''))"
          />
        </section>

        <section class="border-t border-gray-100 pt-5">
          <div class="grid grid-cols-2 gap-2">
            <PMGInput
              label="Zichtbaar van"
              type="date"
              :model-value="props.visibleFrom?.slice(0, 10) || ''"
              @update:model-value="
                emits('update:settings', {
                  visibleFrom: String($event ?? ''),
                })
              "
            />
            <PMGInput
              label="Zichtbaar tot"
              type="date"
              :model-value="props.visibleUntil?.slice(0, 10) || ''"
              @update:model-value="
                emits('update:settings', {
                  visibleUntil: String($event ?? ''),
                })
              "
            />
          </div>
        </section>
      </div>
    </BlocksSharedBlockSettings>

    <div
      ref="heroEl"
      :id="props.id"
      class="group relative min-h-[380px] w-full overflow-hidden bg-primary-800"
      :class="{ '-mt-16': !editable }"
      :style="{ height: heroHeight }"
    >
      <!-- Background -->
      <div
        v-if="model.content.isVideo"
        class="absolute inset-0 z-0 bg-cover bg-center"
      >
        <video
          :src="model.content.videoUrl"
          class="h-full w-full object-cover"
          autoplay
          muted
          loop
          playsinline
        />
      </div>

      <div
        v-else
        class="absolute inset-0 z-0 bg-cover bg-center"
        :style="{
          backgroundImage: backgroundImageUrl
            ? `url('${backgroundImageUrl}')`
            : undefined,
          backgroundPosition,
        }"
        role="img"
        :aria-label="model.title || 'Background image'"
      ></div>

      <div
        class="pointer-events-none absolute inset-0 z-10 bg-gray-950/55"
      ></div>

      <!-- Editor selection frame -->
      <div
        v-if="editable"
        class="pointer-events-none absolute inset-0 z-10 transition-shadow"
        :class="
          selected
            ? 'ring-2 ring-inset ring-blue-500'
            : 'group-hover:ring-1 group-hover:ring-inset group-hover:ring-blue-400/70'
        "
      ></div>

      <!-- Hero content -->
      <div
        class="relative z-20 mx-auto flex h-full w-full max-w-screen-2xl flex-col items-start justify-end px-4 py-8 sm:py-12"
      >
        <div class="flex w-full flex-col md:flex-row">
          <div class="ml-0 mt-4 flex flex-col text-left md:mt-0 md:items-start">
            <p
              v-if="editable || model.content.kicker"
              class="w-fit rounded-full bg-primary-100 px-4 py-1 text-xs font-medium text-primary-950"
            >
              <BlocksSharedEditableText
                v-if="editable"
                :editable="editable"
                :model-value="model.content.kicker"
                placeholder="Kicker toevoegen"
                @update:model-value="update(['content', 'kicker'], $event)"
              />
              <template v-else>{{ model.content.kicker }}</template>
            </p>

            <h1
              class="mt-2 text-4xl font-extrabold text-white [text-shadow:0px_0px_12px_rgba(0,0,0,1)] md:text-5xl lg:text-6xl"
            >
              <BlocksSharedEditableText
                :model-value="model.title"
                :editable="editable"
                placeholder="Titel toevoegen"
                @update:model-value="update(['title'], $event)"
              />
            </h1>

            <div
              v-if="editable || model.subtitle"
              class="text-xl font-medium text-gray-200 [text-shadow:0px_0px_12px_rgba(0,0,0,1)]"
            >
              <BlocksSharedEditableText
                :model-value="model.subtitle"
                :editable="editable"
                placeholder="Subtitel toevoegen"
                @update:model-value="update(['subtitle'], $event)"
              />
            </div>

            <!-- Keep the real buttons visible while editing -->
            <div
              class="relative mt-6 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap md:mt-8"
              @focusout="handleLinksRowFocusOut"
            >
              <div
                v-for="(link, idx) in model.links || []"
                :key="idx"
                class="group/button relative"
                @focusin="editable && selected && openLinkEditor(Number(idx))"
              >
                <a
                  :href="link.url || '#'"
                  :target="link.target || '_self'"
                  class="block rounded-full px-12 py-3 text-center font-medium text-white transition-colors"
                  :class="
                    idx === 0
                      ? 'bg-primary-900 hover:bg-primary-950'
                      : 'border border-white bg-transparent hover:bg-white/10'
                  "
                  @click.prevent="
                    handleAnchorClick(link.url || '#', link.target)
                  "
                >
                  <BlocksSharedEditableText
                    v-if="editable"
                    :editable="editable"
                    :model-value="link.text"
                    placeholder="Knoptekst"
                    @update:model-value="setField(link, 'text', $event)"
                  />
                  <template v-else>{{ link.text }}</template>
                </a>
              </div>

              <div
                v-if="
                  editable &&
                  selected &&
                  linkPanelOpen &&
                  activeLink
                "
                class="absolute bottom-full left-1/2 z-20 mb-2 flex w-[min(22rem,100%)] -translate-x-1/2 items-center gap-1 rounded-full border border-gray-200 bg-white p-1.5 pl-3 text-gray-900 shadow-2xl"
                @click.stop
              >
                <Icon
                  name="material-symbols:link-rounded"
                  class="size-4 shrink-0 text-gray-400"
                />
                <PMGInput
                  v-model="activeLink.url"
                  type="url"
                  placeholder="https://... of #sectie"
                  class="min-w-0 flex-1"
                />
                <BlocksSharedLinkReferenceSelect
                  v-model="activeLink.url"
                />
                <PMGButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon="material-symbols:open-in-new-rounded"
                  class="!size-8 !shrink-0 !rounded-full !border-0 !p-0"
                  :class="
                    activeLink.target === '_blank'
                      ? '!bg-blue-100 !text-blue-600'
                      : '!bg-transparent !text-gray-400 hover:!bg-gray-100 hover:!text-gray-700'
                  "
                  title="Openen in nieuw tabblad"
                  aria-label="Openen in nieuw tabblad"
                  @click="
                    activeLink.target =
                      activeLink.target === '_blank'
                        ? null
                        : '_blank'
                  "
                />
                <PMGButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon="material-symbols:delete-outline-rounded"
                  class="!size-8 !shrink-0 !rounded-full !border-0 !bg-transparent !p-0 !text-red-500 hover:!bg-red-50"
                  title="Verwijderen"
                  aria-label="Link verwijderen"
                  @click="removeActiveButton"
                />
              </div>

              <PMGButton
                v-if="
                  editable &&
                  selected &&
                  (!model.links || model.links.length < 2)
                "
                type="button"
                variant="ghost"
                class="!rounded-full !border-dashed !border-white/70 !bg-black/20 !px-6 !py-3 !text-sm !font-medium !text-white backdrop-blur-sm hover:!bg-black/30"
                @click.stop="addButton"
              >
                + Knop toevoegen
              </PMGButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Drag height directly on the canvas -->
      <div
        v-if="editable && selected"
        class="absolute bottom-0 left-0 z-50 flex h-7 w-full cursor-ns-resize items-center justify-center"
        @pointerdown="startResize"
      >
        <div
          class="rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold text-gray-600 shadow"
        >
          Sleep om hoogte aan te passen
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
:deep(.editor-prose p:empty)::before {
  content: '\00a0';
}
</style>
