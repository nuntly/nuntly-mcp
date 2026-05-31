import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly, CreateInboxRequest, InboxesQuery, SendMessageRequest, UpdateInboxRequest } from '@nuntly/sdk';
import { formatStructuredResult, formatError } from '../helpers.js';

export function registerInboxesTools(server: McpServer, nuntly: Nuntly): void {

  // POST /inboxes
  server.registerTool(
    'create-inbox',
    {
      title: "Create Inbox",
      description: "Create a new inbox on a verified domain.",
      inputSchema: {
        domainId: z.string().describe("The id of the domain for this inbox. Defaults to your provided domain when omitted.").optional(),
        address: z.string().describe("The local-part of the email address (before the @)."),
        name: z.string().describe("The display name of the inbox.").optional(),
        namespaceId: z.string().describe("The id of the namespace to assign the inbox to.").optional(),
        agentId: z.string().describe("The external AI agent identifier.").optional(),
      },
      outputSchema: {
        id: z.string().describe("The id of the inbox"),
        createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"),
        updatedAt: z.string().describe("Date at which the object was updated (ISO 8601 format)").optional(),
        domainId: z.string().describe("The id of the domain."),
        domainName: z.string().describe("The domain name."),
        address: z.string().describe("The local-part of the email address."),
        name: z.string().describe("The display name of the inbox."),
        namespaceId: z.string().describe("The id of the namespace."),
        namespaceName: z.string().describe("The display name of the namespace."),
        agentId: z.string().describe("The AI agent identifier."),
      },
      annotations: {"openWorldHint":true},
    },
    async (args) => {
      try {
        const body = args;
        const result = await nuntly.inboxes.create(body as CreateInboxRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /inboxes/{inboxId}
  server.registerTool(
    'delete-inbox',
    {
      title: "Delete Inbox",
      description: "Soft-delete an inbox.",
      inputSchema: {
        inboxId: z.string().describe("The inboxId"),
      },
      outputSchema: {
        id: z.string().describe("The id of the resource."),
      },
      annotations: {"openWorldHint":true,"destructiveHint":true},
    },
    async (args) => {
      try {
        const inboxId = String(args.inboxId);
        const result = await nuntly.inboxes.delete(inboxId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /inboxes
  server.registerTool(
    'list-inboxes',
    {
      title: "List Inboxes",
      description: "List all inboxes.",
      inputSchema: {
        cursor: z.string().describe("The cursor to retrieve the next page of results").optional(),
        limit: z.number().describe("The maximum number of results to return").optional(),
        namespaceId: z.string().describe("Filter by namespace.").optional(),
      },
      outputSchema: {
        data: z.array(z.object({ id: z.string().describe("The id of the inbox"), createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"), updatedAt: z.string().describe("Date at which the object was updated (ISO 8601 format)").optional(), domainId: z.string().describe("The id of the domain."), domainName: z.string().describe("The domain name."), address: z.string().describe("The local-part of the email address."), name: z.string().describe("The display name of the inbox."), namespaceId: z.string().describe("The id of the namespace."), namespaceName: z.string().describe("The display name of the namespace."), agentId: z.string().describe("The AI agent identifier.") })),
        nextCursor: z.string().optional(),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const page = await nuntly.inboxes.list({ cursor: args.cursor, limit: args.limit, namespaceId: args.namespaceId } as InboxesQuery);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /inboxes/{inboxId}
  server.registerTool(
    'retrieve-inbox',
    {
      title: "Retrieve Inbox",
      description: "Retrieve an inbox.",
      inputSchema: {
        inboxId: z.string().describe("The inboxId"),
      },
      outputSchema: {
        id: z.string().describe("The id of the inbox"),
        createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"),
        updatedAt: z.string().describe("Date at which the object was updated (ISO 8601 format)").optional(),
        domainId: z.string().describe("The id of the domain."),
        domainName: z.string().describe("The domain name."),
        address: z.string().describe("The local-part of the email address."),
        name: z.string().describe("The display name of the inbox."),
        namespaceId: z.string().describe("The id of the namespace."),
        namespaceName: z.string().describe("The display name of the namespace."),
        agentId: z.string().describe("The AI agent identifier."),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const inboxId = String(args.inboxId);
        const result = await nuntly.inboxes.retrieve(inboxId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // POST /inboxes/{inboxId}/messages
  server.registerTool(
    'send-inbox-message',
    {
      title: "Send Inbox Message",
      description: "Send a new message from an inbox.",
      inputSchema: {
        inboxId: z.string().describe("The inboxId"),
        to: z.array(z.string()).describe("The recipient addresses."),
        cc: z.array(z.string()).describe("The CC addresses.").optional(),
        bcc: z.array(z.string()).describe("The BCC addresses.").optional(),
        subject: z.string().describe("The message subject."),
        text: z.string().describe("The plain text body.").optional(),
        html: z.string().describe("The HTML body.").optional(),
      },
      outputSchema: {
        id: z.string().describe("The id of the message"),
        threadId: z.string().describe("The id of the thread."),
        messageId: z.string().describe("The RFC 5322 Message-ID header."),
        subject: z.string().describe("The subject of the message."),
      },
      annotations: {"openWorldHint":true},
    },
    async (args) => {
      try {
        const inboxId = String(args.inboxId);
        const { inboxId: _inboxId, ...body } = args;
        const result = await nuntly.inboxes.messages.send(inboxId, body as SendMessageRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /inboxes/{inboxId}
  server.registerTool(
    'update-inbox',
    {
      title: "Update Inbox",
      description: "Update an inbox.",
      inputSchema: {
        inboxId: z.string().describe("The inboxId"),
        name: z.string().describe("The display name of the inbox.").optional(),
      },
      outputSchema: {
        id: z.string().describe("The id of the resource."),
      },
      annotations: {"openWorldHint":true},
    },
    async (args) => {
      try {
        const inboxId = String(args.inboxId);
        const { inboxId: _inboxId, ...body } = args;
        const result = await nuntly.inboxes.update(inboxId, body as UpdateInboxRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
