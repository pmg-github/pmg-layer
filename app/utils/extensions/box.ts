import { Node } from "@tiptap/core";
import { VueNodeViewRenderer, type NodeViewProps } from "@tiptap/vue-3";
import type { Component } from "vue";
import Box from "../../components/tiptap/Box.vue";

export interface BoxAttributes {
  color?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    box: {
      insertBox: (attributes?: BoxAttributes) => ReturnType;
    };
  }
}

// Highlighted frame ("Kader (uitgelicht)"). Looks like a summary online, but
// unlike the summary it is not framed in print.
export default Node.create({
  name: "box",
  group: "block",
  content: "block+",
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
    return [{ tag: "div[data-box]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-box": "true", ...HTMLAttributes }, 0];
  },

  addCommands() {
    return {
      insertBox:
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
    return VueNodeViewRenderer(Box as Component<NodeViewProps>);
  },
});
