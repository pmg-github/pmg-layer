import { Node } from "@tiptap/core";
import { VueNodeViewRenderer, type NodeViewProps } from "@tiptap/vue-3";
import type { Component } from "vue";
import Summary from "../../components/tiptap/Summary.vue";

export interface SummaryAttributes {
  color?: string;
}

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
              content: [{ type: "paragraph" }],
            },
            { type: "paragraph" },
          ]),
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(Summary as Component<NodeViewProps>);
  },
});
