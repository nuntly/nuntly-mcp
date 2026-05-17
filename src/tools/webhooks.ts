import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly, CreateWebhookRequest, CursorPageParams, UpdateWebhookRequest } from '@nuntly/sdk';
import { formatStructuredResult, formatError } from '../helpers.js';

export function registerWebhooksTools(server: McpServer, nuntly: Nuntly): void {

  // POST /webhooks
  server.registerTool(
    'create-webhook',
    {
      description: "Register an endpoint to start receiving webhook events for your organization.",
      inputSchema: {
        name: z.string().describe("The name of the webhook").optional(),
        endpointUrl: z.string().describe("The endpoint URL of the webhook"),
        status: z.enum(['enabled', 'disabled']).describe("The status of the webhook.").optional(),
        events: z.array(z.enum(['email.queued', 'email.scheduled', 'email.processed', 'email.sending', 'email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained', 'email.rejected', 'email.deliveryDelayed', 'email.failed', 'email.renderingFailed', 'email.subscribed', 'email.unsubscribed', 'message.received', 'message.security.flagged', 'message.agent.triggered', 'message.sent', 'message.rejected'])).describe("The event types to subscribe to"),
      },
      outputSchema: {
        id: z.string().describe("The id of the webhook"),
        name: z.string().describe("The name of the webhook").optional(),
        endpointUrl: z.string().describe("The endpoint URL of the webhook"),
        status: z.enum(['enabled', 'disabled', 'revoked']).describe("The status of the webhook."),
        events: z.array(z.enum(['email.queued', 'email.scheduled', 'email.processed', 'email.sending', 'email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained', 'email.rejected', 'email.deliveryDelayed', 'email.failed', 'email.renderingFailed', 'email.subscribed', 'email.unsubscribed', 'message.received', 'message.security.flagged', 'message.agent.triggered', 'message.sent', 'message.rejected'])).describe("The event types to subscribe to"),
        signingSecret: z.string().describe("The signing secret of the webhook."),
        createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"),
      },
      annotations: {"openWorldHint":true},
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
      description: "Remove a webhook endpoint. No further events will be delivered to this URL.",
      inputSchema: {
        id: z.string().describe("The webhook ID"),
      },
      outputSchema: {
        id: z.string().describe("The id of the webhook"),
      },
      annotations: {"openWorldHint":true,"destructiveHint":true},
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
      description: "Returns all registered webhook endpoints for the organization.",
      inputSchema: {
        cursor: z.string().describe("Pagination cursor from a previous response").optional(),
        limit: z.number().describe("Maximum number of items to return").optional(),
      },
      outputSchema: {
        data: z.array(z.record(z.string(), z.unknown())),
        nextCursor: z.string().optional(),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
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
      description: "Returns a webhook endpoint with its URL, subscribed events, and configuration.",
      inputSchema: {
        id: z.string().describe("The webhook ID"),
      },
      outputSchema: {
        id: z.string().describe("The id of the webhook"),
        name: z.string().describe("The name of the webhook").optional(),
        endpointUrl: z.string().describe("The endpoint URL of the webhook"),
        events: z.array(z.enum(['email.queued', 'email.scheduled', 'email.processed', 'email.sending', 'email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained', 'email.rejected', 'email.deliveryDelayed', 'email.failed', 'email.renderingFailed', 'email.subscribed', 'email.unsubscribed', 'message.received', 'message.security.flagged', 'message.agent.triggered', 'message.sent', 'message.rejected'])).describe("The event types to subscribe to"),
        status: z.enum(['enabled', 'disabled', 'revoked']).describe("The status of the webhook."),
        createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
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
      description: "Update the endpoint URL, subscribed event types, or rotate the signing secret.",
      inputSchema: {
        id: z.string().describe("The webhook ID"),
        name: z.string().describe("The name of the webhook").optional(),
        endpointUrl: z.string().describe("The endpoint URL of the webhook").optional(),
        events: z.array(z.enum(['email.queued', 'email.scheduled', 'email.processed', 'email.sending', 'email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained', 'email.rejected', 'email.deliveryDelayed', 'email.failed', 'email.renderingFailed', 'email.subscribed', 'email.unsubscribed', 'message.received', 'message.security.flagged', 'message.agent.triggered', 'message.sent', 'message.rejected'])).describe("The event types to subscribe to").optional(),
        status: z.enum(['enabled', 'disabled']).describe("The status of the webhook.").optional(),
        rotateSecret: z.boolean().describe("If true, a new signing secret will be generated").optional(),
      },
      outputSchema: {
        id: z.string().describe("The id of the webhook"),
        signingSecret: z.string().describe("The signing secret of the webhook.").optional(),
      },
      annotations: {"openWorldHint":true},
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
