<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { Node } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import ChartExtension from "../../app/utils/extensions/chart";
import type { ChartData } from "../../app/utils/chart";

const example: ChartData = {
  type: "bar",
  title: "Hoe verplaatsen we ons naar het werk?",
  description: "Fictieve voorbeeldgegevens, geen onderzoeksresultaten.",
  unit: "%",
  source: "Demonstratie PMG",
  palette: "categorical",
  points: [
    { label: "Fiets", value: 38 },
    { label: "Auto", value: 32 },
    { label: "Openbaar vervoer", value: 22 },
    { label: "Te voet", value: 8 },
  ],
};
const editable = ref(true);
const editor = useEditor({
  extensions: [
    Node.create({ name: "doc", topNode: true, content: "block+" }),
    Node.create({
      name: "paragraph",
      group: "block",
      content: "inline*",
      parseHTML: () => [{ tag: "p" }],
      renderHTML: () => ["p", 0],
    }),
    Node.create({ name: "text", group: "inline" }),
    ChartExtension,
  ],
  content: {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Een grafiek tussen de tekst van een artikel." }] },
      { type: "chart", attrs: { chart: example } },
      { type: "paragraph", content: [{ type: "text", text: "Het artikel gaat hier verder." }] },
    ],
  },
});
function toggleEditable() {
  editable.value = !editable.value;
  editor.value?.setEditable(editable.value);
}
function reloadHtml() {
  if (editor.value) editor.value.commands.setContent(editor.value.getHTML());
}
onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <main class="mx-auto max-w-4xl space-y-8 p-4 sm:p-8">
    <h1 class="text-3xl font-bold">Artikelgrafieken</h1>
    <section>
      <h2 class="mb-3 text-xl font-semibold">TipTap-artikelblok</h2>
      <div class="mb-4 flex flex-wrap gap-3">
        <button type="button" class="rounded border px-3 py-2" @click="toggleEditable">{{ editable ? 'Lezersweergave' : 'Bewerken' }}</button>
        <button v-if="editable" type="button" class="rounded border px-3 py-2" @click="editor?.chain().focus().insertChart().run()">Grafiek toevoegen</button>
        <button v-if="editable" type="button" class="rounded border px-3 py-2" @click="reloadHtml">HTML opnieuw laden</button>
      </div>
      <div class="pmg-article">
        <EditorContent :editor="editor" class="rounded-xl border border-gray-200 p-4" />
      </div>
    </section>
  </main>
</template>
