# @nuntly/sdk-mcp

[![npm version](https://img.shields.io/npm/v/@nuntly/sdk-mcp.svg)](https://www.npmjs.com/package/@nuntly/sdk-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

MCP server for [Nuntly](https://nuntly.com), the developer-first email platform. Exposes tools for sending emails, managing domains, webhooks, inboxes, and more.

[Documentation](https://nuntly.com/docs) | [SDK Reference](https://github.com/nuntly/nuntly-sdk-typescript/blob/main/api.md) | [Get your API key](https://nuntly.com/auth/sign-up)

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
- A Nuntly API key from [https://nuntly.com/auth/sign-up](https://nuntly.com/auth/sign-up)
- An MCP-aware client: Claude Desktop, Claude Code, Cursor, Continue, or any custom integration based on the Model Context Protocol

## Setup

### Claude Desktop

Add to your Claude Desktop config:

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

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

Use the built-in `claude mcp add` command:

```bash
claude mcp add nuntly -- npx @nuntly/sdk-mcp
```

Then export `NUNTLY_API_KEY` in your shell, or paste this shape into `.mcp.json` manually:

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

**API Keys**: `create-api-key`, `delete-api-key`, `list-api-keys`, `retrieve-api-key`, `update-api-key`

**Domains**: `create-domain`, `delete-domain`, `list-domains`, `retrieve-domain`, `update-domain`

**Emails**: `cancel-email`, `list-emails`, `retrieve-bulk-emails`, `retrieve-email`, `retrieve-email-content`, `retrieve-email-events`, `retrieve-email-stats`, `send-bulk-emails`, `send-email`

**Inboxes**: `create-inbox`, `delete-inbox`, `list-inboxes`, `retrieve-inbox`, `send-inbox-message`, `update-inbox`

**Messages**: `forward-message`, `list-message-attachments`, `list-messages`, `reply-to-message`, `retrieve-message`, `retrieve-message-attachment`, `retrieve-message-content`, `update-message`

**Namespaces**: `create-namespace`, `delete-namespace`, `list-namespace-inboxes`, `list-namespaces`, `retrieve-namespace`, `update-namespace`

**Organizations**: `list-organizations`, `retrieve-organization`, `retrieve-organization-usage`

**Threads**: `list-inbox-threads`, `list-thread-messages`, `retrieve-thread`, `update-thread`

**Webhooks**: `create-webhook`, `delete-webhook`, `list-webhooks`, `retrieve-webhook`, `update-webhook`

**Webhooks Events**: `list-webhook-event-deliveries`, `list-webhooks-events`, `replay-webhook-event`

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

Versions `0.x` remain installable from npm via `npm install @nuntly/sdk-mcp@0` for backwards compatibility.

## Contributing

Issues, bug reports, and feature requests are welcome at [github.com/nuntly/nuntly-mcp/issues](https://github.com/nuntly/nuntly-mcp/issues).

## Troubleshooting

**Server does not appear in the Claude Desktop tools list**
Validate the JSON syntax of `claude_desktop_config.json` (a trailing comma silently breaks the whole file), fully quit and restart Claude Desktop, and confirm the `command` path resolves on your `$PATH` (try running it from a terminal first).

**`NUNTLY_API_KEY missing` at startup**
Grab a key from [nuntly.com](https://nuntly.com) and paste it under `env` in your MCP client config. The server reads the variable from the spawned process environment, not from your shell.

**Tool returns `isError: true`**
The structured `content` block contains an `error` object with `status`, `code`, and `requestId`. Use the `requestId` when contacting support. A 401 means the API key is missing, revoked, or scoped to a different organization.

**`command not found: npx`**
Install Node.js 20 or later from [nodejs.org](https://nodejs.org). `npx` ships with Node and is the spawn target used by every MCP client in the examples above.

## License

MIT. See [LICENSE](./LICENSE).
