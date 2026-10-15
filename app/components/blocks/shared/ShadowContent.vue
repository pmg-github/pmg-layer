<script setup lang="ts">
import DOMPurify from "dompurify";
import { ref, watch } from "vue";

const props = defineProps<{ html: string; editable?: boolean }>();
const host = ref<HTMLElement | null>(null);

function renderContent() {
  if (!host.value) return;

  const shadow =
    host.value.shadowRoot || host.value.attachShadow({ mode: "open" });
  const defaults = document.createElement("style");
  defaults.textContent = `
    :host { display: block; min-width: 0; overflow-wrap: anywhere; }
    :where(*) { box-sizing: border-box; }
    :where(img, video) { max-width: 100%; height: auto; }
    :where(button, input, select, textarea) { font: inherit; color: inherit; }
  `;

  const content = DOMPurify.sanitize(props.html, {
    RETURN_DOM_FRAGMENT: true,
    FORCE_BODY: true,
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["base", "link", "meta", "form"],
    FORBID_ATTR: ["autofocus"],
  });

  content.querySelectorAll('a[target="_blank"]').forEach((link) => {
    link.setAttribute("rel", "noopener noreferrer");
  });
  shadow.replaceChildren(defaults, content);
}

function handleClick(event: MouseEvent) {
  const link = event
    .composedPath()
    .find(
      (node): node is Element =>
        node instanceof Element && node.localName === "a",
    );
  if (!link) return;

  if (props.editable) {
    event.preventDefault();
    return;
  }

  if (
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey ||
    link.getAttribute("target") === "_blank"
  )
    return;
  const href = link.getAttribute("href");
  if (!href?.startsWith("#") || href.length === 1) return;
  let id: string;
  try {
    id = decodeURIComponent(href.slice(1));
  } catch {
    return;
  }
  const target =
    host.value?.shadowRoot?.getElementById(id) || document.getElementById(id);
  if (target) {
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
  }
}

watch([host, () => props.html], renderContent, { flush: "post" });
</script>

<template>
  <div ref="host" data-free-content-shadow @click="handleClick" />
</template>
