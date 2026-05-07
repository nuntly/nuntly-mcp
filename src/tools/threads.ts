import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly } from '@nuntly/sdk';
import { formatResult, formatError } from '../helpers.js';

export function registerThreadsTools(server: McpServer, nuntly: Nuntly): void {

  // GET /inboxes/{inboxId}/threads
  server.tool(
    'list-inbox-threads',
    "List threads in an inbox.",
    {
    inboxId: z.string().describe("The inboxId"),
    cursor: z.string().describe("The cursor to retrieve the next page of results").optional(),
    limit: z.number().describe("The maximum number of results to return").optional(),
    labels: z.string().describe("Comma-separated labels to filter by (AND logic). Threads with spam/trash are excluded by default unless explicitly requested via ?labels=spam or ?labels=trash.").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const inboxId = String(args.inboxId);
        const page = await nuntly.inboxes.threads.list(inboxId, { cursor: args.cursor, limit: args.limit } as any);
        return formatResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /threads/{threadId}
  server.tool(
    'retrieve-thread',
    "Retrieve a thread. Pass ?markRead=true to automatically remove the unread label from all messages.",
    {
    threadId: z.string().describe("The threadId"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const threadId = String(args.threadId);
        const result = await nuntly.threads.retrieve(threadId);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /threads/{threadId}
  server.tool(
    'update-thread',
    "Update thread labels and agent assignment. Label operations apply to all messages in the thread.",
    {
    threadId: z.string().describe("The threadId"),
    addLabels: z.array(z.string()).describe("Labels to add to all messages in the thread.").optional(),
    removeLabels: z.array(z.string()).describe("Labels to remove from all messages in the thread.").optional(),
    agentId: z.string().describe("The AI agent identifier.").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const threadId = String(args.threadId);
        const { threadId: _threadId, ...body } = args;
        const result = await nuntly.threads.update(threadId, body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /threads/{threadId}/messages
  server.tool(
    'list-thread-messages',
    "List messages in a thread (chronological order).",
    {
    threadId: z.string().describe("The threadId"),
    cursor: z.string().describe("Pagination cursor from a previous response").optional(),
    limit: z.number().describe("Maximum number of items to return").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const threadId = String(args.threadId);
        const page = await nuntly.threads.messages.list(threadId, { cursor: args.cursor, limit: args.limit } as any);
        return formatResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
