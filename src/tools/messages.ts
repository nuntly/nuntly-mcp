import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly } from '@nuntly/sdk';
import { formatResult, formatError } from '../helpers.js';

export function registerMessagesTools(server: McpServer, nuntly: Nuntly): void {

  // GET /messages
  server.tool(
    'list-messages',
    "List all received messages across inboxes.",
    {
    cursor: z.string().describe("The cursor to retrieve the next page of results").optional(),
    limit: z.number().describe("The maximum number of results to return").optional(),
    domainId: z.string().describe("Filter by domain.").optional(),
    from: z.string().describe("Filter by sender address.").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const page = await nuntly.messages.list({ cursor: args.cursor, limit: args.limit } as any);
        return formatResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /messages/{messageId}
  server.tool(
    'retrieve-message',
    "Retrieve a single message with inbox enrichment.",
    {
    messageId: z.string().describe("The messageId"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const messageId = String(args.messageId);
        const result = await nuntly.messages.retrieve(messageId);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /messages/{messageId}/content
  server.tool(
    'retrieve-message-content',
    "Returns presigned URLs to download the HTML, plain-text, and raw MIME source of a received message.",
    {
    messageId: z.string().describe("The messageId"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const messageId = String(args.messageId);
        const result = await nuntly.messages.content.retrieve(messageId);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /messages/{messageId}/attachments
  server.tool(
    'list-message-attachments',
    "List all attachments for a message.",
    {
    messageId: z.string().describe("The messageId"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const messageId = String(args.messageId);
        const result = await nuntly.messages.attachments.list(messageId);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /messages/{messageId}/attachments/{attachmentId}
  server.tool(
    'retrieve-message-attachment',
    "Retrieve an attachment with a presigned download URL.",
    {
    messageId: z.string().describe("The messageId"),
    attachmentId: z.string().describe("The attachmentId"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const messageId = String(args.messageId);
        const attachmentId = String(args.attachmentId);
        const result = await nuntly.messages.attachments.retrieve(messageId, attachmentId);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /messages/{messageId}
  server.tool(
    'update-message',
    "Update message labels. Only available for messages in user-created inboxes.",
    {
    messageId: z.string().describe("The messageId"),
    addLabels: z.array(z.string()).describe("Labels to add to the message.").optional(),
    removeLabels: z.array(z.string()).describe("Labels to remove from the message.").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const messageId = String(args.messageId);
        const { messageId: _messageId, ...body } = args;
        const result = await nuntly.messages.update(messageId, body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // POST /messages/{messageId}/reply
  server.tool(
    'reply-to-message',
    "Reply to a message. Set replyAll to true to reply to all recipients.",
    {
    messageId: z.string().describe("The messageId"),
    text: z.string().describe("The plain text body.").optional(),
    html: z.string().describe("The HTML body.").optional(),
    replyAll: z.boolean().describe("Whether to reply to all recipients."),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const messageId = String(args.messageId);
        const { messageId: _messageId, ...body } = args;
        const result = await nuntly.messages.reply(messageId, body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // POST /messages/{messageId}/forward
  server.tool(
    'forward-message',
    "Forward a message to new recipients.",
    {
    messageId: z.string().describe("The messageId"),
    to: z.array(z.string()).describe("The recipient addresses to forward to."),
    text: z.string().describe("An optional comment to prepend.").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const messageId = String(args.messageId);
        const { messageId: _messageId, ...body } = args;
        const result = await nuntly.messages.forward(messageId, body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
