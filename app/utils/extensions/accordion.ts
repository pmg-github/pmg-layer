import { Node } from '@tiptap/core';
import { VueNodeViewRenderer, type NodeViewProps } from '@tiptap/vue-3';
import Accordion from '../../components/tiptap/Accordion.vue';

export type AccordionText = {
  text: string;
};

export type AccordionItem = {
  question: AccordionText;
  answer: AccordionText;
};

function normalizeText(value: unknown): AccordionText {
  if (typeof value === 'string') return { text: value };
  if (typeof value === 'object' && value !== null && 'text' in value) {
    const text = (value as { text?: unknown }).text;
    return { text: typeof text === 'string' ? text : '' };
  }
  return { text: '' };
}

function normalizeItems(value: unknown): AccordionItem[] | null {
  const items =
    Array.isArray(value)
      ? value
      : typeof value === 'object' && value !== null && 'items' in value
        ? (value as { items?: unknown }).items
        : null;

  if (!Array.isArray(items)) return null;

  return items.map((item: unknown) => {
    if (typeof item !== 'object' || item === null) {
      return { question: { text: '' }, answer: { text: '' } };
    }

    const entry = item as { question?: unknown; answer?: unknown };
    return {
      question: normalizeText(entry.question),
      answer: normalizeText(entry.answer),
    };
  });
}

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
            const items = normalizeItems(JSON.parse(dataItems));
            return items ? { items } : {};
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
          const match = text.match(/^##accordion:\s*(\{.*\}|\[.*\])$/s);

          if (!match || !match[1]) return false;

          try {
            const items = normalizeItems(JSON.parse(match[1]));
            return items ? { items } : false;
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

    const dataItems = Array.isArray(items)
      ? JSON.stringify({ items })
      : '';

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
        (items = [{ question: { text: '' }, answer: { text: '' } }]) =>
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
