import { Node, mergeAttributes } from '@tiptap/core';
import { VueNodeViewRenderer, type NodeViewProps } from '@tiptap/vue-3';
import type { Component } from 'vue';
import Campaign from '../../components/tiptap/Campaign.vue';

export interface CampaignAttrs {
  campaignId: number | null;
  campaignName: string;
  title: string;
  subtitle: string;
  maxRow: number | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    campaign: {
      insertCampaign: (attrs?: Partial<CampaignAttrs>) => ReturnType;
    };
  }
}

export default Node.create({
  name: 'campaign',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return Object.fromEntries(
      Object.entries({
        campaignId: null,
        campaignName: '',
        title: '',
        subtitle: '',
        maxRow: null,
      }).map(([name, defaultValue]) => [
        name,
        {
          default: defaultValue,
          rendered: false,
          parseHTML: (element: HTMLElement) => {
            const value = element.getAttribute(
              `data-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
            );
            if (name === 'campaignId' || name === 'maxRow') {
              const number = Number(value);
              return Number.isSafeInteger(number) && number > 0 ? number : null;
            }
            return value ?? defaultValue;
          },
        },
      ]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-campaign]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-campaign': 'true',
        'data-campaign-id': node.attrs.campaignId ?? '',
        'data-campaign-name': node.attrs.campaignName,
        'data-title': node.attrs.title,
        'data-subtitle': node.attrs.subtitle,
        'data-max-row': node.attrs.maxRow ?? '',
      }),
    ];
  },

  addCommands() {
    return {
      insertCampaign:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs },
            { type: 'paragraph' },
          ]),
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(Campaign as Component<NodeViewProps>);
  },
});
