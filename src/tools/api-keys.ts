import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly, CreateApiKeyRequest, CursorPageParams, UpdateApiKeyRequest } from '@nuntly/sdk';
import { formatStructuredResult, formatError } from '../helpers.js';

export function registerApiKeysTools(server: McpServer, nuntly: Nuntly): void {

  // POST /api-keys
  server.registerTool(
    'create-api-key',
    {
      title: "Create Api Key",
      description: "Generate a new API key. The key value is only returned once. Store it securely.",
      inputSchema: {
        name: z.string().describe("The name of the api key").optional(),
        status: z.enum(['enabled', 'disabled', 'revoked']).describe("The status for the api key").optional(),
        permission: z.enum(['fullAccess', 'sendingAccess']).describe("The permission type for the api key"),
        domainIds: z.array(z.string()).describe("The domain ids to restrict the api key to (only for sendingAccess)").optional(),
      },
      outputSchema: {
        id: z.string().describe("The id of the api key"),
        name: z.string().describe("The name of the api key").optional(),
        apiKey: z.string().describe("The content of the api key"),
        shortToken: z.string().describe("The last 6 characters of the api key token"),
        status: z.enum(['enabled', 'disabled', 'revoked']).describe("The status for the api key"),
      },
      annotations: {"openWorldHint":true},
    },
    async (args) => {
      try {
        const body = args;
        const result = await nuntly.apiKeys.create(body as CreateApiKeyRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /api-keys/{id}
  server.registerTool(
    'delete-api-key',
    {
      title: "Delete Api Key",
      description: "Revoke an API key. Requests authenticating with this key will be rejected immediately.",
      inputSchema: {
        id: z.string().describe("The api key ID"),
      },
      outputSchema: {
        id: z.string().describe("The id of the api key"),
      },
      annotations: {"openWorldHint":true,"destructiveHint":true},
    },
    async (args) => {
      try {
        const id = String(args.id);
        const result = await nuntly.apiKeys.delete(id);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /api-keys
  server.registerTool(
    'list-api-keys',
    {
      title: "List Api Keys",
      description: "Returns all API keys for the organization. Key values are never included in list responses.",
      inputSchema: {
        cursor: z.string().describe("Pagination cursor from a previous response").optional(),
        limit: z.number().describe("Maximum number of items to return").optional(),
      },
      outputSchema: {
        data: z.array(z.object({ id: z.string().describe("The id of the api key"), name: z.string().describe("The name of the api key").optional(), shortToken: z.string().describe("The last 6 characters of the api key token"), status: z.enum(['enabled', 'disabled', 'revoked']).describe("The status for the api key"), createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)") })),
        nextCursor: z.string().optional(),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const page = await nuntly.apiKeys.list({ cursor: args.cursor, limit: args.limit } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /api-keys/{id}
  server.registerTool(
    'retrieve-api-key',
    {
      title: "Retrieve Api Key",
      description: "Returns API key metadata. The key value is never returned after creation.",
      inputSchema: {
        id: z.string().describe("The api key ID"),
      },
      outputSchema: {
        id: z.string().describe("The id of the api key"),
        name: z.string().describe("The name of the api key").optional(),
        shortToken: z.string().describe("The last 6 characters of the api key token"),
        status: z.enum(['enabled', 'disabled', 'revoked']).describe("The status for the api key"),
        createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const id = String(args.id);
        const result = await nuntly.apiKeys.retrieve(id);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /api-keys/{id}
  server.registerTool(
    'update-api-key',
    {
      title: "Update Api Key",
      description: "Update the key name, permissions, or restrict it to specific sending domains.",
      inputSchema: {
        id: z.string().describe("The api key ID"),
        name: z.string().describe("The name of the api key").optional(),
        status: z.enum(['enabled', 'disabled']).optional(),
        permission: z.enum(['fullAccess', 'sendingAccess']).describe("The permission type for the api key").optional(),
        domainIds: z.array(z.string()).describe("The domain ids to restrict the api key to (only for sendingAccess)").optional(),
      },
      outputSchema: {
        id: z.string().describe("The id of the api key"),
      },
      annotations: {"openWorldHint":true},
    },
    async (args) => {
      try {
        const id = String(args.id);
        const { id: _id, ...body } = args;
        const result = await nuntly.apiKeys.update(id, body as UpdateApiKeyRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
