import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CreateWebhookRequest, CursorPageParams, Nuntly, UpdateWebhookRequest } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';
import {
  eventTypeOutput,
  webhookDisabledReasonOutput,
  webhookEventTypeInput,
  webhookMutableStatusInput,
  webhookStatusOutput,
} from '../schemas.js';

export function registerWebhooksTools(server: McpServer, nuntly: Nuntly): void {
  // POST /webhooks
  server.registerTool(
    'create-webhook',
    {
      title: 'Create Webhook',
      description:
        'Registers an HTTPS endpoint to receive the event types you subscribe to. The response includes the signing secret used to verify webhook payloads.',
      inputSchema: z
        .object({
          name: z.string().describe('The name of the webhook').optional(),
          endpointUrl: z.string().describe('The endpoint URL of the webhook'),
          status: webhookMutableStatusInput().describe('The status of the webhook.').optional(),
          events: z.array(webhookEventTypeInput()).describe('The event types to subscribe to'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the webhook'),
          name: z.string().describe('The name of the webhook').optional(),
          endpointUrl: z.string().describe('The endpoint URL of the webhook'),
          status: webhookStatusOutput().describe('The status of the webhook.'),
          disabledReason: webhookDisabledReasonOutput()
            .nullable()
            .describe('The reason the webhook was disabled, or `null` if it is not disabled.'),
          disabledAt: z
            .string()
            .nullable()
            .describe('The timestamp when the webhook was disabled, or `null` if it is not disabled.'),
          events: z.array(eventTypeOutput()).describe('The event types to subscribe to'),
          signingSecret: z.string().describe('The signing secret of the webhook.'),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const body = args;
        const result = await nuntly.webhooks.create(body as CreateWebhookRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /webhooks/{id}
  server.registerTool(
    'delete-webhook',
    {
      title: 'Delete Webhook',
      description:
        'Permanently deletes a webhook endpoint. Events are no longer delivered to its URL after deletion. This cannot be undone.',
      inputSchema: z
        .object({
          id: z.string().describe('The webhook ID'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the webhook'),
        })
        .passthrough(),
      annotations: { openWorldHint: true, destructiveHint: true },
    },
    async (args) => {
      try {
        const id = String(args.id);
        const result = await nuntly.webhooks.delete(id);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /webhooks
  server.registerTool(
    'list-webhooks',
    {
      title: 'List Webhooks',
      description:
        'Lists the webhook endpoints of your organization, newest first, with cursor pagination. Each entry shows its URL, event types, and status.',
      inputSchema: z
        .object({
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
                id: z.string().describe('The id of the webhook'),
                name: z.string().describe('The name of the webhook').optional(),
                endpointUrl: z.string().describe('The endpoint URL of the webhook'),
                status: webhookStatusOutput().describe('The status of the webhook.'),
                disabledReason: webhookDisabledReasonOutput()
                  .nullable()
                  .describe('The reason the webhook was disabled, or `null` if it is not disabled.'),
                disabledAt: z
                  .string()
                  .nullable()
                  .describe('The timestamp when the webhook was disabled, or `null` if it is not disabled.'),
                events: z.array(eventTypeOutput()).describe('The event types to subscribe to'),
                createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
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
        const page = await nuntly.webhooks.list({ cursor: args.cursor, limit: args.limit } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /webhooks/{id}
  server.registerTool(
    'retrieve-webhook',
    {
      title: 'Retrieve Webhook',
      description:
        'Retrieves a webhook endpoint with its URL, subscribed event types, status, and the reason and time it was disabled, if it is disabled.',
      inputSchema: z
        .object({
          id: z.string().describe('The webhook ID'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the webhook'),
          name: z.string().describe('The name of the webhook').optional(),
          endpointUrl: z.string().describe('The endpoint URL of the webhook'),
          events: z.array(eventTypeOutput()).describe('The event types to subscribe to'),
          status: webhookStatusOutput().describe('The status of the webhook.'),
          disabledReason: webhookDisabledReasonOutput()
            .nullable()
            .describe('The reason the webhook was disabled, or `null` if it is not disabled.'),
          disabledAt: z
            .string()
            .nullable()
            .describe('The timestamp when the webhook was disabled, or `null` if it is not disabled.'),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const id = String(args.id);
        const result = await nuntly.webhooks.retrieve(id);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /webhooks/{id}
  server.registerTool(
    'update-webhook',
    {
      title: 'Update Webhook',
      description:
        'Updates the name, URL, event types, or status of a webhook, or rotates its signing secret. The new secret is returned only when you rotate it.',
      inputSchema: z
        .object({
          id: z.string().describe('The webhook ID'),
          name: z.string().describe('The name of the webhook').optional(),
          endpointUrl: z.string().describe('The endpoint URL of the webhook').optional(),
          events: z.array(webhookEventTypeInput()).describe('The event types to subscribe to').optional(),
          status: webhookMutableStatusInput().describe('The status of the webhook.').optional(),
          rotateSecret: z.boolean().describe('If true, a new signing secret will be generated').optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the webhook'),
          signingSecret: z.string().describe('The signing secret of the webhook.').optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const id = String(args.id);
        const { id: _id, ...body } = args;
        const result = await nuntly.webhooks.update(id, body as UpdateWebhookRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
