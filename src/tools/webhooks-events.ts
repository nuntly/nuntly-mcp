import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly } from '@nuntly/sdk';
import { formatResult, formatError } from '../helpers.js';

export function registerWebhooksEventsTools(server: McpServer, nuntly: Nuntly): void {

  // GET /webhooks/events
  server.tool(
    'list-webhooks-events',
    "Returns recent webhook events across all registered endpoints.",
    {
    cursor: z.string().describe("Pagination cursor from a previous response").optional(),
    limit: z.number().describe("Maximum number of items to return").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const page = await nuntly.webhooks.events.list({ cursor: args.cursor, limit: args.limit } as any);
        return formatResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // POST /webhooks/{id}/events/{eventId}/replay
  server.tool(
    'replay-webhook-event',
    "Re-deliver a webhook event to its endpoint. Useful for retrying failed deliveries.",
    {
    id: z.string().describe("The webhooks event ID"),
    eventId: z.string().describe("The eventId"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const eventId = String(args.eventId);
        const result = await nuntly.webhooks.events.replay(id, eventId);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /webhooks/{id}/events/{eventId}/deliveries
  server.tool(
    'list-webhook-event-deliveries',
    "Returns all delivery attempts for a webhook event, including HTTP status codes and response times.",
    {
    id: z.string().describe("The webhooks event ID"),
    eventId: z.string().describe("The eventId"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const eventId = String(args.eventId);
        const result = await nuntly.webhooks.events.deliveries(id, eventId);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
