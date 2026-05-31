import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly, CursorPageParams, ThreadsQuery, UpdateThreadRequest } from '@nuntly/sdk';
import { formatStructuredResult, formatError } from '../helpers.js';

export function registerThreadsTools(server: McpServer, nuntly: Nuntly): void {

  // GET /inboxes/{inboxId}/threads
  server.registerTool(
    'list-inbox-threads',
    {
      title: "List Inbox Threads",
      description: "List threads in an inbox.",
      inputSchema: {
        inboxId: z.string().describe("The inboxId"),
        cursor: z.string().describe("The cursor to retrieve the next page of results").optional(),
        limit: z.number().describe("The maximum number of results to return").optional(),
        labels: z.string().describe("Comma-separated labels to filter by (AND logic). Threads with spam/trash are excluded by default unless explicitly requested via ?labels=spam or ?labels=trash.").optional(),
      },
      outputSchema: {
        data: z.array(z.object({ id: z.string().describe("The id of the thread"), createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"), updatedAt: z.string().describe("Date at which the object was updated (ISO 8601 format)").optional(), domainId: z.string().describe("The id of the domain."), domainName: z.string().describe("The domain name."), inboxId: z.string().describe("The id of the inbox."), subject: z.string().describe("The original subject line."), lastMessageAt: z.string().describe("The timestamp of the most recent message."), messageCount: z.number().describe("The number of messages in the thread."), labels: z.array(z.string()).describe("Aggregated labels from all messages in the thread."), agentId: z.string().describe("The AI agent identifier.") })),
        nextCursor: z.string().optional(),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const inboxId = String(args.inboxId);
        const page = await nuntly.inboxes.threads.list(inboxId, { cursor: args.cursor, limit: args.limit, labels: args.labels } as ThreadsQuery);
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
      title: "List Thread Messages",
      description: "List messages in a thread (chronological order).",
      inputSchema: {
        threadId: z.string().describe("The threadId"),
        cursor: z.string().describe("Pagination cursor from a previous response").optional(),
        limit: z.number().describe("Maximum number of items to return").optional(),
      },
      outputSchema: {
        data: z.array(z.object({ id: z.string().describe("The id of the message"), createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"), threadId: z.string().describe("The id of the thread."), messageId: z.string().describe("The email Message-ID header."), from: z.string().describe("The sender address (RFC 5322 format, e.g. \"Jane Doe <jane@example.com>\" or \"jane@example.com\")."), to: z.array(z.string()).describe("The recipient addresses."), cc: z.array(z.string()).describe("The CC addresses."), bcc: z.array(z.string()).describe("The BCC addresses."), replyTo: z.array(z.string()).describe("The Reply-To addresses."), subject: z.string().describe("The message subject."), receivedAt: z.string().describe("The original date of the message."), status: z.enum(['received', 'sent', 'discarded', 'failed']).describe("The status of the message"), labels: z.array(z.string()).describe("The message labels."), attachmentCount: z.number().describe("The number of attachments.") })),
        nextCursor: z.string().optional(),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const threadId = String(args.threadId);
        const page = await nuntly.threads.messages.list(threadId, { cursor: args.cursor, limit: args.limit } as CursorPageParams);
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
      title: "Retrieve Thread",
      description: "Retrieve a thread. Pass ?markRead=true to automatically remove the unread label from all messages.",
      inputSchema: {
        threadId: z.string().describe("The threadId"),
      },
      outputSchema: {
        id: z.string().describe("The id of the thread"),
        createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"),
        updatedAt: z.string().describe("Date at which the object was updated (ISO 8601 format)").optional(),
        domainId: z.string().describe("The id of the domain."),
        domainName: z.string().describe("The domain name."),
        inboxId: z.string().describe("The id of the inbox."),
        subject: z.string().describe("The original subject line."),
        lastMessageAt: z.string().describe("The timestamp of the most recent message."),
        messageCount: z.number().describe("The number of messages in the thread."),
        labels: z.array(z.string()).describe("Aggregated labels from all messages in the thread."),
        agentId: z.string().describe("The AI agent identifier."),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const threadId = String(args.threadId);
        const result = await nuntly.threads.retrieve(threadId);
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
      title: "Update Thread",
      description: "Update thread labels and agent assignment. Label operations apply to all messages in the thread.",
      inputSchema: {
        threadId: z.string().describe("The threadId"),
        addLabels: z.array(z.string()).describe("Labels to add to all messages in the thread.").optional(),
        removeLabels: z.array(z.string()).describe("Labels to remove from all messages in the thread.").optional(),
        agentId: z.string().describe("The AI agent identifier.").optional(),
      },
      outputSchema: {
        id: z.string().describe("The id of the resource."),
      },
      annotations: {"openWorldHint":true},
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
