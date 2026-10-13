<script setup lang="ts">
import { MIN_BLOCK_PADDING, type BlockPadding } from "../../utils/blockPadding";

const props = defineProps<{
  editable?: boolean;
  selected?: boolean;
  padding?: BlockPadding | null;
}>();

const emit = defineEmits<{
  "update:padding": [padding: BlockPadding];
}>();

const handle = ref<HTMLElement | null>(null);
const dashboardControlled = ref(false);
let drag: {
  side: "top" | "bottom";
  startY: number;
  startPadding: number;
  target: HTMLElement;
  value: number;
} | null = null;

function stopDrag(event?: PointerEvent) {
  if (!drag) return;
  const { side, target, value } = drag;
  drag = null;
  window.removeEventListener("pointermove", moveDrag);
  window.removeEventListener("pointerup", stopDrag);
  window.removeEventListener("pointercancel", stopDrag);
  if (event?.type === "pointercancel") {
    target.style.removeProperty(`padding-${side}`);
    return;
  }
  emit("update:padding", { ...props.padding, [side]: value });
}

function moveDrag(event: PointerEvent) {
  if (!drag) return;
  const delta = (event.clientY - drag.startY) * (drag.side === "top" ? -1 : 1);
  drag.value = Math.min(320, Math.max(MIN_BLOCK_PADDING, Math.round(drag.startPadding + delta)));
  drag.target.style.setProperty(`padding-${drag.side}`, `${drag.value}px`);
}

function startDrag(side: "top" | "bottom", event: PointerEvent) {
  if (!props.editable || !props.selected || !handle.value) return;
  const section = handle.value.closest("section");
  const target = section?.querySelector<HTMLElement>("[data-block-padding]");
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  drag = {
    side,
    startY: event.clientY,
    startPadding: Math.max(MIN_BLOCK_PADDING, parseFloat(getComputedStyle(target)[`padding${side === "top" ? "Top" : "Bottom"}`]) || 0),
    target,
    value: 0,
  };
  drag.value = drag.startPadding;
  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);
}

function nudge(side: "top" | "bottom", event: KeyboardEvent) {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
  event.preventDefault();
  const section = handle.value?.closest("section");
  const target = section?.querySelector<HTMLElement>("[data-block-padding]");
  if (!target) return;
  const current = parseFloat(getComputedStyle(target)[`padding${side === "top" ? "Top" : "Bottom"}`]) || 0;
  const direction = event.key === "ArrowDown" ? 1 : -1;
  const value = Math.min(320, Math.max(MIN_BLOCK_PADDING, current + direction * (side === "top" ? -8 : 8)));
  target.style.setProperty(`padding-${side}`, `${value}px`);
  emit("update:padding", { ...props.padding, [side]: value });
}

onUnmounted(() => stopDrag(new PointerEvent("pointercancel")));
const detectDashboard = async () => {
  await nextTick();
  if (handle.value?.closest("[data-dashboard-padding-canvas]")) {
    dashboardControlled.value = true;
  }
};
onMounted(detectDashboard);
watch(() => props.selected, detectDashboard);
</script>

<template>
  <div v-if="editable && selected && !dashboardControlled" ref="handle" class="pointer-events-none absolute inset-0 z-40">
    <button
      v-for="side in (['top', 'bottom'] as const)"
      :key="side"
      type="button"
      class="pointer-events-auto absolute left-1/2 flex h-7 w-32 -translate-x-1/2 cursor-ns-resize touch-none items-center justify-center"
      :class="side === 'top' ? 'top-0' : 'bottom-0'"
      :aria-label="side === 'top' ? 'Sleep om ruimte boven aan te passen' : 'Sleep om ruimte onder aan te passen'"
      @pointerdown="startDrag(side, $event)"
      @keydown="nudge(side, $event)"
    >
      <span class="rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold text-gray-600 shadow">
        {{ side === 'top' ? 'Boven' : 'Onder' }} slepen
      </span>
    </button>
  </div>
</template>
