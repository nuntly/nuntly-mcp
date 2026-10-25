import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CreateApiKeyRequest, CursorPageParams, Nuntly, UpdateApiKeyRequest } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';
import { apiKeyResponseOutput, apiKeyStatusOutput } from '../schemas.js';

export function registerApiKeysTools(server: McpServer, nuntly: Nuntly): void {
  // POST /api-keys
  server.registerTool(
    'create-api-key',
    {
      title: 'Create Api Key',
      description:
        'Creates an API key with full access or send-only access, optionally limited to chosen domains. The secret key value is returned only in this response.',
      inputSchema: z
        .object({
          name: z.string().describe('The name of the api key').optional(),
          status: z.enum(['enabled', 'disabled', 'revoked']).describe('The status for the api key').optional(),
          permission: z
            .enum(['fullAccess', 'sendingAccess'])
            .describe('The permission type for the api key')
            .optional(),
          domainIds: z
            .array(z.string())
            .describe('The domain ids to restrict the api key to (only for sendingAccess)')
            .optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the api key'),
          name: z.string().describe('The name of the api key').optional(),
          apiKey: z.string().describe('The content of the api key'),
          shortToken: z.string().describe('The last 6 characters of the api key token'),
          status: apiKeyStatusOutput().describe('The status for the api key'),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
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
      title: 'Delete Api Key',
      description:
        'Permanently deletes an API key. Any request that authenticates with this key is rejected from then on. This cannot be undone.',
      inputSchema: z
        .object({
          id: z.string().describe('The api key ID'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the api key'),
        })
        .passthrough(),
      annotations: { openWorldHint: true, destructiveHint: true },
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
      title: 'List Api Keys',
      description:
        'Lists the API keys of your organization, newest first, with cursor pagination. Each key shows its name, status, creation date, and a short token hint.',
      inputSchema: z
        .object({
          cursor: z.string().describe('Pagination cursor from a previous response').optional(),
          limit: z
            .number()
            .int()
            .min(1)
            .max(30)
            .describe('The maximum number of results to return, from 1 to 30. Defaults to 30.')
            .optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          data: z.array(apiKeyResponseOutput()),
          nextCursor: z.string().nullable().optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
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
      title: 'Retrieve Api Key',
      description:
        'Retrieves an API key by id with its name, status, creation date, and a short token hint. The full secret key value is never returned after creation.',
      inputSchema: z
        .object({
          id: z.string().describe('The api key ID'),
        })
        .strict(),
      outputSchema: apiKeyResponseOutput(),
      annotations: { openWorldHint: true, readOnlyHint: true },
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
      title: 'Update Api Key',
      description:
        'Updates the name of an API key, enables or disables it, or changes its access level and domain restrictions. Returns the id of the updated key.',
      inputSchema: z
        .object({
          id: z.string().describe('The api key ID'),
          name: z.string().describe('The name of the api key').optional(),
          status: z.enum(['enabled', 'disabled']).optional(),
          permission: z
            .enum(['fullAccess', 'sendingAccess'])
            .describe('The permission type for the api key')
            .optional(),
          domainIds: z
            .array(z.string())
            .describe('The domain ids to restrict the api key to (only for sendingAccess)')
            .optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the api key'),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
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
