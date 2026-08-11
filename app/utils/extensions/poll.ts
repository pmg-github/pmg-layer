import { Node, mergeAttributes } from "@tiptap/core";
import { VueNodeViewRenderer, type NodeViewProps } from "@tiptap/vue-3";
import type { Component } from "vue";
import Poll from "../../components/tiptap/Poll.vue";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    poll: {
      insertPoll: (attrs?: { pollRef?: string | null }) => ReturnType;
    };
  }
}

export default Node.create({
  name: "poll",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      pollRef: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-poll]",
        getAttrs: (node) => {
          if (typeof node === "string") return false;
          const el = node as HTMLElement;
          const ref = el.getAttribute("data-poll-ref");
          return { pollRef: ref ?? null };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-poll": "true",
        "data-poll-ref": HTMLAttributes.pollRef ?? "",
      }),
    ];
  },

  addCommands() {
    return {
      insertPoll:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent([
            { type: this.name, attrs },
            { type: "paragraph" },
          ]);
        },
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(Poll as Component<NodeViewProps>);
  },
});
