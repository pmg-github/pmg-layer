import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface InvisiblesOptions {
  blockTypes: string[];
}

export interface InvisiblesStorage {
  visible: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    invisibles: {
      setInvisibles: (visible: boolean) => ReturnType;
      toggleInvisibles: () => ReturnType;
    };
  }
}

const invisiblesPluginKey = new PluginKey<boolean>('invisibles');

const makePilcrow = () => {
  const element = document.createElement('span');
  element.className = 'char-pilcrow';
  element.textContent = '¶';
  element.contentEditable = 'false';
  return element;
};

const Invisibles = Extension.create<InvisiblesOptions, InvisiblesStorage>({
  name: 'invisibles',

  addOptions() {
    return {
      blockTypes: ['paragraph', 'heading', 'intro', 'small', 'blockquote'],
    };
  },

  addStorage() {
    return {
      visible: false,
    };
  },

  addCommands() {
    return {
      setInvisibles:
        (visible) =>
        ({ state, dispatch }) => {
          dispatch?.(state.tr.setMeta(invisiblesPluginKey, visible));
          this.storage.visible = visible;
          return true;
        },
      toggleInvisibles:
        () =>
        ({ state, dispatch }) => {
          const visible = invisiblesPluginKey.getState(state) ?? false;
          dispatch?.(state.tr.setMeta(invisiblesPluginKey, !visible));
          this.storage.visible = !visible;
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const blockTypes = new Set(this.options.blockTypes);

    return [
      new Plugin({
        key: invisiblesPluginKey,
        state: {
          init: () => false,
          apply(transaction, visible) {
            const meta = transaction.getMeta(invisiblesPluginKey);
            return meta !== undefined ? Boolean(meta) : visible;
          },
        },
        props: {
          decorations(state) {
            if (!invisiblesPluginKey.getState(state)) {
              return DecorationSet.empty;
            }

            const decorations: Decoration[] = [];

            state.doc.descendants((node, position) => {
              if (node.isText && node.text) {
                for (let index = 0; index < node.text.length; index += 1) {
                  const character = node.text[index];

                  if (character === '\u00a0') {
                    decorations.push(
                      Decoration.inline(
                        position + index,
                        position + index + 1,
                        {
                          class: 'char-nbsp',
                        },
                      ),
                    );
                  } else if (character === ' ') {
                    decorations.push(
                      Decoration.inline(
                        position + index,
                        position + index + 1,
                        {
                          class: 'char-space',
                        },
                      ),
                    );
                  }
                }
              }

              if (node.isBlock && blockTypes.has(node.type.name)) {
                decorations.push(
                  Decoration.widget(position + node.nodeSize - 1, makePilcrow, {
                    side: 1,
                    key: `pilcrow-${position}`,
                  }),
                );
              }

              return true;
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

export default Invisibles;
