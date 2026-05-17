import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly, ForwardMessageRequest, MessagesQuery, ReplyMessageRequest, UpdateMessageRequest } from '@nuntly/sdk';
import { formatStructuredResult, formatError } from '../helpers.js';

export function registerMessagesTools(server: McpServer, nuntly: Nuntly): void {

  // POST /messages/{messageId}/forward
  server.registerTool(
    'forward-message',
    {
      description: "Forward a message to new recipients.",
      inputSchema: {
        messageId: z.string().describe("The messageId"),
        to: z.array(z.string()).describe("The recipient addresses to forward to."),
        text: z.string().describe("An optional comment to prepend.").optional(),
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
        const messageId = String(args.messageId);
        const { messageId: _messageId, ...body } = args;
        const result = await nuntly.messages.forward(messageId, body as ForwardMessageRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /messages/{messageId}/attachments
  server.registerTool(
    'list-message-attachments',
    {
      description: "List all attachments for a message.",
      inputSchema: {
        messageId: z.string().describe("The messageId"),
      },
      outputSchema: {
        data: z.array(z.object({ id: z.string().describe("The id of the attachment"), filename: z.string().describe("The original filename."), contentType: z.string().describe("The MIME content type."), size: z.number().describe("The size in bytes."), contentDisposition: z.string().describe("The content disposition (inline or attachment)."), contentId: z.string().describe("The CID for inline images."), downloadUrl: z.string().describe("Presigned download URL (included when retrieving a single attachment).").optional() })),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const messageId = String(args.messageId);
        const result = await nuntly.messages.attachments.list(messageId);
        return formatStructuredResult({ data: result });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /messages
  server.registerTool(
    'list-messages',
    {
      description: "List all received messages across inboxes.",
      inputSchema: {
        cursor: z.string().describe("The cursor to retrieve the next page of results").optional(),
        limit: z.number().describe("The maximum number of results to return").optional(),
        domainId: z.string().describe("Filter by domain.").optional(),
        from: z.string().describe("Filter by sender address.").optional(),
      },
      outputSchema: {
        data: z.array(z.record(z.string(), z.unknown())),
        nextCursor: z.string().optional(),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const page = await nuntly.messages.list({ cursor: args.cursor, limit: args.limit, domainId: args.domainId, from: args.from } as MessagesQuery);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // POST /messages/{messageId}/reply
  server.registerTool(
    'reply-to-message',
    {
      description: "Reply to a message. Set replyAll to true to reply to all recipients.",
      inputSchema: {
        messageId: z.string().describe("The messageId"),
        text: z.string().describe("The plain text body.").optional(),
        html: z.string().describe("The HTML body.").optional(),
        replyAll: z.boolean().describe("Whether to reply to all recipients."),
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
        const messageId = String(args.messageId);
        const { messageId: _messageId, ...body } = args;
        const result = await nuntly.messages.reply(messageId, body as ReplyMessageRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /messages/{messageId}
  server.registerTool(
    'retrieve-message',
    {
      description: "Retrieve a single message with inbox enrichment.",
      inputSchema: {
        messageId: z.string().describe("The messageId"),
      },
      outputSchema: {
        id: z.string().describe("The id of the message"),
        createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"),
        inboxId: z.string().describe("The id of the inbox, or null if routed to the default catch-all."),
        threadId: z.string().describe("The id of the thread."),
        messageId: z.string().describe("The email Message-ID header."),
        from: z.string().describe("The sender address (RFC 5322 format, e.g. \"Jane Doe <jane@example.com>\" or \"jane@example.com\")."),
        to: z.array(z.string()).describe("The recipient addresses."),
        cc: z.array(z.string()).describe("The CC addresses."),
        bcc: z.array(z.string()).describe("The BCC addresses."),
        replyTo: z.array(z.string()).describe("The Reply-To addresses."),
        subject: z.string().describe("The message subject."),
        receivedAt: z.string().describe("The original date of the message."),
        status: z.enum(['received', 'sent', 'discarded', 'failed']).describe("The status of the message"),
        labels: z.array(z.string()).describe("The message labels."),
        attachmentCount: z.number().describe("The number of attachments."),
        headers: z.record(z.string(), z.unknown()).describe("The raw email headers."),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const messageId = String(args.messageId);
        const result = await nuntly.messages.retrieve(messageId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /messages/{messageId}/attachments/{attachmentId}
  server.registerTool(
    'retrieve-message-attachment',
    {
      description: "Retrieve an attachment with a presigned download URL.",
      inputSchema: {
        messageId: z.string().describe("The messageId"),
        attachmentId: z.string().describe("The attachmentId"),
      },
      outputSchema: {
        id: z.string().describe("The id of the attachment"),
        filename: z.string().describe("The original filename."),
        contentType: z.string().describe("The MIME content type."),
        size: z.number().describe("The size in bytes."),
        contentDisposition: z.string().describe("The content disposition (inline or attachment)."),
        contentId: z.string().describe("The CID for inline images."),
        downloadUrl: z.string().describe("Presigned download URL (included when retrieving a single attachment).").optional(),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const messageId = String(args.messageId);
        const attachmentId = String(args.attachmentId);
        const result = await nuntly.messages.attachments.retrieve(messageId, attachmentId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /messages/{messageId}/content
  server.registerTool(
    'retrieve-message-content',
    {
      description: "Returns presigned URLs to download the HTML, plain-text, and raw MIME source of a received message.",
      inputSchema: {
        messageId: z.string().describe("The messageId"),
      },
      outputSchema: {
        text: z.object({ downloadUrl: z.string().describe("Presigned download URL."), size: z.number().describe("Uncompressed size in bytes."), expiresAt: z.string().describe("When the URL expires.") }).describe("Plain text content, or `null` if not requested or unavailable."),
        html: z.object({ downloadUrl: z.string().describe("Presigned download URL."), size: z.number().describe("Uncompressed size in bytes."), expiresAt: z.string().describe("When the URL expires.") }).describe("HTML content, or `null` if not requested or unavailable."),
        mime: z.object({ downloadUrl: z.string().describe("Presigned download URL."), size: z.number().describe("Uncompressed size in bytes."), expiresAt: z.string().describe("When the URL expires.") }).describe("Raw MIME (.eml) content, or `null` if not requested or unavailable. Returned for received messages only."),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const messageId = String(args.messageId);
        const result = await nuntly.messages.content.retrieve(messageId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /messages/{messageId}
  server.registerTool(
    'update-message',
    {
      description: "Update message labels. Only available for messages in user-created inboxes.",
      inputSchema: {
        messageId: z.string().describe("The messageId"),
        addLabels: z.array(z.string()).describe("Labels to add to the message.").optional(),
        removeLabels: z.array(z.string()).describe("Labels to remove from the message.").optional(),
      },
      outputSchema: {
        id: z.string().describe("The id of the resource."),
      },
      annotations: {"openWorldHint":true},
    },
    async (args) => {
      try {
        const messageId = String(args.messageId);
        const { messageId: _messageId, ...body } = args;
        const result = await nuntly.messages.update(messageId, body as UpdateMessageRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
