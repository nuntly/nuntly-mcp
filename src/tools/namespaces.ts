import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  CreateNamespaceRequest,
  NamespaceInboxesQuery,
  NamespacesQuery,
  Nuntly,
  UpdateNamespaceRequest,
} from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';
import { idResponseOutput, inboxResponseOutput, namespaceResponseOutput } from '../schemas.js';

export function registerNamespacesTools(server: McpServer, nuntly: Nuntly): void {
  // POST /namespaces
  server.registerTool(
    'create-namespace',
    {
      title: 'Create Namespace',
      description:
        'Creates a namespace to group inboxes, with a display name and an optional external id that maps it to a customer or tenant in your own system.',
      inputSchema: z
        .object({
          name: z.string().describe('The display name of the namespace.'),
          externalId: z.string().describe('An optional external identifier for the namespace.').optional(),
        })
        .strict(),
      outputSchema: namespaceResponseOutput(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const body = args;
        const result = await nuntly.namespaces.create(body as CreateNamespaceRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /namespaces/{namespaceId}
  server.registerTool(
    'delete-namespace',
    {
      title: 'Delete Namespace',
      description:
        'Deletes a namespace by id. The request is rejected with a validation error while the namespace still has active inboxes, so delete them first.',
      inputSchema: z
        .object({
          namespaceId: z.string().describe('The namespaceId'),
        })
        .strict(),
      outputSchema: idResponseOutput(),
      annotations: { openWorldHint: true, destructiveHint: true },
    },
    async (args) => {
      try {
        const namespaceId = String(args.namespaceId);
        const result = await nuntly.namespaces.delete(namespaceId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /namespaces/{namespaceId}/inboxes
  server.registerTool(
    'list-namespace-inboxes',
    {
      title: 'List Namespace Inboxes',
      description:
        'Lists the active inboxes assigned to a namespace, newest first, with cursor pagination. Returns the same inbox objects as the inbox list.',
      inputSchema: z
        .object({
          namespaceId: z.string().describe('The namespaceId'),
          cursor: z.string().describe('The cursor to retrieve the next page of results').optional(),
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
          data: z.array(inboxResponseOutput()),
          nextCursor: z.string().nullable().optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const namespaceId = String(args.namespaceId);
        const page = await nuntly.namespaces.inboxes.list(namespaceId, {
          cursor: args.cursor,
          limit: args.limit,
        } as NamespaceInboxesQuery);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /namespaces
  server.registerTool(
    'list-namespaces',
    {
      title: 'List Namespaces',
      description:
        'Lists the namespaces of your organization, newest first, with cursor pagination. Each item includes the name and the optional external id.',
      inputSchema: z
        .object({
          cursor: z.string().describe('The cursor to retrieve the next page of results').optional(),
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
          data: z.array(namespaceResponseOutput()),
          nextCursor: z.string().nullable().optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const page = await nuntly.namespaces.list({ cursor: args.cursor, limit: args.limit } as NamespacesQuery);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /namespaces/{namespaceId}
  server.registerTool(
    'retrieve-namespace',
    {
      title: 'Retrieve Namespace',
      description:
        'Retrieves a namespace by id with its name, its optional external id, and inbox counts, including how many of its inboxes are currently active.',
      inputSchema: z
        .object({
          namespaceId: z.string().describe('The namespaceId'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the namespace'),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
          updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)').optional(),
          name: z.string().describe('The display name of the namespace.'),
          externalId: z.string().nullable().describe('The external identifier for the namespace.'),
          inboxCount: z.number().describe('The total number of inboxes in this namespace.'),
          activeInboxCount: z.number().describe('The number of active inboxes in this namespace.'),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const namespaceId = String(args.namespaceId);
        const result = await nuntly.namespaces.retrieve(namespaceId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /namespaces/{namespaceId}
  server.registerTool(
    'update-namespace',
    {
      title: 'Update Namespace',
      description:
        'Updates the display name or external id of a namespace. Set the external id to null to clear it. Returns the id of the updated namespace.',
      inputSchema: z
        .object({
          namespaceId: z.string().describe('The namespaceId'),
          name: z.string().describe('The display name of the namespace.').optional(),
          externalId: z.string().nullable().describe('An optional external identifier for the namespace.').optional(),
        })
        .strict(),
      outputSchema: idResponseOutput(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const namespaceId = String(args.namespaceId);
        const { namespaceId: _namespaceId, ...body } = args;
        const result = await nuntly.namespaces.update(namespaceId, body as UpdateNamespaceRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
