import { mergeAttributes, Node, textblockTypeInputRule } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface ArticleHeadingOptions {
  levels: HeadingLevel[];
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    heading: {
      setHeading: (attributes: { level: HeadingLevel }) => ReturnType;
      toggleHeading: (attributes: { level: HeadingLevel }) => ReturnType;
    };
  }
}

export const slugifyHeading = (text: string): string => {
  const slug = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'kop';
};

export const getUniqueHeadingId = (
  text: string,
  usedIds: Set<string>,
): string => {
  const base = slugifyHeading(text);
  let id = base;
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(id);
  return id;
};

const ArticleHeading = Node.create<ArticleHeadingOptions>({
  name: 'heading',
  content: 'inline*',
  group: 'block',
  defining: true,

  addOptions() {
    return {
      levels: [1, 2, 3, 4, 5, 6],
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      level: {
        default: 1,
        rendered: false,
      },
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('id'),
        renderHTML: (attributes) =>
          attributes.id ? { id: attributes.id } : {},
      },
    };
  },

  parseHTML() {
    return this.options.levels.map((level) => ({
      tag: `h${level}`,
      attrs: { level },
    }));
  },

  renderHTML({ node, HTMLAttributes }) {
    const level = this.options.levels.includes(node.attrs.level)
      ? node.attrs.level
      : this.options.levels[0];

    return [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setHeading:
        (attributes) =>
        ({ commands }) =>
          this.options.levels.includes(attributes.level)
            ? commands.setNode(this.name, attributes)
            : false,
      toggleHeading:
        (attributes) =>
        ({ commands }) =>
          this.options.levels.includes(attributes.level)
            ? commands.toggleNode(this.name, 'paragraph', attributes)
            : false,
    };
  },

  addKeyboardShortcuts() {
    return this.options.levels.reduce(
      (shortcuts, level) => ({
        ...shortcuts,
        [`Mod-Alt-${level}`]: () =>
          this.editor.commands.toggleHeading({ level }),
      }),
      {},
    );
  },

  addInputRules() {
    return this.options.levels.map((level) =>
      textblockTypeInputRule({
        find: new RegExp(
          `^(#{${Math.min(...this.options.levels)},${level}})\\s$`,
        ),
        type: this.type,
        getAttributes: { level },
      }),
    );
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((transaction) => transaction.docChanged)) {
            return null;
          }

          const usedIds = new Set<string>();
          const transaction = newState.tr;
          let changed = false;

          newState.doc.descendants((node, position) => {
            if (node.type.name !== this.name) return true;

            const text = node.textContent.trim();
            const currentId =
              typeof node.attrs.id === 'string' ? node.attrs.id.trim() : '';
            const nextId =
              text && currentId && !usedIds.has(currentId)
                ? currentId
                : getUniqueHeadingId(text, usedIds);

            if (currentId !== nextId) {
              transaction.setNodeMarkup(position, undefined, {
                ...node.attrs,
                id: nextId,
              });
              changed = true;
            }

            usedIds.add(nextId);
            return true;
          });

          return changed ? transaction : null;
        },
      }),
    ];
  },
});

export default ArticleHeading;
