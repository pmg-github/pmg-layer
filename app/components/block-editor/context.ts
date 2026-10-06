import type { Component, ComputedRef, InjectionKey } from "vue";
import { computed, inject } from "vue";

export type BlockEditorPanel = "settings" | "media";
export type BlockEditorBlockId = string | number;

export interface BlockEditorPanelState {
  blockId: BlockEditorBlockId;
  panel: BlockEditorPanel;
}

interface BlockEditorPanelController {
  activePanel: ComputedRef<BlockEditorPanelState | null>;
  setActivePanel: (panel: BlockEditorPanelState | null) => void;
}

export const blockEditorComponentNames = [
  "AddItem",
  "BlockSettings",
  "EditableIcon",
  "EditableImage",
  "EditableLinks",
  "EditableText",
  "ImageManager",
  "ItemControls",
  "LinkReferenceSelect",
  "SelectionFrame",
] as const;

export type BlockEditorComponentName =
  (typeof blockEditorComponentNames)[number];

export type BlockEditorComponents = Partial<
  Record<BlockEditorComponentName, Component>
>;

export const blockEditorComponentsKey: InjectionKey<
  ComputedRef<BlockEditorComponents>
> = Symbol("pmg:block-editor-components");

export const blockEditorPanelControllerKey: InjectionKey<BlockEditorPanelController> =
  Symbol("pmg:block-editor-panel-controller");

export const blockEditorScopeKey: InjectionKey<
  ComputedRef<BlockEditorBlockId | null>
> = Symbol("pmg:block-editor-scope");

export function useBlockEditorComponent(name: BlockEditorComponentName) {
  const components = inject(
    blockEditorComponentsKey,
    computed<BlockEditorComponents>(() => ({})),
  );

  return computed(() => components.value[name]);
}

export function useBlockEditorPanel(panel: BlockEditorPanel) {
  const controller = inject(blockEditorPanelControllerKey, null);
  const blockId = inject(
    blockEditorScopeKey,
    computed<BlockEditorBlockId | null>(() => null),
  );

  const isOpen = computed(
    () =>
      controller?.activePanel.value?.panel === panel &&
      controller.activePanel.value.blockId === blockId.value,
  );

  function setOpen(open: boolean) {
    if (!controller || blockId.value == null) return;

    if (open) {
      controller.setActivePanel({ blockId: blockId.value, panel });
      return;
    }

    if (isOpen.value) controller.setActivePanel(null);
  }

  return {
    isOpen,
    setOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
  };
}
