import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly } from '@nuntly/sdk';
import { formatResult, formatError } from '../helpers.js';

export function registerNamespacesTools(server: McpServer, nuntly: Nuntly): void {

  // POST /namespaces
  server.tool(
    'create-namespace',
    "Create a new namespace.",
    {
    name: z.string().describe("The display name of the namespace."),
    externalId: z.string().describe("An optional external identifier for the namespace.").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const body = args;
        const result = await nuntly.namespaces.create(body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /namespaces
  server.tool(
    'list-namespaces',
    "List all namespaces.",
    {
    cursor: z.string().describe("The cursor to retrieve the next page of results").optional(),
    limit: z.number().describe("The maximum number of results to return").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const page = await nuntly.namespaces.list({ cursor: args.cursor, limit: args.limit } as any);
        return formatResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /namespaces/{namespaceId}
  server.tool(
    'retrieve-namespace',
    "Retrieve a namespace with inbox stats.",
    {
    namespaceId: z.string().describe("The namespaceId"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const namespaceId = String(args.namespaceId);
        const result = await nuntly.namespaces.retrieve(namespaceId);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /namespaces/{namespaceId}
  server.tool(
    'update-namespace',
    "Update a namespace.",
    {
    namespaceId: z.string().describe("The namespaceId"),
    name: z.string().describe("The display name of the namespace.").optional(),
    externalId: z.string().describe("An optional external identifier for the namespace.").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const namespaceId = String(args.namespaceId);
        const { namespaceId: _namespaceId, ...body } = args;
        const result = await nuntly.namespaces.update(namespaceId, body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /namespaces/{namespaceId}
  server.tool(
    'delete-namespace',
    "Soft-delete a namespace. Rejects if it has active inboxes.",
    {
    namespaceId: z.string().describe("The namespaceId"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const namespaceId = String(args.namespaceId);
        const result = await nuntly.namespaces.delete(namespaceId);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /namespaces/{namespaceId}/inboxes
  server.tool(
    'list-namespace-inboxes',
    "List inboxes in a namespace.",
    {
    namespaceId: z.string().describe("The namespaceId"),
    cursor: z.string().describe("The cursor to retrieve the next page of results").optional(),
    limit: z.number().describe("The maximum number of results to return").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const namespaceId = String(args.namespaceId);
        const page = await nuntly.namespaces.inboxes.list(namespaceId, { cursor: args.cursor, limit: args.limit } as any);
        return formatResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
