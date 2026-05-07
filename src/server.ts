import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Nuntly } from '@nuntly/sdk';
import { registerTools } from './tools.js';
import { MCP_VERSION } from './version.js';

const apiKey = process.env.NUNTLY_API_KEY;
if (!apiKey) {
  console.error('NUNTLY_API_KEY environment variable is required.');
  process.exit(1);
}

const server = new McpServer({
  name: 'nuntly',
  version: MCP_VERSION,
});

const baseUrl = process.env.NUNTLY_BASE_URL;
const nuntly = new Nuntly({
  apiKey,
  ...(baseUrl && { baseUrl }),
  appInfo: { name: '@nuntly/sdk-mcp', version: MCP_VERSION },
});
registerTools(server, nuntly);

const transport = new StdioServerTransport();
await server.connect(transport);

const shutdown = async () => {
  await server.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
