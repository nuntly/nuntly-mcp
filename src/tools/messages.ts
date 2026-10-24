import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  ForwardMessageRequest,
  MessageContentQuery,
  MessagesQuery,
  Nuntly,
  ReplyMessageRequest,
  UpdateMessageRequest,
} from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';

export function registerMessagesTools(server: McpServer, nuntly: Nuntly): void {
  // POST /messages/{messageId}/forward
  server.registerTool(
    'forward-message',
    {
      title: 'Forward Message',
      description:
        'Sends a message with a Fwd: subject from the inbox of the original message to one or more new recipients, in a new thread, with an optional text note.',
      inputSchema: z
        .object({
          messageId: z.string().describe('The messageId'),
          to: z.array(z.string()).describe('The recipient addresses to forward to.'),
          text: z.string().describe('An optional comment to prepend.').optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the message'),
          threadId: z.string().describe('The id of the thread.'),
          messageId: z.string().describe('The RFC 5322 Message-ID header.'),
          subject: z.string().describe('The subject of the message.'),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
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
      title: 'List Message Attachments',
      description:
        'Lists the attachments of a message with their filename, content type, size, disposition and content id. Download links are not included.',
      inputSchema: z
        .object({
          messageId: z.string().describe('The messageId'),
        })
        .strict(),
      outputSchema: z
        .object({
          data: z.array(
            z
              .object({
                id: z.string().describe('The id of the attachment'),
                filename: z.string().nullable().describe('The original filename.'),
                contentType: z.string().describe('The MIME content type.'),
                size: z.number().describe('The size in bytes.'),
                contentDisposition: z.string().nullable().describe('The content disposition (inline or attachment).'),
                contentId: z.string().nullable().describe('The CID for inline images.'),
                downloadUrl: z
                  .string()
                  .describe('Presigned download URL (included when retrieving a single attachment).')
                  .optional(),
              })
              .passthrough(),
          ),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
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
      title: 'List Messages',
      description:
        'Lists messages newest first, with cursor pagination and optional filters by domain and sender. Each item includes its labels, status and attachment count.',
      inputSchema: z
        .object({
          cursor: z.string().describe('The cursor to retrieve the next page of results').optional(),
          limit: z.number().describe('The maximum number of results to return').optional(),
          domainId: z.string().describe('Filter by domain.').optional(),
          from: z.string().describe('Filter by sender address.').optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          data: z.array(
            z
              .object({
                id: z.string().describe('The id of the message'),
                createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
                inboxId: z
                  .string()
                  .nullable()
                  .describe('The id of the inbox, or null if routed to the default catch-all.'),
                threadId: z.string().describe('The id of the thread.'),
                messageId: z.string().describe('The email Message-ID header.'),
                from: z
                  .string()
                  .describe(
                    'The sender address (RFC 5322 format, e.g. "Jane Doe <jane@example.com>" or "jane@example.com").',
                  ),
                to: z.array(z.string()).describe('The recipient addresses.'),
                cc: z.array(z.string()).nullable().describe('The CC addresses.'),
                bcc: z.array(z.string()).nullable().describe('The BCC addresses.'),
                replyTo: z.array(z.string()).nullable().describe('The Reply-To addresses.'),
                subject: z.string().describe('The message subject.'),
                receivedAt: z.string().describe('The original date of the message.'),
                status: z
                  .enum(['received', 'sent', 'discarded', 'failed'])
                  .or(z.string())
                  .describe('The status of the message'),
                labels: z.array(z.string()).describe('The message labels.'),
                attachmentCount: z.number().describe('The number of attachments.'),
              })
              .passthrough(),
          ),
          nextCursor: z.string().nullable().optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const page = await nuntly.messages.list({
          cursor: args.cursor,
          limit: args.limit,
          domainId: args.domainId,
          from: args.from,
        } as MessagesQuery);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // POST /messages/{messageId}/reply
  server.registerTool(
    'reply-message',
    {
      title: 'Reply Message',
      description:
        'Replies from the inbox that holds the message, in the same thread. Set replyAll to true to also copy the other recipients. The send is queued.',
      inputSchema: z
        .object({
          messageId: z.string().describe('The messageId'),
          text: z.string().describe('The plain text body.').optional(),
          html: z.string().describe('The HTML body.').optional(),
          replyAll: z.boolean().describe('Whether to reply to all recipients.'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the message'),
          threadId: z.string().describe('The id of the thread.'),
          messageId: z.string().describe('The RFC 5322 Message-ID header.'),
          subject: z.string().describe('The subject of the message.'),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
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
      title: 'Retrieve Message',
      description:
        'Retrieves a received or sent message by id, including its sender, recipients, subject, labels, status, attachment count and raw headers.',
      inputSchema: z
        .object({
          messageId: z.string().describe('The messageId'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the message'),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
          inboxId: z.string().nullable().describe('The id of the inbox, or null if routed to the default catch-all.'),
          threadId: z.string().describe('The id of the thread.'),
          messageId: z.string().describe('The email Message-ID header.'),
          from: z
            .string()
            .describe(
              'The sender address (RFC 5322 format, e.g. "Jane Doe <jane@example.com>" or "jane@example.com").',
            ),
          to: z.array(z.string()).describe('The recipient addresses.'),
          cc: z.array(z.string()).nullable().describe('The CC addresses.'),
          bcc: z.array(z.string()).nullable().describe('The BCC addresses.'),
          replyTo: z.array(z.string()).nullable().describe('The Reply-To addresses.'),
          subject: z.string().describe('The message subject.'),
          receivedAt: z.string().describe('The original date of the message.'),
          status: z
            .enum(['received', 'sent', 'discarded', 'failed'])
            .or(z.string())
            .describe('The status of the message'),
          labels: z.array(z.string()).describe('The message labels.'),
          attachmentCount: z.number().describe('The number of attachments.'),
          headers: z.record(z.string(), z.unknown()).nullable().describe('The raw email headers.'),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
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
      title: 'Retrieve Message Attachment',
      description:
        'Retrieves the metadata of an attachment and a temporary download URL that expires after 15 minutes. Use it to fetch the attachment file itself.',
      inputSchema: z
        .object({
          messageId: z.string().describe('The messageId'),
          attachmentId: z.string().describe('The attachmentId'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the attachment'),
          filename: z.string().nullable().describe('The original filename.'),
          contentType: z.string().describe('The MIME content type.'),
          size: z.number().describe('The size in bytes.'),
          contentDisposition: z.string().nullable().describe('The content disposition (inline or attachment).'),
          contentId: z.string().nullable().describe('The CID for inline images.'),
          downloadUrl: z
            .string()
            .describe('Presigned download URL (included when retrieving a single attachment).')
            .optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
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
      title: 'Retrieve Message Content',
      description:
        'Returns temporary download URLs, valid for 2 minutes, for the HTML, plain-text or raw MIME content of a message. Only HTML is returned by default.',
      inputSchema: z
        .object({
          messageId: z.string().describe('The messageId'),
          format: z
            .array(z.enum(['html', 'text', 'mime']))
            .describe('Content formats to retrieve. Defaults to `html` only.')
            .optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          text: z
            .object({
              downloadUrl: z.string().describe('Presigned download URL.'),
              size: z.number().nullable().describe('Uncompressed size in bytes.'),
              expiresAt: z.string().describe('When the URL expires.'),
            })
            .passthrough()
            .nullable()
            .describe('Plain text content, or `null` if not requested or unavailable.'),
          html: z
            .object({
              downloadUrl: z.string().describe('Presigned download URL.'),
              size: z.number().nullable().describe('Uncompressed size in bytes.'),
              expiresAt: z.string().describe('When the URL expires.'),
            })
            .passthrough()
            .nullable()
            .describe('HTML content, or `null` if not requested or unavailable.'),
          mime: z
            .object({
              downloadUrl: z.string().describe('Presigned download URL.'),
              size: z.number().nullable().describe('Uncompressed size in bytes.'),
              expiresAt: z.string().describe('When the URL expires.'),
            })
            .passthrough()
            .nullable()
            .describe(
              'Raw MIME (.eml) content, or `null` if not requested or unavailable. Returned for received messages only.',
            ),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const messageId = String(args.messageId);
        const result = await nuntly.messages.content.retrieve(messageId, {
          format: args.format,
        } as MessageContentQuery);
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
      title: 'Update Message',
      description:
        'Adds or removes labels on a message. Only messages in user-created inboxes accept labels, and a message can hold at most 10 labels.',
      inputSchema: z
        .object({
          messageId: z.string().describe('The messageId'),
          addLabels: z.array(z.string()).describe('Labels to add to the message.').optional(),
          removeLabels: z.array(z.string()).describe('Labels to remove from the message.').optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the resource.'),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
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
