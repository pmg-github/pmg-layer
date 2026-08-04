<script setup lang="ts">
import { computed, useSlots } from "vue";
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  VisuallyHidden,
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
  title: undefined,
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

const slots = useSlots();

const canClose = computed(() => props.closable && !props.persistent);

const hasVisibleHeader = computed(() => {
  return (
    Boolean(props.title) ||
    Boolean(slots.header) ||
    (props.showCloseButton && canClose.value)
  );
});

const sizeClasses = computed(() => {
  const sizes: Record<NonNullable<Props["size"]>, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    full: "mx-4 max-w-full",
  };

  return sizes[props.size];
});

const backdropClasses = computed(() => {
  const backdrops: Record<NonNullable<Props["backdrop"]>, string> = {
    light: "bg-white/80",
    dark: "bg-black/40",
    blur: "bg-black/40 backdrop-blur-sm",
  };

  return backdrops[props.backdrop];
});

const modelOpen = computed({
  get: () => props.open,
  set: (value: boolean) => {
    if (!value && !canClose.value) {
      return;
    }

    if (!value) {
      emit("close");
    }

    emit("update:open", value);
  },
});

function preventClose(event: Event) {
  if (!canClose.value) {
    event.preventDefault();
  }
}
</script>

<template>
  <DialogRoot v-model:open="modelOpen">
    <DialogPortal>
      <template v-if="open">
        <DialogOverlay
          v-if="overlay"
          :class="[
            'fixed inset-0 z-50 transition-opacity',
            'data-[state=open]:animate-overlayShow',
            backdropClasses,
          ]"
        />

        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <DialogContent
              :aria-describedby="undefined"
              :class="[
                'flex max-h-[90vh] w-full flex-col rounded-xl bg-white shadow-xl outline-none',
                'data-[state=open]:animate-contentShow',
                sizeClasses,
              ]"
              @escape-key-down="preventClose"
              @interact-outside="preventClose"
            >
              <!-- Accessible fallback title when no visible title is provided. -->
              <VisuallyHidden v-if="!title && !$slots.header">
                <DialogTitle>Dialog</DialogTitle>
              </VisuallyHidden>

              <div
                v-if="hasVisibleHeader"
                class="flex flex-shrink-0 items-center justify-between gap-4 p-6 pb-0"
              >
                <slot name="header">
                  <DialogTitle
                    v-if="title"
                    as="h3"
                    class="text-sm font-medium leading-6 text-gray-500"
                  >
                    {{ title }}
                  </DialogTitle>

                  <div v-else />
                </slot>

                <DialogClose v-if="showCloseButton && canClose" as-child>
                  <button
                    type="button"
                    class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                    aria-label="Close modal"
                  >
                    <svg
                      class="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </DialogClose>
              </div>

              <div
                class="flex flex-1 flex-col overflow-hidden p-6"
                :class="hasVisibleHeader ? 'pt-4' : 'pt-6'"
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
      </template>
    </DialogPortal>
  </DialogRoot>
</template>
