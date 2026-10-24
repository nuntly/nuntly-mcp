import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CursorPageParams, Nuntly } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';

export function registerWebhooksEventsTools(server: McpServer, nuntly: Nuntly): void {
  // GET /webhooks/{id}/events/{eventId}/deliveries
  server.registerTool(
    'list-webhook-event-deliveries',
    {
      title: 'List Webhook Event Deliveries',
      description:
        'Lists the delivery attempts of a webhook event to an endpoint, with the status, HTTP response code, response data, and delivery time of each attempt.',
      inputSchema: z
        .object({
          id: z.string().describe('The webhook ID'),
          eventId: z.string().describe('The eventId'),
        })
        .strict(),
      outputSchema: z
        .object({
          data: z.array(
            z
              .object({
                id: z.string(),
                deliveredAt: z.string(),
                code: z.string(),
                status: z.enum(['pending', 'success', 'failed']).or(z.string()),
                response: z.record(z.string(), z.unknown()),
              })
              .passthrough(),
          ),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const id = String(args.id);
        const eventId = String(args.eventId);
        const result = await nuntly.webhooks.events.deliveries.list(id, eventId);
        return formatStructuredResult({ data: result });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /webhooks/events
  server.registerTool(
    'list-webhook-events',
    {
      title: 'List Webhook Events',
      description:
        'Lists the webhook events of the last 48 hours across all your endpoints, with their delivery status and payload. Results use cursor pagination.',
      inputSchema: z
        .object({
          cursor: z.string().describe('Pagination cursor from a previous response').optional(),
          limit: z.number().describe('Maximum number of items to return').optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          data: z.array(
            z
              .object({
                id: z.string().describe('The id of the webhook event'),
                webhookId: z.string().describe('The id of the webhook'),
                orgId: z.string().describe('The id of the organization'),
                event: z
                  .enum([
                    'email.queued',
                    'email.scheduled',
                    'email.processed',
                    'email.sending',
                    'email.sent',
                    'email.delivered',
                    'email.opened',
                    'email.clicked',
                    'email.bounced',
                    'email.complained',
                    'email.rejected',
                    'email.deliveryDelayed',
                    'email.failed',
                    'email.renderingFailed',
                    'email.subscribed',
                    'email.unsubscribed',
                    'message.received',
                    'message.security.flagged',
                    'message.agent.triggered',
                    'message.sent',
                    'message.rejected',
                  ])
                  .or(z.string())
                  .describe('An event'),
                successfulAt: z
                  .string()
                  .describe('The timestamp when the event was successfully delivered to the endpoint')
                  .optional(),
                data: z.record(z.string(), z.unknown()),
                status: z
                  .enum(['success', 'pending', 'failed'])
                  .or(z.string())
                  .describe('Status of the webhook delivery attempt'),
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
      title: 'Replay Webhook Event',
      description:
        'Queues a new delivery of a past webhook event to the endpoint. The request is accepted asynchronously and returns 202 before the delivery runs.',
      inputSchema: z
        .object({
          id: z.string().describe('The webhook ID'),
          eventId: z.string().describe('The eventId'),
        })
        .strict(),
      outputSchema: z.object({}).passthrough(),
      annotations: { openWorldHint: true },
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
