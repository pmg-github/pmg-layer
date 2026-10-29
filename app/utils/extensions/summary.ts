import { Node } from "@tiptap/core";
import { VueNodeViewRenderer, type NodeViewProps } from "@tiptap/vue-3";
import type { Component } from "vue";
import Summary from "../../components/tiptap/Summary.vue";

export interface SummaryAttributes {
  color?: string;
  print?: boolean;
}

/** Default title for new summaries; editors can change or remove it. */
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
      /** Adds the default title to the summary at `pos`. */
      insertSummaryTitle: (pos: number) => ReturnType;
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
              attrs: { color: "gray", print: true, ...attributes },
              content: [
                titleHeading,
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
      insertSummaryTitle:
        (pos) =>
        ({ state, commands }) =>
          state.doc.nodeAt(pos)?.type.name === this.name &&
          commands.insertContentAt(pos + 1, titleHeading),
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(Summary as Component<NodeViewProps>);
  },
});
