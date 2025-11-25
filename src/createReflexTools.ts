import type { ToolSet, LanguageModel, Tool } from "ai";
import { createToolSearch } from "./tools/toolSearch";
import { createToolExecute } from "./tools/toolExecute";

export type ReflexToolsOptions = {
  tools: ToolSet;
  model?: LanguageModel;
  toolExecutionTimeout?: number;
};

export type ReflexTools = {
  toolSearch: Tool;
  toolExecute: Tool;
};

export const createReflexTools = ({
  tools,
  model,
  toolExecutionTimeout,
}: ReflexToolsOptions): ReflexTools => {
  return {
    toolSearch: createToolSearch({ tools, model }),
    toolExecute: createToolExecute({ tools, toolExecutionTimeout }),
  };
};
