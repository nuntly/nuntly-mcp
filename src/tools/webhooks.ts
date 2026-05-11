import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly } from '@nuntly/sdk';
import { formatResult, formatError } from '../helpers.js';

export function registerWebhooksTools(server: McpServer, nuntly: Nuntly): void {

  // POST /webhooks
  server.tool(
    'create-webhook',
    "Register an endpoint to start receiving webhook events for your organization.",
    {
    name: z.string().describe("The name of the webhook").optional(),
    endpointUrl: z.string().describe("The endpoint URL of the webhook"),
    status: z.enum(['enabled', 'disabled']).describe("The status of the webhook.").optional(),
    events: z.array(z.enum(['email.queued', 'email.scheduled', 'email.processed', 'email.sending', 'email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained', 'email.rejected', 'email.deliveryDelayed', 'email.failed', 'email.renderingFailed', 'email.subscribed', 'email.unsubscribed', 'message.received', 'message.security.flagged', 'message.agent.triggered', 'message.sent', 'message.rejected'])).describe("The event types to subscribe to"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const body = args;
        const result = await nuntly.webhooks.create(body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /webhooks/{id}
  server.tool(
    'delete-webhook',
    "Remove a webhook endpoint. No further events will be delivered to this URL.",
    {
    id: z.string().describe("The webhook ID"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const result = await nuntly.webhooks.delete(id);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /webhooks
  server.tool(
    'list-webhooks',
    "Returns all registered webhook endpoints for the organization.",
    {
    cursor: z.string().describe("Pagination cursor from a previous response").optional(),
    limit: z.number().describe("Maximum number of items to return").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const page = await nuntly.webhooks.list({ cursor: args.cursor, limit: args.limit } as any);
        return formatResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /webhooks/{id}
  server.tool(
    'retrieve-webhook',
    "Returns a webhook endpoint with its URL, subscribed events, and configuration.",
    {
    id: z.string().describe("The webhook ID"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const result = await nuntly.webhooks.retrieve(id);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PUT /webhooks/{id}
  server.tool(
    'update-webhook',
    "Update the endpoint URL, subscribed event types, or rotate the signing secret.",
    {
    id: z.string().describe("The webhook ID"),
    name: z.string().describe("The name of the webhook").optional(),
    endpointUrl: z.string().describe("The endpoint URL of the webhook").optional(),
    events: z.array(z.enum(['email.queued', 'email.scheduled', 'email.processed', 'email.sending', 'email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained', 'email.rejected', 'email.deliveryDelayed', 'email.failed', 'email.renderingFailed', 'email.subscribed', 'email.unsubscribed', 'message.received', 'message.security.flagged', 'message.agent.triggered', 'message.sent', 'message.rejected'])).describe("The event types to subscribe to").optional(),
    status: z.enum(['enabled', 'disabled']).describe("The status of the webhook.").optional(),
    rotateSecret: z.boolean().describe("If true, a new signing secret will be generated").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const { id: _id, ...body } = args;
        const result = await nuntly.webhooks.update(id, body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
