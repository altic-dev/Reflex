import { generateText, stepCountIs, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { createReflexTools } from "./createReflexTools";

// =============================================================================
// DUMMY TOOLS - A large set to demonstrate intelligent tool selection
// =============================================================================

const dummyTools = {
  // ---------------------------------------------------------------------------
  // Filesystem tools
  // ---------------------------------------------------------------------------
  readFile: tool({
    description: "Read the contents of a file at the given path",
    inputSchema: z.object({ path: z.string() }),
    execute: async ({ path }) => {
      console.log(`[readFile] Reading: ${path}`);
      return { content: `Dummy content of ${path}` };
    },
  }),

  writeFile: tool({
    description: "Write content to a file at the given path",
    inputSchema: z.object({
      path: z.string(),
      content: z.string(),
    }),
    execute: async ({ path, content }) => {
      console.log(`[writeFile] Writing to: ${path}`);
      console.log(`[writeFile] Content: ${content.substring(0, 100)}...`);
      return { success: true, path };
    },
  }),

  listDirectory: tool({
    description: "List all files and folders in a directory",
    inputSchema: z.object({ path: z.string() }),
    execute: async ({ path }) => {
      console.log(`[listDirectory] Listing: ${path}`);
      return { files: ["file1.txt", "file2.txt", "subfolder"] };
    },
  }),

  deleteFile: tool({
    description: "Delete a file at the given path",
    inputSchema: z.object({ path: z.string() }),
    execute: async ({ path }) => {
      console.log(`[deleteFile] Deleting: ${path}`);
      return { success: true };
    },
  }),

  copyFile: tool({
    description: "Copy a file from source to destination",
    inputSchema: z.object({
      source: z.string(),
      destination: z.string(),
    }),
    execute: async ({ source, destination }) => {
      console.log(`[copyFile] Copying ${source} to ${destination}`);
      return { success: true };
    },
  }),

  getFileStats: tool({
    description: "Get metadata about a file (size, created date, etc)",
    inputSchema: z.object({ path: z.string() }),
    execute: async ({ path }) => {
      console.log(`[getFileStats] Getting stats for: ${path}`);
      return { size: 1024, created: "2024-01-01", modified: "2024-01-02" };
    },
  }),

  // ---------------------------------------------------------------------------
  // Network tools
  // ---------------------------------------------------------------------------
  checkUrlReachable: tool({
    description: "Check if a URL is reachable and responding",
    inputSchema: z.object({ url: z.string() }),
    execute: async ({ url }) => {
      console.log(`[checkUrlReachable] Checking: ${url}`);
      return { reachable: true, statusCode: 200 };
    },
  }),

  fetchUrl: tool({
    description: "Fetch the content from a URL",
    inputSchema: z.object({ url: z.string() }),
    execute: async ({ url }) => {
      console.log(`[fetchUrl] Fetching: ${url}`);
      return {
        content: `<!DOCTYPE html><html><body>Dummy content from ${url}</body></html>`,
        statusCode: 200,
      };
    },
  }),

  sendEmail: tool({
    description: "Send an email to a recipient",
    inputSchema: z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string(),
    }),
    execute: async ({ to, subject }) => {
      console.log(`[sendEmail] Sending to: ${to}, Subject: ${subject}`);
      return { success: true, messageId: "msg-123" };
    },
  }),

  sendSlackMessage: tool({
    description: "Send a message to a Slack channel",
    inputSchema: z.object({
      channel: z.string(),
      message: z.string(),
    }),
    execute: async ({ channel, message }) => {
      console.log(`[sendSlackMessage] Channel: ${channel}, Message: ${message}`);
      return { success: true };
    },
  }),

  makeHttpPost: tool({
    description: "Make an HTTP POST request to a URL with a JSON body",
    inputSchema: z.object({
      url: z.string(),
      body: z.record(z.unknown()),
    }),
    execute: async ({ url }) => {
      console.log(`[makeHttpPost] POST to: ${url}`);
      return { statusCode: 200, response: { ok: true } };
    },
  }),

  // ---------------------------------------------------------------------------
  // Database tools (not needed for the task)
  // ---------------------------------------------------------------------------
  queryDatabase: tool({
    description: "Execute a SQL query and return results",
    inputSchema: z.object({ sql: z.string() }),
    execute: async ({ sql }) => {
      console.log(`[queryDatabase] Executing: ${sql}`);
      return { rows: [{ id: 1, name: "Test" }], rowCount: 1 };
    },
  }),

  insertRecord: tool({
    description: "Insert a new record into a database table",
    inputSchema: z.object({
      table: z.string(),
      data: z.record(z.unknown()),
    }),
    execute: async ({ table }) => {
      console.log(`[insertRecord] Inserting into: ${table}`);
      return { success: true, insertedId: 42 };
    },
  }),

  deleteRecord: tool({
    description: "Delete a record from a database table by ID",
    inputSchema: z.object({
      table: z.string(),
      id: z.number(),
    }),
    execute: async ({ table, id }) => {
      console.log(`[deleteRecord] Deleting ID ${id} from: ${table}`);
      return { success: true };
    },
  }),

  // ---------------------------------------------------------------------------
  // Image tools (not needed for the task)
  // ---------------------------------------------------------------------------
  resizeImage: tool({
    description: "Resize an image to specified dimensions",
    inputSchema: z.object({
      path: z.string(),
      width: z.number(),
      height: z.number(),
    }),
    execute: async ({ path, width, height }) => {
      console.log(`[resizeImage] Resizing ${path} to ${width}x${height}`);
      return { success: true, outputPath: path };
    },
  }),

  convertImageFormat: tool({
    description: "Convert an image to a different format (png, jpg, webp)",
    inputSchema: z.object({
      path: z.string(),
      format: z.enum(["png", "jpg", "webp"]),
    }),
    execute: async ({ path, format }) => {
      console.log(`[convertImageFormat] Converting ${path} to ${format}`);
      return { success: true, outputPath: path.replace(/\.\w+$/, `.${format}`) };
    },
  }),

  // ---------------------------------------------------------------------------
  // Utility tools
  // ---------------------------------------------------------------------------
  getCurrentTime: tool({
    description: "Get the current date and time",
    inputSchema: z.object({}),
    execute: async () => {
      const now = new Date().toISOString();
      console.log(`[getCurrentTime] ${now}`);
      return { timestamp: now };
    },
  }),

  generateUuid: tool({
    description: "Generate a unique UUID",
    inputSchema: z.object({}),
    execute: async () => {
      const uuid = crypto.randomUUID();
      console.log(`[generateUuid] ${uuid}`);
      return { uuid };
    },
  }),

  hashString: tool({
    description: "Hash a string using specified algorithm (md5, sha256)",
    inputSchema: z.object({
      text: z.string(),
      algorithm: z.enum(["md5", "sha256"]),
    }),
    execute: async ({ text, algorithm }) => {
      console.log(`[hashString] Hashing with ${algorithm}`);
      return { hash: `dummy-${algorithm}-hash-of-${text.substring(0, 10)}` };
    },
  }),

  compressData: tool({
    description: "Compress data using gzip",
    inputSchema: z.object({ data: z.string() }),
    execute: async ({ data }) => {
      console.log(`[compressData] Compressing ${data.length} bytes`);
      return { compressed: `compressed-${data.length}-bytes`, ratio: 0.6 };
    },
  }),
};

