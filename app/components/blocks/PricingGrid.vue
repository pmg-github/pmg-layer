<script setup lang="ts">
import { useInlineBlock } from '../../composables/useInlineBlock';
import {
  BlocksSharedAddItem,
  BlocksSharedBlockSettings,
  BlocksSharedEditableLinks,
  BlocksSharedEditableText,
  BlocksSharedItemControls,
  BlocksSharedSelectionFrame,
} from '../block-editor';
const props = defineProps<{
  editable?: boolean;
  selected?: boolean;
  links?: { url: string; text: string; target?: string }[];
  id?: string;
  title?: string;
  subtitle?: string;
  content?: {
    title?: string;
    label?: {
      text: string;
      color?: 'yellow' | 'red' | 'green' | 'pink' | 'orange' | null;
    };
    tags?: string[];
    benefits?: Array<{ label: string; included: boolean }>;
    price?: string;
    priceNote?: string;
    buttonLabel?: string;
    buttonUrl?: string;
    buttonTarget?: string;
  }[];
  colorScheme?: 'light' | 'dark' | 'white';
}>();

const borderColor = (color?: string | null) => ({
  'border-yellow-300': color === 'yellow',
  'border-red-300': color === 'red',
  'border-green-300': color === 'green',
  'border-pink-300': color === 'pink',
  'border-orange-300': color === 'orange',
  'border-gray-200': !color,
});

const badgeBg = (color?: string | null) => ({
  'bg-yellow-300': color === 'yellow',
  'bg-red-300': color === 'red',
  'bg-green-300': color === 'green',
  'bg-pink-300': color === 'pink',
  'bg-orange-300': color === 'orange',
  'bg-gray-200': !color,
});

const badgeColors = [
  { value: null, label: 'Grijs', class: 'bg-gray-200' },
  { value: 'yellow', label: 'Geel', class: 'bg-yellow-300' },
  { value: 'red', label: 'Rood', class: 'bg-red-300' },
  { value: 'green', label: 'Groen', class: 'bg-green-300' },
  { value: 'pink', label: 'Roze', class: 'bg-pink-300' },
  { value: 'orange', label: 'Oranje', class: 'bg-orange-300' },
] as const;

const themeClasses = computed(() => {
  switch (props.colorScheme) {
    case 'dark':
      return {
        bg: 'bg-primary-900',
        text: 'text-white',
        subtitle: 'text-white',
      };
    case 'light':
      return {
        bg: 'bg-primary-50',
        text: 'text-primary-900',
        subtitle: 'text-primary-950',
      };
    default:
      return {
        bg: 'bg-white',
        text: 'text-primary-900',
        subtitle: 'text-gray-600',
      };
  }
});

const emits = defineEmits([
  'update:props',
  'update:title',
  'update:subtitle',
  'update:content',
  'update:links',
  'update:kicker',
]);

const { model, setField, update } = useInlineBlock(props, emits);
const blockSettingsRef = ref();
const editableLinksRef = ref();
const openBadgeColorIndex = ref<number | null>(null);
const badgeColorPickerRefs = ref<Record<number, HTMLElement>>({});

function setBadgeColorPickerRef(index: number, element: any) {
  if (element) badgeColorPickerRefs.value[index] = element as HTMLElement;
  else delete badgeColorPickerRefs.value[index];
}

function toggleBadgeColorPicker(index: number) {
  openBadgeColorIndex.value =
    openBadgeColorIndex.value === index ? null : index;
}

function selectBadgeColor(label: any, color: string | null) {
  setField(label, 'color', color);
  openBadgeColorIndex.value = null;
}

function closeBadgeColorPicker(event: PointerEvent) {
  const index = openBadgeColorIndex.value;
  if (index === null) return;

  const picker = badgeColorPickerRefs.value[index];
  if (!picker?.contains(event.target as Node)) {
    openBadgeColorIndex.value = null;
  }
}

onMounted(() => document.addEventListener('pointerdown', closeBadgeColorPicker));
onUnmounted(() =>
  document.removeEventListener('pointerdown', closeBadgeColorPicker),
);

