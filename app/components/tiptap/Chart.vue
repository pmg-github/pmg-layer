<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/vue-3";
import { DialogDescription } from "reka-ui";
import Modal from "../Modal.vue";
import {
  chartCoordinates,
  chartPalettes,
  chartSlicePath,
  chartTypes,
  createChartData,
  maxChartPoints,
  parseChartCsv,
  validateChart,
  type ChartData,
  type ChartType,
} from "../../utils/chart";

const props = defineProps<NodeViewProps>();
const isEditable = ref(props.editor.isEditable);
watch(
  () => props.editor,
  (editor, _, onCleanup) => {
    const syncEditable = () => {
      isEditable.value = editor.isEditable;
    };
    syncEditable();
    editor.on("update", syncEditable);
    editor.on("transaction", syncEditable);
    onCleanup(() => {
      editor.off("update", syncEditable);
      editor.off("transaction", syncEditable);
    });
  },
  { immediate: true },
);
const stored = computed(() => validateChart(props.node.attrs.chart));
const isEmpty = computed(() => {
  const data: unknown = props.node.attrs.chart;
  return (
    data !== null &&
    typeof data === "object" &&
    "title" in data &&
    data.title === "" &&
    "points" in data &&
    Array.isArray(data.points) &&
    !data.points.length
  );
});
const isOpen = ref(false);
const showAdvanced = ref(false);
const csvInput = ref<HTMLInputElement | null>(null);
const settingsId = useId();
const typeDescriptions: Record<ChartType, string> = {
  bar: "Vergelijk categorieen met elkaar.",
  line: "Toon een evolutie of verloop.",
  pie: "Toon de delen van een geheel.",
  donut: "Zoals een taart, met een open midden.",
};
type ChartDraft = Omit<ChartData, "points"> & {
  points: { label: string; value: number | string }[];
};
const draft = ref<ChartDraft>(createChartData());
const isCircularDraft = computed(
  () => draft.value.type === "pie" || draft.value.type === "donut",
);
const saveError = ref("");
const csvError = ref("");
const csvStatus = ref("");
let csvRequest = 0;
const hoveredIndex = ref<number | null>(null);
const focusedIndex = ref<number | null>(null);
const activeIndex = computed(() => hoveredIndex.value ?? focusedIndex.value);
watch(
  () => props.node.attrs.chart,
  () => {
    hoveredIndex.value = null;
    focusedIndex.value = null;
  },
  { deep: true },
);

