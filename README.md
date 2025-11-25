# Reflex

Reflex is an [AI SDK](https://ai-sdk.dev) library that replaces your tool list with smarter selection and execution. Instead of loading all tools into context, your agent picks the right ones on-demand. It can also chain tool calls by writing code—handling loops, conditionals, and error recovery without round-trips to the model.

Based on [Anthropic's advanced tool use patterns](https://www.anthropic.com/engineering/advanced-tool-use).

## Install

```bash
npm install reflex
```

## Usage

```typescript
import { createReflexTools } from "reflex";
import { generateText } from "ai";

const { toolSearch, toolExecute } = createReflexTools({
  tools: {
    readNotionDoc,
    sendSlackMessage,
    // ... your AI SDK tools
  },
  model: optionalSelectorModel, // used for smart tool matching
});

const result = await generateText({
  model: yourModel,
  tools: { toolSearch, toolExecute },
  prompt: "...",
});
```

## Tools

### `toolSearch`

Finds relevant tools by query. Uses simple string matching by default, or semantic matching if you provide a model.

### `toolExecute`

Runs JavaScript in a sandbox with your tools exposed as async functions. Lets the agent orchestrate multiple calls, loop over data, and combine results in one shot.

```javascript
// Example: batch operation in a single execution
const users = await getUsers();
const results = [];
for (const user of users) {
  results.push(await sendEmail({ to: user.email, subject: "Hello" }));
}
return results;
```