// =============================================================================
// CREATE REFLEX TOOLS
// =============================================================================

const model = anthropic("claude-sonnet-4-5-20250929");

const { toolSearch, toolExecute } = createReflexTools({
  tools: dummyTools,
  model: model,
});

// =============================================================================
// RUN EXAMPLE
// =============================================================================

console.log("=".repeat(80));
console.log("REFLEX TOOLS DEMO");
console.log("=".repeat(80));
console.log(`Total available tools: ${Object.keys(dummyTools).length}`);
console.log("Tools:", Object.keys(dummyTools).join(", "));
console.log("=".repeat(80));
console.log();

const prompt = `Check if https://example.com is reachable. If it is, fetch its content and save it to /tmp/example.html. If not reachable, write an error message to /tmp/error.log instead.`;

console.log("PROMPT:", prompt);
console.log();
console.log("=".repeat(80));
console.log("EXECUTION:");
console.log("=".repeat(80));

const result = await generateText({
  model: model,
  tools: { toolSearch, toolExecute },
  prompt: prompt,
  stopWhen: stepCountIs(5),
});

console.log();
console.log("=".repeat(80));
console.log("RESULT:");
console.log("=".repeat(80));
console.log(result.text);
console.log();
console.log("Steps taken:", result.steps.length);
console.log(
  "Tool calls:",
  result.steps.flatMap((s) => s.toolCalls.map((tc) => tc.toolName))
);
