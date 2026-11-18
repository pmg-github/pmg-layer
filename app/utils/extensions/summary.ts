import { tryUseNuxtApp } from "#app";
import type { EditorPromptOptions } from "./editorPrompts";
import { VueNodeViewRenderer, type NodeViewProps } from "@tiptap/vue-3";
import { unref, type Component } from "vue";
import { Node } from "@tiptap/core";
import { Plugin, type Transaction } from "@tiptap/pm/state";
import Summary from "../../components/tiptap/Summary.vue";

export interface SummaryAttributes {
  print?: boolean;
}

export interface SummaryStorage {
  getDefaultTitle: () => string;
}

/** Fallback heading for editors without a supported locale. */
export const SUMMARY_TITLE = "In het kort";

const summaryTitles = new Map([
  ["fr", "En bref"],
  ["en", "In brief"],
]);

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    summary: {
      insertSummary: (attributes?: SummaryAttributes) => ReturnType;
    };
  }
}

export default Node.create<EditorPromptOptions, SummaryStorage>({
  name: "summary",
  group: "block",
  content: "(heading|paragraph|list)+",
  selectable: true,
  draggable: true,

  addOptions() {
    return { aiPrompt: undefined };
  },

  addStorage() {
    return { getDefaultTitle: () => SUMMARY_TITLE };
  },

  onBeforeCreate() {
    // Capture the composer during editor setup; read the locale at insertion time.
    const i18n = tryUseNuxtApp()?.$i18n;
    this.storage.getDefaultTitle = () => {
      const language = unref(i18n?.locale)?.toLowerCase().split("-")[0] ?? "";
      return summaryTitles.get(language) ?? SUMMARY_TITLE;
    };
  },

  addAttributes() {
    return {
      print: {
        default: true,
        parseHTML: (element) => element.getAttribute("data-print") !== "false",
        renderHTML: (attributes) => ({
          "data-print": String(attributes.print !== false),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-summary]" }];
  },

  // Summaries are always yellow; any stored color is ignored.
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { "data-summary": "true", ...HTMLAttributes, "data-color": "yellow" },
      0,
    ];
  },

  addCommands() {
    return {
      insertSummary:
        (attributes = {}) =>
        ({ commands }) =>
          commands.insertContent([
            {
              type: this.name,
              attrs: { print: true, ...attributes },
              content: [
                {
                  type: "heading",
                  attrs: { level: 2 },
                  content: [{ type: "text", text: this.storage.getDefaultTitle() }],
                },
                {
                  type: "bulletList",
                  content: [
                    { type: "listItem", content: [{ type: "paragraph" }] },
                  ],
                },
              ],
            },
            { type: "paragraph" },
          ]),
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(Summary as Component<NodeViewProps>);
  },

  // Only h2-h4 are allowed inside a summary.
  addProseMirrorPlugins() {
    const name = this.name;
    return [
      new Plugin({
        appendTransaction: (transactions, _oldState, state) => {
          if (!transactions.some((t) => t.docChanged)) return null;
          let tr: Transaction | null = null;
          state.doc.descendants((node, pos, parent) => {
            if (node.type.name !== "heading") return true;
            if (parent?.type.name !== name) return false;
            const level = Math.min(4, Math.max(2, node.attrs.level));
            if (level !== node.attrs.level) {
              tr ??= state.tr;
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, level });
            }
            return false;
          });
          return tr;
        },
      }),
    ];
  },
});
