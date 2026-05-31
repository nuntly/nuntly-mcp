/**
 * Programmatic server factory.
 *
 * Builds a fully-configured {@link McpServer} (all Nuntly tools registered)
 * that you connect to a transport yourself. Use this to embed the Nuntly MCP
 * server in your own process instead of running the `nuntly-mcp` stdio binary.
 *
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
import { SERVER_INSTRUCTIONS } from "./instructions.js";
import { MCP_VERSION } from "./version.js";

export function createMcpServer(options?: ClientOptions): McpServer {
	const server = new McpServer(
		{ name: "nuntly", version: MCP_VERSION },
		{ instructions: SERVER_INSTRUCTIONS },
	);
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
