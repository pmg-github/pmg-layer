import { Node } from "@tiptap/core";
import { VueNodeViewRenderer, type NodeViewProps } from "@tiptap/vue-3";
import type { Component } from "vue";
import Iframe from "../../components/tiptap/Iframe.vue";

export interface IframeOptions {
  allowFullscreen: boolean;
  HTMLAttributes: {
    [key: string]: any;
  };
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    iframe: {
      insertIframe: (options?: { src?: string }) => ReturnType;
      /**
       * Add an iframe
       */
      setIframe: (options: { src: string }) => ReturnType;
    };
  }
}

export default Node.create<IframeOptions>({
  name: "iframe",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      allowFullscreen: true,
      HTMLAttributes: {
        class: "iframe-wrapper",
      },
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      frameborder: {
        default: 0,
      },
      allowfullscreen: {
        default: this.options.allowFullscreen,
        parseHTML: () => this.options.allowFullscreen,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "iframe",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { "data-iframe": "true", ...this.options.HTMLAttributes },
      [
        "iframe",
        {
          ...HTMLAttributes,
          loading: "lazy",
          referrerpolicy: "no-referrer-when-downgrade",
        },
      ],
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(Iframe as Component<NodeViewProps>);
  },

  addCommands() {
    return {
      insertIframe:
        (options = {}) =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs: { src: "", ...options } },
            { type: "paragraph" },
          ]),
      setIframe:
        (options: { src: string }) =>
        ({ tr, dispatch }) => {
          const { selection } = tr;
          const node = this.type.create(options);

          if (dispatch) {
            tr.replaceRangeWith(selection.from, selection.to, node);
          }

          return true;
        },
    };
  },
});
