/** A host-owned prompt bound to its shared AI controller. */
export interface EditorAiPrompt {
  run: (text: string) => Promise<string | null>;
  isBusy: () => boolean;
}

export interface EditorPromptOptions {
  aiPrompt?: EditorAiPrompt;
}
