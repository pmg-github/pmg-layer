<script setup lang="ts">
import { computed, ref, useAttrs, useSlots } from "vue";
import { twMerge } from "tailwind-merge";
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";

interface Props {
  open: boolean;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  closable?: boolean;
  overlay?: boolean;
  backdrop?: "light" | "dark" | "blur";
  showCloseButton?: boolean;
  persistent?: boolean;
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
  closable: true,
  overlay: true,
  backdrop: "dark",
  showCloseButton: true,
  persistent: false,
  zIndex: 100,
});

defineOptions({ inheritAttrs: false });

const slots = useSlots();
const attrs = useAttrs();
const scrollContainer = ref<HTMLElement | null>(null);

defineExpose({ scrollContainer });

// Split out class so conflicting utilities (e.g. p-6 vs p-0) resolve via twMerge instead of concatenating.
const bodyAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const bodyClasses = computed(() =>
  twMerge(
    "flex-1 p-6",
    props.title || props.showCloseButton || slots.header ? "pt-4" : "pt-6",
    attrs.class as string | undefined,
  ),
);

const emit = defineEmits<{
  close: [];
  "update:open": [value: boolean];
}>();

const sizeClasses = computed(() => {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    full: "max-w-full mx-4",
  };
  return sizes[props.size];
});

const backdropClasses = computed(() => {
  const backdrops = {
    light: "bg-white/80",
    dark: "bg-black/40",
    blur: "bg-black/40 backdrop-blur-sm",
  };
  return backdrops[props.backdrop];
});

const closeModal = () => {
  emit("close");
  emit("update:open", false);
};

const handleOpenChange = (value: boolean) => {
  if (value) {
    emit("update:open", true);
    return;
  }

  if (!props.persistent) closeModal();
};

const handleDismiss = (event: Event) => {
  if (props.persistent) event.preventDefault();
};

// Called by the explicit close button.
const handleCloseButtonClick = () => {
  closeModal();
};
</script>

<template>
  <DialogRoot :open="open" :modal="true" @update:open="handleOpenChange">
    <DialogPortal>
      <!-- Backdrop -->
      <Transition
        appear
        enter-active-class="ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <DialogOverlay
          v-if="open && overlay"
          :class="['fixed inset-0 transition-opacity', backdropClasses]"
          :style="{ zIndex }"
        />
      </Transition>

      <!-- Modal Content -->
      <Transition
        appear
        enter-active-class="ease-out duration-300"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="ease-in duration-200"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="open"
          ref="scrollContainer"
          class="fixed inset-0 overflow-y-auto"
          :style="{ zIndex }"
        >
          <div class="flex min-h-full items-center justify-center p-4">
            <DialogContent
              :class="[
                'flex w-full transform flex-col rounded-xl bg-white shadow-xl transition-all',
                sizeClasses,
              ]"
              @escape-key-down="handleDismiss"
              @pointer-down-outside="handleDismiss"
              @interact-outside="handleDismiss"
            >
              <DialogTitle v-if="!title || $slots.header" class="sr-only">
                {{ title || "Dialog" }}
              </DialogTitle>

              <!-- Fixed Header -->
              <div
                v-if="title || showCloseButton || $slots.header"
                class="flex flex-shrink-0 items-center justify-between p-6 pb-0"
              >
                <slot name="header">
                  <DialogTitle
                    v-if="title"
                    as="h3"
                    class="text-sm font-medium leading-6 text-gray-500"
                  >
                    {{ title }}
                  </DialogTitle>
                  <div v-else></div>
                </slot>

                <button
                  v-if="showCloseButton && closable"
                  type="button"
                  class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500"
                  aria-label="Close modal"
                  @click="handleCloseButtonClick"
                >
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <!-- Scrollable Content -->
              <div :class="bodyClasses" v-bind="bodyAttrs">
                <slot />
              </div>

              <!-- Fixed Footer -->
              <div
                v-if="$slots.footer"
                class="flex-shrink-0 border-t border-gray-200 p-6"
              >
                <slot name="footer" />
              </div>
            </DialogContent>
          </div>
        </div>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>
