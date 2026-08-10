import { Node } from '@tiptap/core';
import { VueNodeViewRenderer, type NodeViewProps } from '@tiptap/vue-3';
import Accordion from '../../components/tiptap/Accordion.vue';

export type AccordionItem = {
  question: string;
  answer: string;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    accordion: {
      insertAccordion: (items?: AccordionItem[]) => ReturnType;
    };
  }
}

export default Node.create({
  name: 'accordion',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      items: {
        default: [],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-accordion]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;

          const dataItems = (node as HTMLElement).getAttribute('data-items');
          if (!dataItems) return {};

          try {
            const items = JSON.parse(dataItems);
            return Array.isArray(items) ? { items } : {};
          } catch {
            return {};
          }
        },
      },
      {
        tag: 'div',
        priority: 100,
        getAttrs: (node) => {
          if (typeof node === 'string') return false;

          const text = (node as HTMLElement).textContent?.trim() || '';
          const match = text.match(/^##accordion:\s*(\[.*\])$/s);

          if (!match || !match[1]) return false;

          try {
            const data = JSON.parse(match[1]);

            if (!Array.isArray(data)) return false;

            const items: AccordionItem[] = data.map((item: any) => ({
              question: item.question || item.q || '',
              answer: item.answer || item.a || '',
            }));

            return { items };
          } catch {
            return false;
          }
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { items, ...rest } = HTMLAttributes as {
      items?: unknown;
      [key: string]: unknown;
    };

    const dataItems = Array.isArray(items) ? JSON.stringify(items) : '';

    return [
      'div',
      {
        'data-accordion': 'true',
        ...(dataItems ? { 'data-items': dataItems } : {}),
        ...rest,
      },
    ];
  },

  addCommands() {
    return {
      insertAccordion:
        (items = [{ question: '', answer: '' }]) =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs: { items } },
            { type: 'paragraph' },
          ]),
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(
      Accordion as unknown as Component<NodeViewProps>,
    );
  },
});