watch(
  () => props.selected,
  (selected) => {
    if (!selected) openBadgeColorIndex.value = null;
  },
);

defineExpose({
  openSettings: () => blockSettingsRef.value?.open?.(),
  openLinks: (event?: MouseEvent) => editableLinksRef.value?.open?.(event),
});

// Verwacht: model.content.cards[]
// card: { title, label:{text,color}, tags[], benefits:[{label,included}], price, priceNote, buttonLabel, buttonUrl, buttonTarget }

function cardButtonLinks(card: any) {
  if (!card.buttonLabel && !card.buttonUrl) return [];

  return [
    {
      text: card.buttonLabel || '',
      url: card.buttonUrl || '',
      target: card.buttonTarget || '_self',
    },
  ];
}

function updateCardButton(index: number, card: any, links: any[]) {
  const link = links[0];
  update(['content', index], {
    ...card,
    buttonLabel: link?.text || '',
    buttonUrl: link?.url || '',
    buttonTarget: link?.target || '_self',
  });
}
</script>

<template>
  <section
    :id="props.id"
    :class="['group relative scroll-mt-20 py-16 md:py-20', themeClasses.bg]"
  >
    <BlocksSharedSelectionFrame :editable="editable" :selected="selected" />
    <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-4xl text-center">
        <h3 :class="['text-center text-3xl font-bold', themeClasses.text]">
          <BlocksSharedEditableText
            :editable="editable"
            v-if="editable"
            :model-value="title"
            placeholder="Titel toevoegen"
            @update:model-value="update(['title'], $event)"
          /><template v-else>{{ title }}</template>
        </h3>
        <p :class="['mb-8 text-center text-xl', themeClasses.subtitle]">
          <BlocksSharedEditableText
            :editable="editable"
            v-if="editable"
            :model-value="subtitle"
            placeholder="Subtitel toevoegen"
            @update:model-value="update(['subtitle'], $event)"
          /><template v-else>{{ subtitle }}</template>
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(card, i) in props.content || []"
          :key="i"
          class="pricing-card group/item relative flex h-full w-full flex-col rounded-2xl border-2 bg-white p-6 shadow-sm"
          :class="[
            borderColor(card.label?.color),
            openBadgeColorIndex === i ? 'z-50' : '',
          ]"
        >
          <div
            v-if="editable || card.label?.text"
            class="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-sm font-semibold text-gray-900"
            :class="badgeBg(card.label?.color)"
          >
            <BlocksSharedEditableText
              :editable="editable"
              v-if="editable"
              :model-value="card.label.text"
              @update:model-value="setField(card.label, 'text', $event)"
            /><template v-else>{{ card.label.text }}</template>

            <div
              v-if="editable && selected"
              :ref="(element) => setBadgeColorPickerRef(i, element)"
              class="absolute bottom-full left-1/2 z-[60] mb-2 -translate-x-1/2"
              @click.stop
            >
              <button
                type="button"
                class="flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:bg-gray-50 hover:text-gray-900"
                title="Badgekleur wijzigen"
                aria-label="Badgekleur wijzigen"
                :aria-expanded="openBadgeColorIndex === i"
                @click.stop="toggleBadgeColorPicker(i)"
              >
                <Icon name="material-symbols:palette-outline" class="size-4" />
              </button>
              <div
                v-if="openBadgeColorIndex === i"
                class="absolute bottom-10 left-1/2 z-[70] flex -translate-x-1/2 gap-1.5 rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
                aria-label="Badgekleur"
              >
                <button
                  v-for="color in badgeColors"
                  :key="color.label"
                  type="button"
                  class="size-7 rounded-full border border-black/10 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                  :class="[
                    color.class,
                    card.label?.color === color.value
                      ? 'ring-2 ring-blue-500 ring-offset-1'
                      : '',
                  ]"
                  :title="color.label"
                  :aria-label="`Badgekleur ${color.label}`"
                  :aria-pressed="card.label?.color === color.value"
                  @click.stop.prevent="selectBadgeColor(card.label, color.value)"
                />
              </div>
            </div>
          </div>

          <div class="flex flex-1 flex-col">
            <h3 class="mb-2 text-2xl font-bold uppercase text-gray-900">
              <BlocksSharedEditableText
                :editable="editable"
                v-if="editable"
                :model-value="card.title"
                @update:model-value="setField(card, 'title', $event)"
              /><template v-else>{{ card.title }}</template>
            </h3>

            <div v-if="card.tags?.length" class="mb-2 flex flex-wrap gap-1">
              <span
                v-for="(tag, tagIndex) in card.tags"
                :key="tagIndex"
                class="inline-block rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                ><BlocksSharedEditableText
                  :model-value="tag"
                  :editable="editable"
                  rich
                  @update:model-value="setField(card.tags, tagIndex, $event)"
              /></span>
            </div>

            <ul
              v-if="card.benefits?.length"
              class="mb-6 flex min-h-[120px] flex-col gap-2"
            >
              <li
                v-for="(benefit, benefitIndex) in card.benefits"
                :key="benefitIndex"
                class="flex items-center gap-2"
              >
                <Icon
                  :name="
                    benefit.included
                      ? 'material-symbols:check-rounded'
                      : 'material-symbols:cancel-outline'
                  "
                  :class="benefit.included ? 'text-green-500' : 'text-red-500'"
                  class="h-5 w-5 flex-shrink-0"
                />
                <span class="text-sm"
                  ><BlocksSharedEditableText
                    :model-value="benefit.label"
                    :editable="editable"
                    rich
                    @update:model-value="setField(benefit, 'label', $event)"
                /></span>
              </li>
            </ul>

            <div class="mb-2 mt-auto">
              <span class="text-3xl font-bold tracking-tight text-primary-950">
                <BlocksSharedEditableText
                  :editable="editable"
                  v-if="editable"
                  :model-value="card.price"
                  @update:model-value="setField(card, 'price', $event)"
                /><template v-else>{{ card.price }}</template>
              </span>
              <span
                v-if="editable || card.priceNote"
                class="ml-2 text-sm text-gray-500"
                ><BlocksSharedEditableText
                  :editable="editable"
                  v-if="editable"
                  :model-value="card.priceNote"
                  @update:model-value="setField(card, 'priceNote', $event)"
                /><template v-else>{{ card.priceNote }}</template></span
              >
            </div>

            <BlocksSharedEditableLinks
              v-if="editable"
              class="mt-2"
              :model-value="cardButtonLinks(card)"
              :max="1"
              color-scheme="white"
              title="Knopinstellingen"
              @update:model-value="updateCardButton(i, card, $event)"
            />
            <a
              v-else-if="card.buttonLabel"
              :href="card.buttonUrl || undefined"
              :target="card.buttonTarget || '_self'"
              class="mt-2 block w-full rounded-md bg-primary-900 px-6 py-3 text-center text-lg font-bold uppercase text-white shadow transition-colors hover:bg-primary-950"
            >
              {{ card.buttonLabel }}
            </a>
          </div>
          <BlocksSharedItemControls
            v-if="editable && selected"
            label="Prijskaart bewerken"
            direction="horizontal"
            :items="model.content"
            :index="i"
            @update:items="model.content = $event"
          />
        </div>
        <BlocksSharedAddItem
          class="min-h-64"
          v-if="editable"
          label="Prijskaart toevoegen"
          @add="
            model.content = [
              ...(model.content || []),
              {
                title: '',
                label: { text: '', color: null },
                tags: [],
                benefits: [],
                price: '',
                priceNote: '',
                buttonLabel: '',
                buttonUrl: '',
                buttonTarget: '_self',
              },
            ]
          "
        />
      </div>
    </div>
  </section>

  <BlocksSharedBlockSettings
    ref="blockSettingsRef"
    v-if="editable && selected"
    label="Blokinstellingen / items beheren"
    hide-trigger
  >
    <p class="text-sm text-gray-500">
      Prijskaarten beheer je rechtstreeks in het blok.
    </p>
  </BlocksSharedBlockSettings>
</template>
