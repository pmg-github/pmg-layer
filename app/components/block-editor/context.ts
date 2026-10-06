import type { Component, ComputedRef, InjectionKey } from 'vue';
import { computed, inject } from 'vue';

export const blockEditorComponentNames = [
  'AddItem',
  'BlockSettings',
  'EditableIcon',
  'EditableImage',
  'EditableLinks',
  'EditableText',
  'ImageManager',
  'ItemControls',
  'LinkReferenceSelect',
  'SelectionFrame',
] as const;

export type BlockEditorComponentName =
  (typeof blockEditorComponentNames)[number];

export type BlockEditorComponents = Partial<
  Record<BlockEditorComponentName, Component>
>;

export const blockEditorComponentsKey: InjectionKey<
  ComputedRef<BlockEditorComponents>
> = Symbol('pmg:block-editor-components');

export function useBlockEditorComponent(name: BlockEditorComponentName) {
  const components = inject(
    blockEditorComponentsKey,
    computed<BlockEditorComponents>(() => ({})),
  );

  return computed(() => components.value[name]);
}
