import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CreateInboxRequest, InboxesQuery, Nuntly, SendMessageRequest, UpdateInboxRequest } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';
import { idResponseOutput, inboxResponseOutput, sendMessageResponseOutput } from '../schemas.js';

export function registerInboxesTools(server: McpServer, nuntly: Nuntly): void {
  // POST /inboxes
  server.registerTool(
    'create-inbox',
    {
      title: 'Create Inbox',
      description:
        'Creates an inbox address on a verified domain with receiving active, or on your provided domain if none is given. Can assign a namespace and agent id.',
      inputSchema: z
        .object({
          domainId: z
            .string()
            .describe('The id of the domain for this inbox. Defaults to your provided domain when omitted.')
            .optional(),
          address: z.string().describe('The local-part of the email address (before the @).'),
          name: z.string().describe('The display name of the inbox.').optional(),
          namespaceId: z.string().describe('The id of the namespace to assign the inbox to.').optional(),
          agentId: z.string().describe('The external AI agent identifier.').optional(),
        })
        .strict(),
      outputSchema: inboxResponseOutput(),
      annotations: { openWorldHint: true },
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
      title: 'Delete Inbox',
      description:
        'Deletes an inbox so it no longer appears in lists and stops matching incoming mail. The default catch-all inbox of a domain cannot be deleted.',
      inputSchema: z
        .object({
          inboxId: z.string().describe('The inboxId'),
        })
        .strict(),
      outputSchema: idResponseOutput(),
      annotations: { openWorldHint: true, destructiveHint: true },
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
      title: 'List Inboxes',
      description:
        'Lists the active inboxes of your organization, newest first, with cursor pagination. Optionally filter the results to a single namespace.',
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
          namespaceId: z.string().describe('Filter by namespace.').optional(),
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
        const page = await nuntly.inboxes.list({
          cursor: args.cursor,
          limit: args.limit,
          namespaceId: args.namespaceId,
        } as InboxesQuery);
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
      title: 'Retrieve Inbox',
      description:
        'Retrieves an inbox by id, including its address, domain, display name, namespace, and assigned agent id. Deleted inboxes return a not found error.',
      inputSchema: z
        .object({
          inboxId: z.string().describe('The inboxId'),
        })
        .strict(),
      outputSchema: inboxResponseOutput(),
      annotations: { openWorldHint: true, readOnlyHint: true },
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
      title: 'Send Inbox Message',
      description:
        'Sends a new email from an inbox to one or more recipients. The message is queued for delivery and the response returns its id, thread id, and Message-ID.',
      inputSchema: z
        .object({
          inboxId: z.string().describe('The inboxId'),
          to: z.array(z.string()).describe('The recipient addresses.'),
          cc: z.array(z.string()).describe('The CC addresses.').optional(),
          bcc: z.array(z.string()).describe('The BCC addresses.').optional(),
          subject: z.string().describe('The message subject.'),
          text: z.string().describe('The plain text body.').optional(),
          html: z.string().describe('The HTML body.').optional(),
        })
        .strict(),
      outputSchema: sendMessageResponseOutput(),
      annotations: { openWorldHint: true },
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
      title: 'Update Inbox',
      description:
        'Updates the display name of an inbox, used as the sender name on messages it sends. Set the name to null to clear it. Returns the inbox id.',
      inputSchema: z
        .object({
          inboxId: z.string().describe('The inboxId'),
          name: z.string().nullable().describe('The display name of the inbox.').optional(),
        })
        .strict(),
      outputSchema: idResponseOutput(),
      annotations: { openWorldHint: true },
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