const numberFormat = new Intl.NumberFormat("nl-BE", {
  maximumSignificantDigits: 21,
});
const percentFormat = new Intl.NumberFormat("nl-BE", {
  style: "percent",
  maximumFractionDigits: 1,
});
const tickFormat = new Intl.NumberFormat("nl-BE", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const shortLabel = (label: string) =>
  label.length > 12 ? `${label.slice(0, 11)}...` : label;

function chartView(data: ChartData | null) {
  if (!data) return null;
  const geometry = chartCoordinates(data.points);
  const circular = data.type === "pie" || data.type === "donut";
  const colors = chartPalettes.find(
    (palette) => palette.value === data.palette,
  )!.colors;
  const color = (index: number) => colors[index % colors.length];
  const total = data.points.reduce((sum, point) => sum + point.value, 0);
  let start = 0;
  const slices = circular
    ? data.points.map((point) => {
        const fraction = point.value / total;
        const path = chartSlicePath(start, fraction, data.type === "donut");
        start += fraction;
        return { path, fraction };
      })
    : [];
  const pointText = (index: number) => {
    const point = data.points[index];
    if (!point) return "";
    const slice = slices[index];
    const percentage = slice
      ? ` (${percentFormat.format(slice.fraction)})`
      : "";
    return `${point.label}: ${numberFormat.format(point.value)}${data.unit ? ` ${data.unit}` : ""}${percentage}`;
  };
  const tooltipAt = (index: number) => {
    const point = data.points[index];
    const position = geometry.points[index];
    if (!point || !position) return null;

    let { x, y } = position;
    const slice = slices[index];
    if (circular && slice) {
      const previousFraction = slices
        .slice(0, index)
        .reduce((sum, item) => sum + item.fraction, 0);
      const angle =
        (previousFraction + slice.fraction / 2) * 2 * Math.PI - Math.PI / 2;
      const radius = data.type === "donut" ? 103 : 65;
      x = 320 + Math.cos(angle) * radius;
      y = 170 + Math.sin(angle) * radius;
    }

    return {
      x,
      y,
      label: shortLabel(point.label),
      value: `${numberFormat.format(point.value)}${data.unit ? ` ${data.unit}` : ""}${slice ? ` (${percentFormat.format(slice.fraction)})` : ""}`,
    };
  };
  return {
    ...data,
    geometry,
    circular,
    color,
    slices,
    pointText,
    tooltipAt,
    viewBox: { x: 0, y: circular ? -10 : 20, width: 640, height: 360 },
    linePath: geometry.points
      .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`)
      .join(" "),
    showTickLabel: (index: number) =>
      index % Math.ceil(data.points.length / 6) === 0,
  };
}

const chart = computed(() => chartView(stored.value.data));
const activeTooltip = computed(() => {
  if (activeIndex.value === null || !chart.value) return null;

  const tooltip = chart.value.tooltipAt(activeIndex.value);
  if (!tooltip) return null;

  return {
    ...tooltip,
    label: chart.value.points[activeIndex.value]?.label ?? tooltip.label,
    x: ((tooltip.x - chart.value.viewBox.x) / chart.value.viewBox.width) * 100,
    y: ((tooltip.y - chart.value.viewBox.y) / chart.value.viewBox.height) * 100,
    below: tooltip.y - chart.value.viewBox.y < chart.value.viewBox.height * 0.3,
  };
});

function openSettings() {
  if (!props.editor.isEditable) return;
  const data = stored.value.data ?? createChartData();
  draft.value = { ...data, points: data.points.map((point) => ({ ...point })) };
  if (!draft.value.points.length)
    draft.value.points.push({ label: "", value: "" });
  saveError.value = "";
  csvError.value = "";
  csvStatus.value = "";
  csvRequest++;
  showAdvanced.value = false;
  isOpen.value = true;
}

async function importCsv(event: Event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  const request = ++csvRequest;
  csvError.value = "";
  csvStatus.value = "";
  try {
    const text = await file.text();
    if (request !== csvRequest || !isOpen.value || !props.editor.isEditable) return;
    const result = parseChartCsv(text);
    if (result.points === null) {
      csvError.value = result.error;
      return;
    }
    draft.value.points = result.points;
    csvStatus.value = `${result.points.length} rijen geïmporteerd uit ${file.name}.`;
  } catch (error) {
    if (request !== csvRequest || !isOpen.value) return;
    console.error("[Chart] CSV-bestand lezen mislukt.", error);
    csvError.value = "Het CSV-bestand kon niet worden gelezen.";
  }
}

function save() {
  if (!props.editor.isEditable) return;
  const result = validateChart(draft.value);
  if (!result.data) {
    saveError.value = result.error;
    return;
  }
  props.updateAttributes({ chart: result.data });
  isOpen.value = false;
}

function removeChart() {
  if (!props.editor.isEditable) return;
  isOpen.value = false;
  props.deleteNode();
}

function movePoint(index: number, direction: -1 | 1) {
  const destination = index + direction;
  if (destination < 0 || destination >= draft.value.points.length) return;
  const [point] = draft.value.points.splice(index, 1);
  if (point) draft.value.points.splice(destination, 0, point);
}

function selectNode() {
  if (!props.editor.isEditable) return;
  const position = props.getPos();
  if (typeof position === "number") {
    props.editor.chain().focus().setNodeSelection(position).run();
  }
}

watch(isEditable, (editable) => {
  if (!editable) isOpen.value = false;
});
watch(isOpen, (open) => {
  if (!open) csvRequest++;
});
watch(
  draft,
  () => {
    saveError.value = "";
  },
  { deep: true },
);
</script>

<template>
  <NodeViewWrapper
    as="section"
    class="relative my-4 box-border w-full max-w-full rounded-lg"
    :class="{ 'ring-2 ring-blue-400 ring-offset-2': selected }"
    :contenteditable="false"
  >
    <button
      v-if="isEditable && chart"
      type="button"
      class="absolute right-2 top-2 z-[2] flex items-center justify-center rounded-full bg-gray-800 bg-opacity-70 p-2 text-white transition-all hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
      title="Grafiek bewerken"
      aria-label="Grafiek bewerken"
      @click.stop="openSettings"
    >
      <Icon
        name="material-symbols:edit-outline"
        class="size-5"
        aria-hidden="true"
      />
    </button>
    <figure v-if="chart" class="article-chart" :aria-label="chart.title.trim() || 'Grafiek'">
      <figcaption v-if="chart.title.trim() || chart.description" :class="{ 'pr-12': isEditable }">
        <h3 v-if="chart.title.trim()" class="chart-title">{{ chart.title }}</h3>
        <p v-if="chart.description" class="chart-description">
          {{ chart.description }}
        </p>
      </figcaption>
      <div class="chart-graphic-container">
      <!-- Explicit geometry attributes also work during SVG hydration. -->
      <svg
        :viewBox="`${chart.viewBox.x} ${chart.viewBox.y} ${chart.viewBox.width} ${chart.viewBox.height}`"
        class="chart-graphic"
        role="group"
        :aria-label="chart.title.trim() || 'Grafiek'"
      >
        <template v-if="!chart.circular">
          <g
            v-for="(tick, index) in chart.geometry.ticks"
            :key="index"
            aria-hidden="true"
          >
            <line
              x1="90"
              x2="610"
              :y1.attr="tick.y"
              :y2.attr="tick.y"
              stroke="#e2e8f0"
            />
            <text
              x="80"
              :y.attr="tick.y + 4"
              text-anchor="end"
              class="axis-label"
            >
              {{ tickFormat.format(tick.value) }}
            </text>
          </g>
          <line
            x1="90"
            x2="90"
            y1="40"
            y2="300"
            stroke="#64748b"
            stroke-width="1.5"
          />
          <line
            x1="90"
            x2="610"
            :y1.attr="chart.geometry.baseline"
            :y2.attr="chart.geometry.baseline"
            stroke="#64748b"
            stroke-width="1.5"
          />
          <text
            v-if="chart.yAxisLabel"
            x="22"
            y="170"
            text-anchor="middle"
            class="axis-title"
            transform="rotate(-90 22 170)"
          >
            {{ chart.yAxisLabel }}
          </text>
          <text
            v-if="chart.xAxisLabel"
            x="350"
            y="365"
            text-anchor="middle"
            class="axis-title"
          >
            {{ chart.xAxisLabel }}
          </text>
          <path
            v-if="chart.type === 'line'"
            :d.attr="chart.linePath"
            fill="none"
            :stroke="chart.color(0)"
            stroke-width="3"
          />
        </template>
        <g
          v-for="(point, index) in chart.geometry.points"
          :key="index"
          tabindex="0"
          role="img"
          :aria-label="chart.pointText(index)"
          class="chart-point"
          :class="{
            'is-muted': activeIndex !== null && activeIndex !== index,
          }"
          @mouseenter="hoveredIndex = index"
          @mouseleave="hoveredIndex = null"
          @focus="focusedIndex = index"
          @blur="focusedIndex = null"
          @click="focusedIndex = index"
        >
          <template v-if="chart.circular">
            <path
              v-if="point.value > 0"
              :d.attr="chart.slices[index]?.path"
              :fill="chart.color(index)"
              stroke="white"
              stroke-width="2"
            />
          </template>
          <rect
            v-else-if="chart.type === 'bar'"
            :x.attr="point.x - 180 / chart.points.length"
            :y.attr="Math.min(point.y, chart.geometry.baseline)"
            :width.attr="360 / chart.points.length"
            :height.attr="
              Math.max(1, Math.abs(point.y - chart.geometry.baseline))
            "
            :fill="chart.color(index)"
            rx="2"
          />
          <template v-else>
            <circle
              :cx.attr="point.x"
              :cy.attr="point.y"
              r="14"
              fill="transparent"
            />
            <circle
              :cx.attr="point.x"
              :cy.attr="point.y"
              :r.attr="activeIndex === index ? 7 : 5"
              :fill="chart.color(0)"
              stroke="white"
              stroke-width="2"
            />
          </template>
          <text
            v-if="!chart.circular && chart.showTickLabel(index)"
            :x.attr="point.x"
            y="325"
            text-anchor="middle"
            class="axis-label"
            aria-hidden="true"
          >
            {{ shortLabel(point.label) }}
          </text>
        </g>
      </svg>
      <div
        v-if="activeTooltip"
        class="chart-tooltip"
        :class="{ 'is-below': activeTooltip.below }"
        :style="{ left: `clamp(0px, calc(${activeTooltip.x}% - min(7rem, 50%)), calc(100% - min(14rem, 100%)))`, top: `${activeTooltip.y}%` }"
        role="tooltip"
      >
        <div class="chart-tooltip-label">{{ activeTooltip.label }}</div>
        <div class="chart-tooltip-value">{{ activeTooltip.value }}</div>
      </div>
      </div>
      <p v-if="chart.source" class="chart-source">Bron: {{ chart.source }}</p>
    </figure>
    <div
      v-else-if="isEmpty"
      class="relative flex min-h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 pb-8 pt-14 transition-all"
      :class="{
        'cursor-pointer hover:border-blue-400 hover:bg-blue-50': isEditable,
      }"
      @click="selectNode"
    >
      <div class="absolute left-3 top-3">
        <span
          class="inline-block rounded-full bg-gray-800 px-2 py-1 text-xs font-semibold text-white"
          >Grafiek</span
        >
      </div>
      <Icon
        name="material-symbols:bar-chart"
        class="mb-4 size-12 text-gray-400"
        aria-hidden="true"
      />
      <h3 class="mb-2 text-center text-lg font-medium text-gray-700">
        Nog geen grafiek toegevoegd
      </h3>
      <p
        v-if="isEditable"
        class="mb-4 max-w-xs text-center text-sm text-gray-500"
      >
        Kies een grafiektype en voeg je gegevens toe.
      </p>
      <button
        v-if="isEditable"
        type="button"
        class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        @click.stop="openSettings"
      >
        Grafiek instellen
      </button>
    </div>
    <div
      v-else
      class="flex min-h-64 flex-col items-center justify-center rounded-lg bg-amber-50 px-6 pb-8 pt-14 text-center"
      role="alert"
    >
      <Icon
        name="material-symbols:bar-chart"
        class="mb-4 size-12 text-amber-600"
        aria-hidden="true"
      />
      <h3 class="mb-2 text-lg font-medium text-gray-700">
        Grafiek niet beschikbaar
      </h3>
      <p class="text-sm text-gray-600">{{ stored.error }}</p>
      <button
        v-if="isEditable"
        type="button"
        class="mt-4 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        @click.stop="openSettings"
      >
        Grafiek opnieuw instellen
      </button>
    </div>

    <Modal
      :open="isEditable && isOpen"
      title="Grafiek instellen"
      size="2xl"
      class="chart-settings max-h-[calc(100dvh-14rem)] overflow-y-auto"
      @update:open="isOpen = $event"
    >
      <form
        :id="`${settingsId}-form`"
        class="min-w-0 space-y-4"
        @submit.prevent="save"
      >
        <DialogDescription class="text-sm text-gray-600">
          Kies een weergave en vul je gegevens in. Je wijzigingen worden pas
          bewaard wanneer je opslaat.
        </DialogDescription>
        <fieldset>
          <legend class="chart-section-title">Grafiektype</legend>
          <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label
              v-for="type in chartTypes"
              :key="type.value"
              class="chart-choice"
              :title="typeDescriptions[type.value]"
            >
              <input
                v-model="draft.type"
                class="sr-only"
                type="radio"
                :name="`${settingsId}-type`"
                :value="type.value"
              />
              <svg
                viewBox="0 0 40 32"
                class="h-6 w-8 shrink-0 text-blue-600"
                fill="none"
                aria-hidden="true"
              >
                <g v-if="type.value === 'bar'" fill="currentColor">
                  <rect x="4" y="16" width="7" height="13" rx="1" />
                  <rect x="16" y="4" width="7" height="25" rx="1" />
                  <rect x="28" y="10" width="7" height="19" rx="1" />
                </g>
                <path
                  v-else-if="type.value === 'line'"
                  d="M4 25 14 14 24 19 36 5"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <g v-else>
                  <circle
                    cx="20"
                    cy="16"
                    r="13"
                    fill="currentColor"
                    opacity=".2"
                  />
                  <path d="M20 3 A13 13 0 0 1 33 16 H20Z" fill="currentColor" />
                  <circle
                    v-if="type.value === 'donut'"
                    cx="20"
                    cy="16"
                    r="7"
                    fill="white"
                  />
                </g>
              </svg>
              <span class="text-sm font-medium">{{ type.label }}</span>
              <span class="sr-only">{{
                typeDescriptions[type.value]
              }}</span>
            </label>
          </div>
        </fieldset>

        <label class="chart-field">
          <span>Titel <span class="chart-optional">(optioneel)</span></span>
          <input
            v-model="draft.title"
            type="text"
            placeholder="Bijv. Hoe verplaatsen we ons naar het werk?"
          />
        </label>

        <fieldset class="space-y-4">
          <legend class="chart-section-title mb-3">
            Gegevens
          </legend>
          <div>
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs text-gray-500"
                >{{ draft.points.length }} / {{ maxChartPoints }} rijen</span
              >
              <input
                ref="csvInput"
                class="hidden"
                type="file"
                accept=".csv,.tsv,text/csv,text/tab-separated-values"
                aria-label="CSV-bestand kiezen"
                @change="importCsv"
              />
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50"
                :aria-describedby="`${settingsId}-csv-help`"
                @click="csvInput?.click()"
              >
                <Icon name="material-symbols:upload" class="size-4" aria-hidden="true" />
                CSV importeren
              </button>
            </div>
            <p :id="`${settingsId}-csv-help`" class="mb-3 text-xs text-gray-500">
              Kolommen en scheidingstekens worden automatisch herkend, ook bij
              extra kolommen. Importeren vervangt de rijen.
            </p>
            <p v-if="csvError" class="mb-3 text-sm text-red-700" role="alert">{{ csvError }}</p>
            <p v-if="csvStatus" class="mb-3 text-sm text-green-700" role="status">{{ csvStatus }}</p>
            <div class="space-y-2">
              <div
                v-for="(point, index) in draft.points"
                :key="index"
                class="chart-data-row"
              >
                <span
                  class="pt-8 text-center text-xs text-gray-500"
                  aria-hidden="true"
                  >{{ index + 1 }}</span
                >
                <label class="chart-field">
                  <span class="text-xs"
                    >Naam <span class="sr-only">rij {{ index + 1 }}</span></span
                  >
                  <input
                    v-model="point.label"
                    type="text"
                    :placeholder="index === 0 ? 'Bijv. Fiets' : 'Naam'"
                    required
                  />
                </label>
                <label class="chart-field">
                  <span class="text-xs"
                    >Waarde
                    <span class="sr-only">rij {{ index + 1 }}</span></span
                  >
                  <input
                    v-model.number="point.value"
                    type="number"
                    step="any"
                    :min="isCircularDraft ? 0 : undefined"
                    :placeholder="index === 0 ? 'Bijv. 38' : '0'"
                    required
                  />
                </label>
                <div class="chart-row-actions">
                  <button
                    type="button"
                    class="chart-row-button"
                    :disabled="index === 0"
                    :aria-label="`Rij ${index + 1} omhoog`"
                    title="Rij omhoog"
                    @click="movePoint(index, -1)"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      class="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="m5 10 5-5 5 5M10 5v11" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="chart-row-button"
                    :disabled="index === draft.points.length - 1"
                    :aria-label="`Rij ${index + 1} omlaag`"
                    title="Rij omlaag"
                    @click="movePoint(index, 1)"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      class="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="m5 10 5 5 5-5M10 15V4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="chart-row-button text-red-700"
                    :aria-label="`Rij ${index + 1} verwijderen`"
                    title="Rij verwijderen"
                    @click="draft.points.splice(index, 1)"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      class="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M3 5h14M8 3h4M5 5l1 12h8l1-12M8 8v6m4-6v6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <p
              v-if="!draft.points.length"
              class="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600"
            >
              Nog geen gegevens. Voeg een rij toe om te beginnen.
            </p>
            <button
              type="button"
              class="mt-3 rounded border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
              :disabled="draft.points.length >= maxChartPoints"
              @click="draft.points.push({ label: '', value: '' })"
            >
              + Rij toevoegen
            </button>
            <p
              v-if="draft.points.length >= maxChartPoints"
              class="mt-2 text-xs text-gray-600"
              role="status"
            >
              Je hebt het maximum van {{ maxChartPoints }} rijen bereikt.
            </p>
            <p
              v-if="isCircularDraft"
              class="mt-3 text-xs leading-5 text-gray-600"
            >
              Gebruik geen negatieve waarden. Het totaal moet groter zijn dan
              nul; percentages worden automatisch berekend.
            </p>
            <p
              v-else-if="draft.type === 'line'"
              class="mt-3 text-xs leading-5 text-gray-600"
            >
              Zet je gegevens in de gewenste volgorde. Elk punt staat op gelijke
              afstand, ook bij datums.
            </p>
          </div>
        </fieldset>

        <div class="border-t border-gray-200 pt-4">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded py-1 text-left text-sm text-gray-600 transition hover:text-gray-900"
            :aria-expanded="showAdvanced"
            :aria-controls="`${settingsId}-advanced`"
            @click="showAdvanced = !showAdvanced"
          >
            Geavanceerd
            <Icon
              :name="showAdvanced ? 'material-symbols:expand-less' : 'material-symbols:expand-more'"
              class="size-5"
              aria-hidden="true"
            />
          </button>
          <div v-show="showAdvanced" :id="`${settingsId}-advanced`" class="mt-4 space-y-4">
            <label class="chart-field">
              <span>Eenheid <span class="chart-optional">(optioneel)</span></span>
              <input
                v-model="draft.unit"
                type="text"
                placeholder="Bijv. %, euro of inwoners"
              />
            </label>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="chart-field">
                <span>X-aslabel <span class="chart-optional">(optioneel)</span></span>
                <input
                  v-model="draft.xAxisLabel"
                  type="text"
                  placeholder="Bijv. Jaar"
                />
              </label>
              <label class="chart-field">
                <span>Y-aslabel <span class="chart-optional">(optioneel)</span></span>
                <input
                  v-model="draft.yAxisLabel"
                  type="text"
                  placeholder="Bijv. Aantal inwoners"
                />
              </label>
            </div>
            <label class="chart-field">
              <span
                >Toelichting <span class="chart-optional">(optioneel)</span></span
              >
              <textarea
                v-model="draft.description"
                rows="2"
                placeholder="Wat moet de lezer weten over deze cijfers?"
              />
            </label>
            <label class="chart-field">
              <span
                >Bronvermelding
                <span class="chart-optional">(optioneel)</span></span
              >
              <input
                v-model="draft.source"
                type="text"
                placeholder="Bijv. Statbel, 2026"
              />
            </label>
          </div>
        </div>
      </form>
      <template #footer>
        <div
          class="chart-settings flex flex-wrap items-center justify-end gap-3"
        >
          <p v-if="saveError" class="w-full text-sm text-red-700" role="alert">
            {{ saveError }}
          </p>
          <button
            type="button"
            class="mr-auto rounded px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
            aria-label="Grafiek verwijderen"
            @click="removeChart"
          >
            Verwijderen
          </button>
          <div class="ml-auto flex gap-2">
            <button
              type="button"
              class="rounded px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
              @click="isOpen = false"
            >
              Annuleren
            </button>
            <button
              type="submit"
              :form="`${settingsId}-form`"
              class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Grafiek opslaan
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </NodeViewWrapper>
</template>

<style scoped>
.article-chart {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: #eff6ff;
  color: #0f172a;
  overflow-wrap: anywhere;
}
.chart-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}
.chart-description,
.chart-source {
  margin: 0.35rem 0;
  color: #475569;
  font-size: 0.875rem;
  white-space: pre-line;
}
.chart-graphic {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.chart-graphic-container {
  position: relative;
  aspect-ratio: 16 / 9;
}
.axis-label {
  font-size: 12px;
  fill: #475569;
}
.axis-title {
  font-size: 13px;
  font-weight: 600;
  fill: #334155;
}
.chart-point {
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.chart-point.is-muted {
  opacity: 0.35;
}
.chart-point:focus {
  outline: 2px solid #0f172a;
  outline-offset: 3px;
}
.chart-tooltip {
  position: absolute;
  z-index: 1;
  width: min(14rem, 100%);
  transform: translateY(calc(-100% - 0.5rem));
  padding: 0.5rem;
  border-radius: 0.375rem;
  background: #0f172a;
  color: white;
  font-size: 0.75rem;
  line-height: 1.4;
  box-shadow: 0 2px 3px rgb(15 23 42 / 25%);
  pointer-events: none;
}
.chart-tooltip.is-below {
  transform: translateY(0.5rem);
}
.chart-tooltip-label {
  font-weight: 600;
}
.chart-tooltip-value {
  color: #e2e8f0;
}
@media (prefers-reduced-motion: reduce) {
  .chart-point {
    transition: none;
  }
}
@media (max-width: 480px) {
  .article-chart {
    padding: 0.75rem;
  }
}
.chart-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 400;
  color: #4b5563;
}
.chart-section-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}
.chart-optional {
  font-size: 0.75rem;
  font-weight: 400;
  color: #6b7280;
}
.chart-choice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  cursor: pointer;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.5rem;
  background: white;
  color: #374151;
}
.chart-choice:hover {
  border-color: #93c5fd;
  background: #f9fafb;
}
.chart-choice:has(input:checked) {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #2563eb;
}
.chart-choice:has(input:focus-visible) {
  outline: 2px solid #2563eb;
  outline-offset: 3px;
}
.chart-data-row {
  display: grid;
  grid-template-columns: 1rem minmax(0, 1fr) minmax(0, 0.7fr) auto;
  align-items: start;
  gap: 0.5rem;
  border-radius: 0.25rem;
  background: #f9fafb;
  padding: 0.5rem;
}
.chart-row-actions {
  display: flex;
  padding-top: 1.375rem;
}
.chart-row-button {
  display: inline-flex;
  min-width: 2rem;
  min-height: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
}
.chart-row-button:hover:not(:disabled) {
  background: #e5e7eb;
}
@media (max-width: 639px) {
  .chart-data-row {
    grid-template-columns: 1rem minmax(0, 1fr) minmax(0, 0.7fr);
  }
  .chart-row-actions {
    grid-column: 2 / -1;
    justify-content: flex-end;
    padding-top: 0;
  }
  .chart-row-button {
    min-width: 2.75rem;
    min-height: 2.75rem;
  }
}
.chart-field input,
.chart-field select,
.chart-field textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: white;
  color: #111827;
  font-weight: 400;
}
.chart-settings button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.chart-settings
  :is(input:not([type="radio"]), select, textarea, button):focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
</style>
