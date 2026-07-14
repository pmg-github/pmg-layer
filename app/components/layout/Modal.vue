<script setup lang="ts">
import { computed } from "vue";
import {
  DialogRoot,
  DialogPortal,
  DialogContent,
  DialogTitle,
  DialogOverlay,
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
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
  closable: true,
  overlay: true,
  backdrop: "dark",
  showCloseButton: true,
  persistent: false,
});

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

const handleClose = () => {
  if (!props.closable) return;
  emit("close");
  emit("update:open", false);
};

const handleOpenChange = (value: boolean) => {
  if (value) {
    emit("update:open", true);
    return;
  }

  if (props.persistent || !props.closable) {
    return;
  }

  handleClose();
};
</script>

<template>
  <DialogRoot :open="open" @update:open="handleOpenChange">
    <DialogPortal>
      <DialogOverlay
        v-if="overlay"
        :class="['fixed inset-0 z-50 transition-opacity', backdropClasses]"
      />

      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <DialogContent
            :class="[
              'flex max-h-[90vh] w-full flex-col rounded-xl bg-white shadow-xl outline-none',
              sizeClasses,
            ]"
            @escape-key-down="
              persistent || !closable ? $event.preventDefault() : undefined
            "
            @pointer-down-outside="
              persistent || !closable ? $event.preventDefault() : undefined
            "
            @interact-outside="
              persistent || !closable ? $event.preventDefault() : undefined
            "
          >
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
                @click="handleClose"
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

            <div
              class="flex-1 overflow-y-auto p-6"
              :class="{
                'pt-6': !title && !showCloseButton && !$slots.header,
                'pt-4': title || showCloseButton || $slots.header,
              }"
            >
              <slot />
            </div>

            <div
              v-if="$slots.footer"
              class="flex-shrink-0 border-t border-gray-200 p-6"
            >
              <slot name="footer" />
            </div>
          </DialogContent>
        </div>
      </div>
    </DialogPortal>
  </DialogRoot>
</template>
