# @nuntly/sdk-mcp

[![npm version](https://img.shields.io/npm/v/@nuntly/sdk-mcp.svg)](https://www.npmjs.com/package/@nuntly/sdk-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

MCP server for [Nuntly](https://nuntly.com), the developer-first email platform. Exposes tools for sending emails, managing domains, webhooks, inboxes, and more.

[Documentation](https://nuntly.com/docs) | [SDK Reference](https://github.com/nuntly/nuntly-sdk-typescript/blob/main/packages/sdk/api.md) | [Get your API key](https://app.nuntly.com/signup)

## Table of contents

- [Requirements](#requirements)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Programmatic usage](#programmatic-usage)
- [Tools](#tools)
- [FAQ](#faq)
- [Semantic versioning](#semantic-versioning)
- [Previous versions](#previous-versions)
- [Contributing](#contributing)
- [License](#license)

## Requirements

- Node.js 20 or later (or Bun)
- A Nuntly API key from [https://app.nuntly.com/signup](https://app.nuntly.com/signup)
- An MCP-aware client: Claude Desktop, Claude Code, Cursor, Continue, or any custom integration based on the Model Context Protocol

## Setup

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "nuntly": {
      "command": "npx",
      "args": ["@nuntly/sdk-mcp"],
      "env": {
        "NUNTLY_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Claude Code

Add to your project `.mcp.json`:

```json
{
  "mcpServers": {
    "nuntly": {
      "command": "npx",
      "args": ["@nuntly/sdk-mcp"],
      "env": {
        "NUNTLY_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "nuntly": {
      "command": "npx",
      "args": ["@nuntly/sdk-mcp"],
      "env": {
        "NUNTLY_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NUNTLY_API_KEY` | Yes | Your Nuntly API key |
| `NUNTLY_BASE_URL` | No | Custom API base URL (default: `https://api.nuntly.com`) |

## Programmatic usage

### Vercel AI SDK

```typescript
import { createMcpServer } from '@nuntly/sdk-mcp/ai';

const server = createMcpServer({ apiKey: process.env.NUNTLY_API_KEY });
```

### Custom integration

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Nuntly } from '@nuntly/sdk';
import { registerTools } from '@nuntly/sdk-mcp';

const server = new McpServer({ name: 'my-server', version: '1.0.0' });
const nuntly = new Nuntly({ apiKey: process.env.NUNTLY_API_KEY });
registerTools(server, nuntly);
```

## Tools

Tools available:

**Agents**: `retrieve-agent-memory`, `upsert-agent-memory`

**API Keys**: `retrieve-api-key`, `update-api-key`, `delete-api-key`, `create-api-key`, `list-api-keys`

**Domains**: `list-domains`, `retrieve-domain`, `delete-domain`, `create-domain`, `update-domain`

**Emails**: `retrieve-email-stats`, `retrieve-email`, `retrieve-email-events`, `retrieve-email-content`, `list-emails`, `send-email`, `cancel-email`, `send-bulk-emails`, `retrieve-bulk-emails`

**Inboxes**: `create-inbox`, `list-inboxes`, `retrieve-inbox`, `update-inbox`, `delete-inbox`, `send-inbox-message`

**Messages**: `list-messages`, `retrieve-message`, `retrieve-message-content`, `list-message-attachments`, `retrieve-message-attachment`, `update-message`, `reply-to-message`, `forward-message`

**Namespaces**: `create-namespace`, `list-namespaces`, `retrieve-namespace`, `update-namespace`, `delete-namespace`, `list-namespace-inboxes`

**Organizations**: `retrieve-organization-usage`, `retrieve-organizations`, `retrieve-organization`

**Threads**: `list-inbox-threads`, `retrieve-thread`, `update-thread`, `list-thread-messages`

**Webhooks**: `retrieve-webhook`, `update-webhook`, `delete-webhook`, `create-webhook`, `list-webhooks`

**Webhooks Events**: `list-webhooks-events`, `replay-webhook-event`, `list-webhook-event-deliveries`

## FAQ

**Does this require Node.js or Bun?**
Either. The published package runs on Node.js 20+ via `npx @nuntly/sdk-mcp` and on Bun via `bunx @nuntly/sdk-mcp`. Most MCP clients spawn `npx` directly.

**Do I need an LLM provider account?**
No. The MCP server only talks to the Nuntly API. The LLM client (Claude Desktop, Cursor, etc.) handles its own provider authentication.

**How do I report a bug or request a tool?**
Open an issue at [github.com/nuntly/nuntly-mcp/issues](https://github.com/nuntly/nuntly-mcp/issues).

## Semantic versioning

This package follows [Semantic Versioning 2.0](https://semver.org). The published version tracks the underlying Nuntly SDK version closely. New tools and tool argument additions are minor bumps; tool removals or argument breaking changes are major bumps.

## Previous versions

Versions before `1.0.0` were published from the [`nuntly/nuntly-sdk-typescript`](https://github.com/nuntly/nuntly-sdk-typescript/tree/legacy/stainless-v0.x) repository (`packages/mcp-server` directory). They remain installable from npm via `npm install @nuntly/sdk-mcp@0`.

## Contributing

Issues, bug reports, and feature requests are welcome at [github.com/nuntly/nuntly-mcp/issues](https://github.com/nuntly/nuntly-mcp/issues). Tool definitions are generated from the Nuntly OpenAPI spec, so direct PRs that modify tool surfaces will likely be redirected to upstream feedback. Documentation, examples, and developer-experience improvements are the highest-impact contribution areas.

## License

MIT. See [LICENSE](./LICENSE).
