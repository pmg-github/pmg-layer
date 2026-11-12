import { Node, mergeAttributes } from '@tiptap/core';
import { VueNodeViewRenderer, type NodeViewProps } from '@tiptap/vue-3';
import type { Component } from 'vue';
import Model3d from '../../components/tiptap/Model3d.vue';

export interface Model3dAttrs {
  toolId: number | null;
  modelName: string;
  title: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    model3d: { insertModel3d: (attrs?: Partial<Model3dAttrs>) => ReturnType };
  }
}

export default Node.create({
  name: 'model3d',
  group: 'media block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      toolId: {
        default: null,
        rendered: false,
        parseHTML: (element) => {
          const value = Number(element.getAttribute('data-tool-id'));
          return Number.isSafeInteger(value) && value > 0 ? value : null;
        },
      },
      modelName: {
        default: '',
        rendered: false,
        parseHTML: (element) => element.getAttribute('data-model-name') ?? '',
      },
      title: {
        default: '',
        rendered: false,
        parseHTML: (element) => element.getAttribute('data-title') ?? '',
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-model3d]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-model3d': 'true',
        'data-tool-id': node.attrs.toolId ?? '',
        'data-model-name': node.attrs.modelName,
        'data-title': node.attrs.title,
      }),
    ];
  },
  addCommands() {
    return {
      insertModel3d:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs },
            { type: 'paragraph' },
          ]),
    };
  },
  addNodeView() {
    return VueNodeViewRenderer(Model3d as Component<NodeViewProps>);
  },
});
