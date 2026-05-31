import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly, CursorPageParams } from '@nuntly/sdk';
import { formatStructuredResult, formatError } from '../helpers.js';

export function registerWebhooksEventsTools(server: McpServer, nuntly: Nuntly): void {

  // GET /webhooks/{id}/events/{eventId}/deliveries
  server.registerTool(
    'list-webhook-event-deliveries',
    {
      title: "List Webhook Event Deliveries",
      description: "Returns all delivery attempts for a webhook event, including HTTP status codes and response times.",
      inputSchema: {
        id: z.string().describe("The webhooks event ID"),
        eventId: z.string().describe("The eventId"),
      },
      outputSchema: {
        data: z.array(z.object({ id: z.string(), deliveredAt: z.string(), code: z.string(), status: z.enum(['pending', 'success', 'failed']), response: z.record(z.string(), z.unknown()) })),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const id = String(args.id);
        const eventId = String(args.eventId);
        const result = await nuntly.webhooks.events.deliveries(id, eventId);
        return formatStructuredResult({ data: result });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /webhooks/events
  server.registerTool(
    'list-webhooks-events',
    {
      title: "List Webhooks Events",
      description: "Returns recent webhook events across all registered endpoints.",
      inputSchema: {
        cursor: z.string().describe("Pagination cursor from a previous response").optional(),
        limit: z.number().describe("Maximum number of items to return").optional(),
      },
      outputSchema: {
        data: z.array(z.object({ id: z.string().describe("The id of the webhook event"), webhookId: z.string().describe("The id of the webhook"), orgId: z.string().describe("The id of the organization"), event: z.enum(['email.queued', 'email.scheduled', 'email.processed', 'email.sending', 'email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained', 'email.rejected', 'email.deliveryDelayed', 'email.failed', 'email.renderingFailed', 'email.subscribed', 'email.unsubscribed', 'message.received', 'message.security.flagged', 'message.agent.triggered', 'message.sent', 'message.rejected']).describe("An event"), successfulAt: z.string().describe("The timestamp when the event was successfully delivered to the endpoint").optional(), data: z.record(z.string(), z.unknown()), status: z.enum(['success', 'pending', 'failed']).describe("Status of the webhook delivery attempt") })),
        nextCursor: z.string().optional(),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const page = await nuntly.webhooks.events.list({ cursor: args.cursor, limit: args.limit } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // POST /webhooks/{id}/events/{eventId}/replay
  server.registerTool(
    'replay-webhook-event',
    {
      title: "Replay Webhook Event",
      description: "Re-deliver a webhook event to its endpoint. Useful for retrying failed deliveries.",
      inputSchema: {
        id: z.string().describe("The webhooks event ID"),
        eventId: z.string().describe("The eventId"),
      },
      outputSchema: {
      },
      annotations: {"openWorldHint":true},
    },
    async (args) => {
      try {
        const id = String(args.id);
        const eventId = String(args.eventId);
        await nuntly.webhooks.events.replay(id, eventId);
        return formatStructuredResult({});
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
