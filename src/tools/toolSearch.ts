import {
  tool,
  type ToolSet,
  type LanguageModel,
  generateText,
  stepCountIs,
} from "ai";
import { z } from "zod";
import { jsonrepair } from "jsonrepair";
import { zodToJsonSchema } from "zod-to-json-schema";

export type CreateToolSearchOptions = {
  tools: ToolSet;
  model?: LanguageModel;
};

export const createToolSearch = ({ tools, model }: CreateToolSearchOptions) =>
  tool({
    description: "Search available tools based on query",
    inputSchema: z.object({
      searchQuery: z.string().describe("Search for tools based on the query"),
      userQuery: z
        .string()
        .describe("The user message to decide which tools are relevant"),
    }),
    execute: async ({ searchQuery, userQuery }) => {
      if (model) {
        const toolList = Object.entries(tools)
          .map(([name, t]) => `- ${name}: ${t.description ?? "No description"}`)
          .join("\n");

        const prompt = `You are a tool selector. Given a user query, select which tools are relevant.
Available tools:
${toolList}

User query: "${userQuery}"
Search hint: "${searchQuery}"

Respond with JSON only. Select tools that can help answer the query. Use the search hint to narrow down relevant tools.

Examples:
Input: "What's the weather in Tokyo?"
Output: {"tools": ["getWeather", "searchLocation"]}

Input: "Send an email to John"
Output: {"tools": ["sendEmail", "searchContacts"]}

Input: "Calculate 5 + 3"
Output: {"tools": ["calculator"]}

Now select the relevant tools for the user query above:`;

        const result = await generateText({
          model: model,
          prompt: prompt,
          stopWhen: stepCountIs(3),
        });

        const modelOutput = jsonrepair(result.text);
        const selectedTools: { tools: string[] } = JSON.parse(modelOutput);
        // Return serializable data: tool name, description, inputSchema, and outputSchema
        return selectedTools.tools
          .filter((name) => tools[name])
          .map((name) => ({
            name,
            description: tools[name].description ?? "No description",
            inputSchema: tools[name].inputSchema
              ? zodToJsonSchema(tools[name].inputSchema as z.ZodType)
              : undefined,
            outputSchema: tools[name].outputSchema
              ? zodToJsonSchema(tools[name].outputSchema as z.ZodType)
              : undefined,
          }));
      }

      const queryLower = searchQuery.toLowerCase();
      const relevantTools = Object.entries(tools).filter(
        ([name, toolDefinition]) =>
          name.toLowerCase().includes(queryLower) ||
          toolDefinition.description?.toLowerCase().includes(queryLower),
      );

      // Return serializable data: tool name, description, inputSchema, and outputSchema
      return relevantTools.map(([name, toolDef]) => ({
        name,
        description: toolDef.description ?? "No description",
        inputSchema: toolDef.inputSchema
          ? zodToJsonSchema(toolDef.inputSchema as z.ZodType)
          : undefined,
        outputSchema: toolDef.outputSchema
          ? zodToJsonSchema(toolDef.outputSchema as z.ZodType)
          : undefined,
      }));
    },
  });
