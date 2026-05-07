/**
 * Vercel AI SDK adapter.
 *
 * Usage with Vercel AI SDK:
 * ```typescript
 * import { createMcpServer } from '@nuntly/sdk-mcp/ai';
 * ```
 *
 * Usage with stdio transport:
 * ```typescript
 * import { createMcpServer } from '@nuntly/sdk-mcp/ai';
 * import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
 *
 * const server = createMcpServer({ apiKey: process.env.NUNTLY_API_KEY });
 * await server.connect(new StdioServerTransport());
 * ```
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ClientOptions } from "@nuntly/sdk";
import { Nuntly } from "@nuntly/sdk";
import { registerTools } from "./tools.js";
import { MCP_VERSION } from "./version.js";

export function createMcpServer(options?: ClientOptions): McpServer {
	const server = new McpServer({ name: "nuntly", version: MCP_VERSION });
	// Always identify the MCP wrapper in the User-Agent. Caller-supplied
	// `appInfo` is honored when present; otherwise we fall back to the
	// MCP server identity.
	const nuntly = new Nuntly({
		...options,
		appInfo: options?.appInfo ?? { name: "@nuntly/sdk-mcp", version: MCP_VERSION },
	});
	registerTools(server, nuntly);
	return server;
}

export { registerTools } from "./tools.js";
