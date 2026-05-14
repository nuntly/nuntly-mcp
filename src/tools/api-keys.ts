import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly } from '@nuntly/sdk';
import { formatResult, formatError } from '../helpers.js';

export function registerApiKeysTools(server: McpServer, nuntly: Nuntly): void {

  // POST /api-keys
  server.tool(
    'create-api-key',
    "Generate a new API key. The key value is only returned once — store it securely.",
    {
    name: z.string().describe("The name of the api key").optional(),
    status: z.enum(['enabled', 'disabled', 'revoked']).describe("The status for the api key").optional(),
    permission: z.enum(['fullAccess', 'sendingAccess']).describe("The permission type for the api key"),
    domainIds: z.array(z.string()).describe("The domain ids to restrict the api key to (only for sendingAccess)").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const body = args;
        const result = await nuntly.apiKeys.create(body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /api-keys/{id}
  server.tool(
    'delete-api-key',
    "Revoke an API key. Requests authenticating with this key will be rejected immediately.",
    {
    id: z.string().describe("The api key ID"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const result = await nuntly.apiKeys.delete(id);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /api-keys
  server.tool(
    'list-api-keys',
    "Returns all API keys for the organization. Key values are never included in list responses.",
    {
    cursor: z.string().describe("Pagination cursor from a previous response").optional(),
    limit: z.number().describe("Maximum number of items to return").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const page = await nuntly.apiKeys.list({ cursor: args.cursor, limit: args.limit } as any);
        return formatResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /api-keys/{id}
  server.tool(
    'retrieve-api-key',
    "Returns API key metadata. The key value is never returned after creation.",
    {
    id: z.string().describe("The api key ID"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const result = await nuntly.apiKeys.retrieve(id);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /api-keys/{id}
  server.tool(
    'update-api-key',
    "Update the key name, permissions, or restrict it to specific sending domains.",
    {
    id: z.string().describe("The api key ID"),
    name: z.string().describe("The name of the api key").optional(),
    status: z.enum(['enabled', 'disabled']).optional(),
    permission: z.enum(['fullAccess', 'sendingAccess']).describe("The permission type for the api key").optional(),
    domainIds: z.array(z.string()).describe("The domain ids to restrict the api key to (only for sendingAccess)").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const { id: _id, ...body } = args;
        const result = await nuntly.apiKeys.update(id, body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
