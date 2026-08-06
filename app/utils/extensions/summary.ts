import { Node } from '@tiptap/core';
import { VueNodeViewRenderer, type NodeViewProps } from '@tiptap/vue-3';
import type { Component } from 'vue';
import Summary from '~/components/tiptap/Summary.vue';

export default Node.create({
  name: 'summary',
  group: 'block',
  content: '(paragraph|list|heading|gallery|grid|accordion|file|iframe|poll)+',
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      color: {
        default: 'gray',
        parseHTML: (element) => element.getAttribute('data-color') ?? 'gray',
        renderHTML: (attributes) => ({
          'data-color': attributes.color ?? 'gray',
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-summary]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-summary': 'true', ...HTMLAttributes }, 0];
  },

  addNodeView() {
    return VueNodeViewRenderer(Summary as Component<NodeViewProps>);
  },
});
