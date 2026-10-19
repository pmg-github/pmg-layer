import { Node, mergeAttributes } from "@tiptap/core";
import { VueNodeViewRenderer, type NodeViewProps } from "@tiptap/vue-3";
import type { Component } from "vue";
import Tool from "../../components/tiptap/Tool.vue";

export interface ToolAttrs {
  toolId: number | null;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tool: {
      insertTool: (attrs?: Partial<ToolAttrs>) => ReturnType;
      setTool: (attrs: ToolAttrs) => ReturnType;
    };
  }
}

export default Node.create({
  name: "tool",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      toolId: {
        default: null,
        parseHTML: (element) => {
          const id = Number(element.getAttribute("data-tool-id"));
          return Number.isSafeInteger(id) && id > 0 ? id : null;
        },
        renderHTML: (attributes) => ({
          "data-tool-id": attributes.toolId ?? "",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-tool]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-tool": "true" })];
  },

  addCommands() {
    return {
      insertTool:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs },
            { type: "paragraph" },
          ]),
      setTool:
        (attrs) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, attrs),
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(Tool as Component<NodeViewProps>);
  },
});
