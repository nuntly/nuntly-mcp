import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly } from '@nuntly/sdk';
import { formatResult, formatError } from '../helpers.js';

export function registerInboxesTools(server: McpServer, nuntly: Nuntly): void {

  // POST /inboxes
  server.tool(
    'create-inbox',
    "Create a new inbox on a verified domain.",
    {
    domainId: z.string().describe("The id of the domain for this inbox. Defaults to your provided domain when omitted.").optional(),
    address: z.string().describe("The local-part of the email address (before the @)."),
    name: z.string().describe("The display name of the inbox.").optional(),
    namespaceId: z.string().describe("The id of the namespace to assign the inbox to.").optional(),
    agentId: z.string().describe("The external AI agent identifier.").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const body = args;
        const result = await nuntly.inboxes.create(body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /inboxes/{inboxId}
  server.tool(
    'delete-inbox',
    "Soft-delete an inbox.",
    {
    inboxId: z.string().describe("The inboxId"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const inboxId = String(args.inboxId);
        const result = await nuntly.inboxes.delete(inboxId);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /inboxes
  server.tool(
    'list-inboxes',
    "List all inboxes.",
    {
    cursor: z.string().describe("The cursor to retrieve the next page of results").optional(),
    limit: z.number().describe("The maximum number of results to return").optional(),
    namespaceId: z.string().describe("Filter by namespace.").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const page = await nuntly.inboxes.list({ cursor: args.cursor, limit: args.limit, namespaceId: args.namespaceId } as any);
        return formatResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /inboxes/{inboxId}
  server.tool(
    'retrieve-inbox',
    "Retrieve an inbox.",
    {
    inboxId: z.string().describe("The inboxId"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const inboxId = String(args.inboxId);
        const result = await nuntly.inboxes.retrieve(inboxId);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // POST /inboxes/{inboxId}/messages
  server.tool(
    'send-inbox-message',
    "Send a new message from an inbox.",
    {
    inboxId: z.string().describe("The inboxId"),
    to: z.array(z.string()).describe("The recipient addresses."),
    cc: z.array(z.string()).describe("The CC addresses.").optional(),
    bcc: z.array(z.string()).describe("The BCC addresses.").optional(),
    subject: z.string().describe("The message subject."),
    text: z.string().describe("The plain text body.").optional(),
    html: z.string().describe("The HTML body.").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const inboxId = String(args.inboxId);
        const { inboxId: _inboxId, ...body } = args;
        const result = await nuntly.inboxes.messages.send(inboxId, body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /inboxes/{inboxId}
  server.tool(
    'update-inbox',
    "Update an inbox.",
    {
    inboxId: z.string().describe("The inboxId"),
    name: z.string().describe("The display name of the inbox.").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const inboxId = String(args.inboxId);
        const { inboxId: _inboxId, ...body } = args;
        const result = await nuntly.inboxes.update(inboxId, body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
