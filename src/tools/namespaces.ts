import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly, CreateNamespaceRequest, NamespaceInboxesQuery, NamespacesQuery, UpdateNamespaceRequest } from '@nuntly/sdk';
import { formatStructuredResult, formatError } from '../helpers.js';

export function registerNamespacesTools(server: McpServer, nuntly: Nuntly): void {

  // POST /namespaces
  server.registerTool(
    'create-namespace',
    {
      title: "Create Namespace",
      description: "Create a new namespace.",
      inputSchema: {
        name: z.string().describe("The display name of the namespace."),
        externalId: z.string().describe("An optional external identifier for the namespace.").optional(),
      },
      outputSchema: {
        id: z.string().describe("The id of the namespace"),
        createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"),
        updatedAt: z.string().describe("Date at which the object was updated (ISO 8601 format)").optional(),
        name: z.string().describe("The display name of the namespace."),
        externalId: z.string().describe("The external identifier for the namespace."),
      },
      annotations: {"openWorldHint":true},
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
      title: "Delete Namespace",
      description: "Soft-delete a namespace. Rejects if it has active inboxes.",
      inputSchema: {
        namespaceId: z.string().describe("The namespaceId"),
      },
      outputSchema: {
        id: z.string().describe("The id of the resource."),
      },
      annotations: {"openWorldHint":true,"destructiveHint":true},
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
      title: "List Namespace Inboxes",
      description: "List inboxes in a namespace.",
      inputSchema: {
        namespaceId: z.string().describe("The namespaceId"),
        cursor: z.string().describe("The cursor to retrieve the next page of results").optional(),
        limit: z.number().describe("The maximum number of results to return").optional(),
      },
      outputSchema: {
        data: z.array(z.object({ id: z.string().describe("The id of the inbox"), createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"), updatedAt: z.string().describe("Date at which the object was updated (ISO 8601 format)").optional(), domainId: z.string().describe("The id of the domain."), domainName: z.string().describe("The domain name."), address: z.string().describe("The local-part of the email address."), name: z.string().describe("The display name of the inbox."), namespaceId: z.string().describe("The id of the namespace."), namespaceName: z.string().describe("The display name of the namespace."), agentId: z.string().describe("The AI agent identifier.") })),
        nextCursor: z.string().optional(),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const namespaceId = String(args.namespaceId);
        const page = await nuntly.namespaces.inboxes.list(namespaceId, { cursor: args.cursor, limit: args.limit } as NamespaceInboxesQuery);
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
      title: "List Namespaces",
      description: "List all namespaces.",
      inputSchema: {
        cursor: z.string().describe("The cursor to retrieve the next page of results").optional(),
        limit: z.number().describe("The maximum number of results to return").optional(),
      },
      outputSchema: {
        data: z.array(z.object({ id: z.string().describe("The id of the namespace"), createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"), updatedAt: z.string().describe("Date at which the object was updated (ISO 8601 format)").optional(), name: z.string().describe("The display name of the namespace."), externalId: z.string().describe("The external identifier for the namespace.") })),
        nextCursor: z.string().optional(),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
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
      title: "Retrieve Namespace",
      description: "Retrieve a namespace with inbox stats.",
      inputSchema: {
        namespaceId: z.string().describe("The namespaceId"),
      },
      outputSchema: {
        id: z.string().describe("The id of the namespace"),
        createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"),
        updatedAt: z.string().describe("Date at which the object was updated (ISO 8601 format)").optional(),
        name: z.string().describe("The display name of the namespace."),
        externalId: z.string().describe("The external identifier for the namespace."),
        inboxCount: z.number().describe("The total number of inboxes in this namespace."),
        activeInboxCount: z.number().describe("The number of active inboxes in this namespace."),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
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
      title: "Update Namespace",
      description: "Update a namespace.",
      inputSchema: {
        namespaceId: z.string().describe("The namespaceId"),
        name: z.string().describe("The display name of the namespace.").optional(),
        externalId: z.string().describe("An optional external identifier for the namespace.").optional(),
      },
      outputSchema: {
        id: z.string().describe("The id of the resource."),
      },
      annotations: {"openWorldHint":true},
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
