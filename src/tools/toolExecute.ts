import { tool, type ToolSet } from "ai";
import { z } from "zod";
import * as vm from "node:vm";

export type CreateToolExecuteOptions = {
  tools: ToolSet;
  toolExecutionTimeout?: number;
};

export const createToolExecute = ({
  tools,
  toolExecutionTimeout,
}: CreateToolExecuteOptions) =>
  tool({
    description:
      "Execute JavaScript code with tools available as async functions. Use this to orchestrate multiple tool calls, loop over data, or combine tool results. IMPORTANT: All tool functions return objects (not primitive strings). Always access specific properties or use JSON.stringify() when you need string output.",
    inputSchema: z.object({
      code: z
        .string()
        .describe(
          "JavaScript code to execute. Tools are available as async functions that return objects (e.g., `const result = await fetchUrl({ url }); const html = result.content;`). Access object properties for specific values or use JSON.stringify() for string conversion. The last expression or return statement will be the result.",
        ),
    }),
    execute: async ({ code }) => {
      const toolFunctions: Record<string, (args: unknown) => Promise<unknown>> =
        {};

      for (const [name, toolDef] of Object.entries(tools)) {
        toolFunctions[name] = async (args: unknown) => {
          if (toolDef.execute) {
            return await toolDef.execute(args as never, {
              toolCallId: `exec-${name}-${Date.now()}`,
              messages: [],
            });
          }
          throw new Error(`Tool "${name}" has no execute function`);
        };
      }

      const sandboxContext: Record<string, unknown> = {
        ...toolFunctions,
        console: {
          log: (...args: unknown[]) => console.log("[sandbox]", ...args),
          error: (...args: unknown[]) => console.error("[sandbox]", ...args),
          warn: (...args: unknown[]) => console.warn("[sandbox]", ...args),
        },
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Math,
        Date,
        RegExp,
        Error,
        TypeError,
        RangeError,
        Promise,
        Map,
        Set,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
        clearTimeout,
      };

      const context = vm.createContext(sandboxContext);
      const wrappedCode = `
        (async () => {
          ${code}
        })()
      `;

      try {
        // Execute the code in the sandbox
        const script = new vm.Script(wrappedCode);
        const result = await script.runInContext(context, {
          timeout: toolExecutionTimeout ?? 60000,
        });

        return result;
      } catch (error) {
        if (error instanceof Error) {
          return {
            error: error.name,
            message: error.message,
          };
        }
        return {
          error: "ExecutionError",
          message: String(error),
        };
      }
    },
  });
