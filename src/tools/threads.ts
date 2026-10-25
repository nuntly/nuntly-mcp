import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CursorPageParams, Nuntly, RetrieveThreadQuery, ThreadsQuery, UpdateThreadRequest } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';
import { idResponseOutput, threadResponseOutput } from '../schemas.js';

export function registerThreadsTools(server: McpServer, nuntly: Nuntly): void {
  // GET /inboxes/{inboxId}/threads
  server.registerTool(
    'list-inbox-threads',
    {
      title: 'List Inbox Threads',
      description:
        'Lists the threads in an inbox, most recently active first, with cursor pagination. Filter by labels; spam and trash threads are excluded by default.',
      inputSchema: z
        .object({
          inboxId: z.string().describe('The inboxId'),
          cursor: z.string().describe('The cursor to retrieve the next page of results').optional(),
          limit: z
            .number()
            .int()
            .min(1)
            .max(30)
            .describe('The maximum number of results to return, from 1 to 30. Defaults to 30.')
            .optional(),
          labels: z
            .string()
            .describe(
              'Comma-separated labels to filter by (AND logic). Threads with spam/trash are excluded by default unless explicitly requested via ?labels=spam or ?labels=trash.',
            )
            .optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          data: z.array(threadResponseOutput()),
          nextCursor: z.string().nullable().optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const inboxId = String(args.inboxId);
        const page = await nuntly.inboxes.threads.list(inboxId, {
          cursor: args.cursor,
          limit: args.limit,
          labels: args.labels,
        } as ThreadsQuery);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /threads/{threadId}/messages
  server.registerTool(
    'list-thread-messages',
    {
      title: 'List Thread Messages',
      description:
        'Lists the messages in a thread in chronological order, oldest first, with cursor pagination. Returns up to 30 messages per page.',
      inputSchema: z
        .object({
          threadId: z.string().describe('The threadId'),
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
          data: z.array(
            z
              .object({
                id: z.string().describe('The id of the message'),
                createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
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
        const threadId = String(args.threadId);
        const page = await nuntly.threads.messages.list(threadId, {
          cursor: args.cursor,
          limit: args.limit,
        } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /threads/{threadId}
  server.registerTool(
    'retrieve-thread',
    {
      title: 'Retrieve Thread',
      description:
        'Retrieves a thread with its subject, message count, last activity and labels from all its messages. Pass markRead=true to clear unread labels.',
      inputSchema: z
        .object({
          threadId: z.string().describe('The threadId'),
          markRead: z
            .enum(['true', 'false'])
            .describe('When true, removes the unread label from all messages in the thread.')
            .optional(),
        })
        .strict(),
      outputSchema: threadResponseOutput(),
      annotations: { openWorldHint: true, destructiveHint: false, idempotentHint: true },
    },
    async (args) => {
      try {
        const threadId = String(args.threadId);
        const result = await nuntly.threads.retrieve(threadId, { markRead: args.markRead } as RetrieveThreadQuery);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /threads/{threadId}
  server.registerTool(
    'update-thread',
    {
      title: 'Update Thread',
      description:
        'Adds or removes labels on every message in a thread, or sets its agent. Label operations only work on threads in user-created inboxes.',
      inputSchema: z
        .object({
          threadId: z.string().describe('The threadId'),
          addLabels: z.array(z.string()).describe('Labels to add to all messages in the thread.').optional(),
          removeLabels: z.array(z.string()).describe('Labels to remove from all messages in the thread.').optional(),
          agentId: z.string().nullable().describe('The AI agent identifier.').optional(),
        })
        .strict(),
      outputSchema: idResponseOutput(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const threadId = String(args.threadId);
        const { threadId: _threadId, ...body } = args;
        const result = await nuntly.threads.update(threadId, body as UpdateThreadRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
