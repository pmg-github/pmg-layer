import { Node } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { VueNodeViewRenderer, type NodeViewProps } from "@tiptap/vue-3";
import type { Component } from "vue";
import Summary from "../../components/tiptap/Summary.vue";

export interface SummaryAttributes {
  color?: string;
}

/** Default title; every summary starts with a heading. */
export const SUMMARY_TITLE = "In het kort";

const titleHeading = {
  type: "heading",
  attrs: { level: 2 },
  content: [{ type: "text", text: SUMMARY_TITLE }],
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    summary: {
      insertSummary: (attributes?: SummaryAttributes) => ReturnType;
    };
  }
}

export default Node.create({
  name: "summary",
  group: "block",
  content: "(paragraph|list|heading|gallery|grid|accordion|file|iframe|poll)+",
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      color: {
        default: "gray",
        parseHTML: (element) => element.getAttribute("data-color") ?? "gray",
        renderHTML: (attributes) => ({
          "data-color": attributes.color ?? "gray",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-summary]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-summary": "true", ...HTMLAttributes }, 0];
  },

  addCommands() {
    return {
      insertSummary:
        (attributes = {}) =>
        ({ commands }) =>
          commands.insertContent([
            {
              type: this.name,
              attrs: { color: "gray", ...attributes },
              content: [titleHeading, { type: "paragraph" }],
            },
            { type: "paragraph" },
          ]),
    };
  },

  // Give every summary a title: older summaries, wrapped selections and a
  // deleted title all get the default heading back.
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("summaryTitle"),
        appendTransaction: (transactions, _oldState, state) => {
          if (!transactions.some((tr) => tr.docChanged)) return null;
          const heading = state.schema.nodes.heading;
          if (!heading) return null;

          const missing: number[] = [];
          state.doc.descendants((node, pos) => {
            if (node.type.name !== this.name) return;
            if (node.firstChild?.type !== heading) missing.push(pos + 1);
            return false;
          });
          if (!missing.length) return null;

          const tr = state.tr;
          for (const pos of missing.reverse()) {
            tr.insert(pos, state.schema.nodeFromJSON(titleHeading));
          }
          return tr;
        },
      }),
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(Summary as Component<NodeViewProps>);
  },
});
