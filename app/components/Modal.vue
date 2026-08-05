<script setup lang="ts">
import { computed, useAttrs, useSlots } from "vue";
import { twMerge } from "tailwind-merge";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogOverlay,
  TransitionRoot,
  TransitionChild,
} from "@headlessui/vue";

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
  inert?: boolean;
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

// Called by Headless UI's Dialog on outside click / Escape.
const handleDialogClose = () => {
  if (props.persistent) return;
  closeModal();
};

// Called by the explicit close button.
const handleCloseButtonClick = () => {
  closeModal();
};
</script>

<template>
  <Teleport to="body">
    <TransitionRoot appear :show="open" as="template">
      <Dialog
        as="div"
        class="relative"
        @close="handleDialogClose"
        :style="{ zIndex }"
        :inert="inert"
      >
        <!-- Backdrop -->
        <TransitionChild
          v-if="overlay"
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <DialogOverlay
            :class="['fixed inset-0 transition-opacity', backdropClasses]"
          />
        </TransitionChild>

        <!-- Modal Content -->
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel
                :class="[
                  'flex w-full transform flex-col rounded-xl bg-white shadow-xl transition-all',
                  sizeClasses,
                ]"
              >
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
                    @click="handleCloseButtonClick"
                    class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500"
                    aria-label="Close modal"
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
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </Teleport>
</template>
