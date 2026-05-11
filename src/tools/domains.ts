import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly } from '@nuntly/sdk';
import { formatResult, formatError } from '../helpers.js';

export function registerDomainsTools(server: McpServer, nuntly: Nuntly): void {

  // POST /domains
  server.tool(
    'create-domain',
    "Add a domain to start configuring DNS records for sending or receiving emails.",
    {
    name: z.string().describe("The name of the domain to send e-mails'"),
    sending: z.boolean().describe("Enable sending").optional(),
    receiving: z.boolean().describe("Enable receiving").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const body = args;
        const result = await nuntly.domains.create(body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /domains/{id}
  server.tool(
    'delete-domain',
    "Permanently deletes a domain along with its inboxes, received messages, attachments, and sending configuration. This action is irreversible.",
    {
    id: z.string().describe("The domain ID"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const result = await nuntly.domains.delete(id);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /domains
  server.tool(
    'list-domains',
    "Returns all domains with their verification and capability status.",
    {
    cursor: z.string().describe("Pagination cursor from a previous response").optional(),
    limit: z.number().describe("Maximum number of items to return").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const page = await nuntly.domains.list({ cursor: args.cursor, limit: args.limit } as any);
        return formatResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /domains/{id}
  server.tool(
    'retrieve-domain',
    "Returns a domain with its DNS record configuration and current verification status for each record.",
    {
    id: z.string().describe("The domain ID"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const result = await nuntly.domains.retrieve(id);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /domains/{id}
  server.tool(
    'update-domain',
    "Toggle sending, receiving, open tracking, or click tracking capabilities for a domain.",
    {
    id: z.string().describe("The domain ID"),
    openTracking: z.boolean().describe("Emit an event for each recipient opens an email their email client").optional(),
    clickTracking: z.boolean().describe("Emit an event for each time the recipient clicks a link in the email").optional(),
    sending: z.boolean().describe("Enable or disable sending").optional(),
    receiving: z.boolean().describe("Enable or disable receiving").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const { id: _id, ...body } = args;
        const result = await nuntly.domains.update(id, body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
