/** Prompt settings supplied by the host application. */
export interface EditorAiPrompt {
  prompt?: string;
  promptResponseFormat?: string;
  model?: string;
}

export interface EditorPromptOptions {
  aiPrompt?: EditorAiPrompt;
}
